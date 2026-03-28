"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Zap, Package, BarChart3, User,
    LogOut, Menu, X, ChevronRight,
    Radio, Activity, Navigation
} from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/app/actions/auth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV = [
    { label: "Cockpit", href: "/rider", icon: Zap },
    { label: "On-Demand Jobs", href: "/rider/on-demand", icon: Navigation },
    { label: "My Dispatch", href: "/rider/dispatch", icon: Package },
    { label: "Performance", href: "/rider/performance", icon: BarChart3 },
    { label: "Profile", href: "/rider/profile", icon: User },
];

export default function RiderClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [rider, setRider] = useState<{ name: string; email: string; avatar_url?: string } | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data, error: authError } = await supabase.auth.getUser();
                if (authError || !data.user) {
                    router.push("/login?redirect=/rider");
                    return;
                }

                const name = (data.user.user_metadata?.full_name as string)
                    || data.user.email?.split("@")[0]
                    || "Rider";

                // Fetch avatar_url — gracefully handles missing column (migration not run yet)
                let avatarUrl: string | undefined;
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { data: riderRow, error: dbError } = await (supabase as any)
                        .from("riders")
                        .select("avatar_url")
                        .eq("user_id", data.user.id)
                        .maybeSingle();

                    if (!dbError && riderRow?.avatar_url) {
                        avatarUrl = riderRow.avatar_url.split("?")[0];
                    }
                } catch (dbErr) {
                    console.warn("[PAX Rider] Could not fetch avatar_url:", dbErr);
                }

                setRider({ name, email: data.user.email ?? "", avatar_url: avatarUrl });
            } catch (err) {
                console.warn("[PAX Rider Auth] Session sync interrupted (expected in multi-tab):", err);
            }
        };

        checkAuth();
    }, [router]);

    useEffect(() => { setOpen(false); }, [pathname]);

    // ── Register Service Worker for PWA ────────────────────────
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/rider-sw.js", { scope: "/rider" })
                .then(reg => console.log("[PAX Rider PWA] SW registered:", reg.scope))
                .catch(err => console.warn("[PAX Rider PWA] SW registration failed:", err));
        }
    }, []);

    const isActive = (href: string) =>
        href === "/rider" ? pathname === "/rider" : pathname.startsWith(href);

    const initials = rider?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "R";

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="px-6 py-8 border-b border-white/[0.06]">
                <Link href="/rider" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-[#eb0000] rounded-[1rem] flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-105 transition-transform ring-4 ring-white/5">
                        <Radio className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-white font-black text-sm leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            PAX Rider
                        </p>
                        <p className="text-white/25 text-[9px] uppercase tracking-[0.35em] font-bold flex items-center gap-1 mt-0.5">
                            <Activity className="w-2.5 h-2.5 text-[#eb0000]" /> Hub v2.0
                        </p>
                    </div>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
                <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em] px-3 mb-3">Navigation</p>
                {NAV.map(item => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all group",
                                active
                                    ? "bg-[#eb0000] text-white shadow-lg shadow-[#eb0000]/25"
                                    : "text-white/35 hover:text-white hover:bg-white/[0.06]"
                            )}
                        >
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1 text-[11px]">{item.label}</span>
                            {active && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Status indicator */}
            <div className="px-4 pb-2">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Hub Sync Active</span>
                </div>
            </div>

            {/* User / sign-out */}
            <div className="px-3 pb-5 pt-3 border-t border-white/[0.06] mt-1">
                <div className="flex items-center gap-3 px-3 py-2 mb-1">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                        {rider?.avatar_url ? (
                            <Image
                                src={rider.avatar_url}
                                alt={rider.name}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full bg-[#eb0000] flex items-center justify-center text-white font-black text-xs">
                                {initials}
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-white text-xs font-bold truncate">{rider?.name}</p>
                        <p className="text-white/25 text-[10px] truncate">{rider?.email}</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                >
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0e] flex">

            {/* ── Desktop Sidebar ── */}
            <aside className="hidden lg:flex flex-col w-64 bg-[#0d0d12]/95 backdrop-blur-3xl border-r border-white/[0.06] fixed inset-y-0 left-0 z-40">
                <SidebarContent />
            </aside>

            {/* ── Mobile Top Bar ── */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#0d0d12]/95 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-5">
                <Link href="/rider" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-[#eb0000] rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                        <Radio className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-black text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>PAX Rider</span>
                </Link>
                <button
                    onClick={() => setOpen(!open)}
                    className="text-white/50 hover:text-white transition-colors p-1"
                >
                    {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* ── Mobile Slide-over (from left, like sidebar) ── */}
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
                            onClick={() => setOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 320, damping: 30 }}
                            className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#0d0d12] border-r border-white/[0.06] flex flex-col pt-14"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ── Main Content ── */}
            <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen overflow-y-auto">
                {children}
            </main>

        </div>
    );
}

