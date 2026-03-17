"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard, Package, Wallet, BarChart3,
    Settings, LogOut, Menu, X, ChevronRight,
    Store, Bell, ExternalLink, Code2, Zap, Bike
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/app/actions/auth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "New Booking", href: "/dashboard/book", icon: Zap },
    { label: "Shipments", href: "/dashboard/shipments", icon: Package },
    { label: "Wallet", href: "/dashboard/wallet", icon: Wallet },
    { label: "Developers", href: "/dashboard/developer", icon: Code2 },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

import { NotificationBell } from "@/components/NotificationBell";
import { PushSubscriptionManager } from "@/components/PushSubscriptionManager";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<{ email: string; name: string; role?: string } | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data }) => {
            if (!data.user) { router.push("/login?redirect=/dashboard"); return; }
            const name = (data.user.user_metadata?.full_name as string) || data.user.email?.split("@")[0] || "Merchant";
            setUser({ email: data.user.email ?? "", name });

            // Onboarding check — only for business users who haven't filled in company_name yet
            // Skip if already on the onboarding page to prevent redirect loop
            if (pathname.startsWith("/dashboard/onboarding") || pathname.startsWith("/dashboard/book")) return;

            const { data: profile } = await (supabase.from("profiles") as any)
                .select("account_type, phone")
                .eq("id", data.user.id)
                .single();

            // If business account and no phone on record → first time → redirect to onboarding
            if (profile?.account_type === "business" && !profile?.phone) {
                router.push("/dashboard/onboarding");
            }

            setUser(u => u ? { ...u, role: profile?.account_type } : null);
        });
    }, [router, pathname]);

    const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "M";

    const isActive = (href: string) =>
        href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="px-6 py-5 border-b border-white/[0.07] flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 bg-red-brand rounded-xl flex items-center justify-center shadow-lg shadow-red-brand/30 group-hover:scale-105 transition-transform">
                        <Store className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            PAX Business
                        </p>
                        <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">Merchant Portal</p>
                    </div>
                </Link>
                <NotificationBell />
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                <p className="text-white/20 text-[9px] font-bold uppercase tracking-[0.3em] px-3 mb-3">Main Menu</p>
                {NAV.map(item => {
                    const active = isActive(item.href);
                    return (
                        <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group",
                                active
                                    ? "bg-red-brand text-white shadow-lg shadow-red-brand/25"
                                    : "text-white/45 hover:text-white hover:bg-white/[0.07]"
                            )}>
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                        </Link>
                    );
                })}

                <div className="my-4 border-t border-white/[0.06]" />
                <p className="text-white/20 text-[9px] font-bold uppercase tracking-[0.3em] px-3 mb-3">Quick Links</p>
                <Link href="/dashboard/book" onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/45 hover:text-white hover:bg-white/[0.07] transition-all">
                    <Package className="w-4 h-4" />
                    <span className="flex-1">Book Shipment</span>
                </Link>
                <Link href="/tracking" onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/45 hover:text-white hover:bg-white/[0.07] transition-all">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="flex-1">Track Parcel</span>
                    <ExternalLink className="w-3 h-3 opacity-40" />
                </Link>

                {user?.role === "personal" && (
                    <Link href="/riders/apply" onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-brand/70 hover:text-red-brand hover:bg-red-brand/5 transition-all mt-2 border border-red-brand/10">
                        <Bike className="w-4 h-4" />
                        <span className="flex-1">Become a Rider</span>
                        <Zap className="w-3 h-3 animate-pulse" />
                    </Link>
                )}
            </nav>

            {/* User / sign-out */}
            <div className="px-3 pb-4 border-t border-white/[0.07] pt-4">
                <div className="flex items-center gap-3 px-3 py-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-red-brand flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
                        <p className="text-white/30 text-[10px] truncate">{user?.email}</p>
                    </div>
                </div>
                <button onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-xl text-sm font-semibold transition-all">
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-[#0c0c10] flex">

            {/* ── Desktop sidebar ── */}
            <aside className="hidden lg:flex flex-col w-60 bg-[#111116] border-r border-white/[0.06] fixed inset-y-0 left-0 z-40">
                <SidebarContent />
            </aside>

            {/* ── Mobile top bar ── */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#111116] border-b border-white/[0.06] flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-red-brand rounded-lg flex items-center justify-center">
                        <Store className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-white font-bold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>PAX Business</span>
                </div>
                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <button onClick={() => setOpen(!open)} className="text-white/60 hover:text-white transition-colors p-1">
                        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* ── Mobile slide-over ── */}
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                            onClick={() => setOpen(false)} />
                        <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#111116] border-r border-white/[0.06] flex flex-col pt-14">
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ── Main content — Boxed layout ── */}
            <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 h-screen overflow-y-auto relative">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-brand/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 p-4 lg:p-8">
                    {/* Header info / Breadcrumb */}
                    <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-full px-3 py-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-brand animate-pulse" />
                                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                                    {NAV.find(n => isActive(n.href))?.label ?? "Dashboard"}
                                </span>
                            </div>
                        </div>
                        <div className="text-white/20 text-[10px] font-bold uppercase tracking-wider hidden sm:block">
                            Pan Africa Express v2.0
                        </div>
                    </div>

                    {/* Main Boxed Container */}
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-[#111116]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2rem] shadow-2xl shadow-black/60 overflow-hidden min-h-[calc(100vh-12rem)]">
                            {children}
                        </div>

                        {/* Footer info in box layout */}
                        <div className="mt-6 text-center text-white/10 text-[10px] font-medium uppercase tracking-[0.2em]">
                            &copy; 2024 Pan Africa Express. All rights reserved.
                        </div>
                    </div>
                </div>
            </main>
            <PushSubscriptionManager />
        </div>
    );
}
