"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
    LayoutDashboard, Package, MessageSquare,
    LogOut, ChevronRight, Menu, X, Shield, Users, Activity, Truck, Terminal
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/app/actions/auth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
    { label: "Command Center", href: "/admin", icon: LayoutDashboard },
    { label: "Payload Matrix", href: "/admin/shipments", icon: Package },
    { label: "Fleet Strategic", href: "/admin/fleet", icon: Truck },
    { label: "Merchant Node", href: "/admin/merchants", icon: Users },
    { label: "Registry Hub", href: "/admin/users", icon: Users },
    { label: "Finance Sync", href: "/admin/settlements", icon: Activity },
    { label: "Relay Comms", href: "/admin/contacts", icon: MessageSquare },
    { label: "Neural Audit", href: "/admin/verify", icon: Shield },
    { label: "Engine Vault", href: "/admin/logs", icon: Terminal },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/login?redirect=/admin"); return; }

            const { data: profile } = await (supabase as any)
                .from("profiles")
                .select("account_type")
                .eq("id", user.id)
                .single();

            if (profile?.account_type !== "admin") {
                // If they are not admin, send them to their respective dashboard
                if (profile?.account_type === "business") router.push("/dashboard");
                else router.push("/account");
                return;
            }

            setUser(user.email ?? "Admin");
        };
        checkAdmin();
    }, [router]);

    // Close mobile menu on route change
    useEffect(() => { setOpen(false); }, [pathname]);

    const isActive = (href: string) =>
        href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

    const NavLinks = () => (
        <>
            <nav className="flex-1 p-5 space-y-1.5 overflow-y-auto">
                <div className="flex items-center gap-2 px-4 mb-6">
                    <div className="w-1 h-3 bg-red-brand rounded-full" />
                    <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.4em]">Operations Grid</p>
                </div>
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link key={item.href} href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3.5 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all group relative overflow-hidden",
                                active
                                    ? "bg-red-brand text-white shadow-xl shadow-red-brand/20 border border-white/20"
                                    : "text-white/30 hover:text-white hover:bg-white/[0.03] border border-transparent hover:border-white/5"
                            )}>
                            <item.icon className={cn("w-4.5 h-4.5 transition-transform group-hover:scale-110", active ? "text-white" : "text-white/20 group-hover:text-red-brand")} />
                            <span className="flex-1">{item.label}</span>
                            {active && <div className="absolute left-0 w-1 h-6 bg-white rounded-full translate-x-1" />}
                            {active && <ChevronRight className="w-3.5 h-3.5 opacity-40" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-white/[0.04] bg-white/[0.02]">
                <div className="flex items-center gap-4 px-2 mb-6">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-white/10 to-transparent border border-white/10 flex items-center justify-center text-white font-black text-xs shadow-lg">
                            {user?.[0]?.toUpperCase() ?? "A"}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#111116] bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-white text-xs font-black tracking-tight truncate">{user}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Shield className="w-2.5 h-2.5 text-red-brand" />
                            <p className="text-white/20 text-[9px] font-black uppercase tracking-widest">Global Admin</p>
                        </div>
                    </div>
                </div>
                <button onClick={() => signOut()}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3.5 text-white/30 hover:text-red-400 hover:bg-red-400/5 border border-transparent hover:border-red-400/20 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                    <LogOut className="w-4 h-4" /> Terminate Session
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-[#0c0c10] flex">

            {/* ── Desktop Sidebar ── */}
            <aside className="hidden lg:flex flex-col w-72 bg-[#111116]/95 backdrop-blur-3xl border-r border-white/5 fixed inset-y-0 left-0 z-40 transition-all">
                <div className="px-8 py-10 border-b border-white/[0.04]">
                    <Link href="/" className="flex items-center gap-4 group">
                        <div className="w-12 h-12 bg-red-brand rounded-[1.25rem] flex items-center justify-center shadow-[0_10px_30px_rgba(235,0,0,0.3)] group-hover:rotate-6 transition-all ring-4 ring-white/5">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <span className="text-2xl font-black text-white block tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                PAN
                            </span>
                            <span className="text-white/20 text-[9px] uppercase tracking-[0.4em] font-black flex items-center gap-1.5">
                                <Activity className="w-2.5 h-2.5 text-red-brand" /> African Express
                            </span>
                        </div>
                    </Link>
                </div>
                <NavLinks />
            </aside>

            {/* ── Mobile Top Bar ── */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#111116] border-b border-white/[0.06] flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-red-brand rounded-lg flex items-center justify-center">
                        <Package className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-white font-bold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>PAX Admin</span>
                </div>
                <button onClick={() => setOpen(!open)} className="text-white/60 hover:text-white transition-colors p-1">
                    {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* ── Mobile Drawer + Backdrop ── */}
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                            onClick={() => setOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#111116] border-r border-white/[0.06] flex flex-col pt-14"
                        >
                            <NavLinks />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ── Main Content ── */}
            <main className="flex-1 lg:ml-72 pt-14 lg:pt-0 min-h-screen overflow-auto bg-[#0a0a0e]">
                {children}
            </main>
        </div>
    );
}
