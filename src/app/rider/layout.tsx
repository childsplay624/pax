"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Zap, Package, BarChart3, User,
    LogOut, Menu, X, Radio, ChevronRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/app/actions/auth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV = [
    { label: "Cockpit", href: "/rider", icon: Zap },
    { label: "My Dispatch", href: "/rider/dispatch", icon: Package },
    { label: "Performance", href: "/rider/performance", icon: BarChart3 },
    { label: "Profile", href: "/rider/profile", icon: User },
];

export default function RiderLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [rider, setRider] = useState<{ name: string; email: string } | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (!data.user) { router.push("/login?redirect=/rider"); return; }
            const name = (data.user.user_metadata?.full_name as string)
                || data.user.email?.split("@")[0]
                || "Rider";
            setRider({ name, email: data.user.email ?? "" });
        });
    }, [router]);

    useEffect(() => { setOpen(false); }, [pathname]);

    const isActive = (href: string) =>
        href === "/rider" ? pathname === "/rider" : pathname.startsWith(href);

    const initials = rider?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "R";

    const Nav = ({ mobile = false }: { mobile?: boolean }) => (
        <nav className={cn("flex px-3 gap-1", mobile ? "flex-col py-4" : "items-center")}>
            {NAV.map(item => {
                const active = isActive(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                            "flex items-center gap-3 rounded-2xl font-black uppercase tracking-widest transition-all",
                            mobile ? "px-4 py-4 text-[11px]" : "px-5 py-2.5 text-[10px]",
                            active
                                ? "bg-[#eb0000] text-white shadow-lg shadow-red-brand/20"
                                : "text-white/30 hover:text-white hover:bg-white/[0.05]"
                        )}
                    >
                        <item.icon className={cn("flex-shrink-0", mobile ? "w-5 h-5" : "w-4 h-4")} />
                        <span>{item.label}</span>
                        {active && mobile && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />}
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0e] flex flex-col">

            {/* ── Top Navigation Bar ── */}
            <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#0d0d12]/90 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-4 gap-4">

                {/* Brand */}
                <Link href="/rider" className="flex items-center gap-2.5 group flex-shrink-0">
                    <div className="w-8 h-8 bg-[#eb0000] rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-105 transition-transform">
                        <Radio className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-white font-black text-sm leading-none" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            PAX Rider
                        </p>
                        <p className="text-white/30 text-[9px] uppercase tracking-[0.3em] font-bold">Hub v2.0</p>
                    </div>
                </Link>

                {/* Desktop Nav (centre) */}
                <div className="hidden md:flex flex-1 justify-center">
                    <Nav />
                </div>

                {/* Right: status + avatar */}
                <div className="flex items-center gap-3 ml-auto">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Hub Sync Active</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#eb0000] flex items-center justify-center text-white font-black text-xs">
                        {initials}
                    </div>
                    <button
                        className="md:hidden text-white/60 hover:text-white transition-colors p-1"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* ── Mobile Drawer ── */}
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
                            onClick={() => setOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 320, damping: 30 }}
                            className="md:hidden fixed right-0 top-14 bottom-0 z-50 w-72 bg-[#0d0d12] border-l border-white/[0.06] flex flex-col"
                        >
                            <Nav mobile />
                            <div className="mt-auto p-6 border-t border-white/[0.06]">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-2xl bg-[#eb0000] flex items-center justify-center text-white font-black text-sm">
                                        {initials}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white font-bold text-sm truncate">{rider?.name}</p>
                                        <p className="text-white/30 text-[10px] truncate">{rider?.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => signOut()}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
                                >
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Main Content ── */}
            <main className="flex-1 pt-14 min-h-screen">
                {children}
            </main>

        </div>
    );
}
