"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Package, MessageSquare, LogOut, ChevronRight, Menu, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/app/actions/auth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Shipments", href: "/admin/shipments", icon: Package },
    { label: "Contact Messages", href: "/admin/contacts", icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState("");

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (!data.user) { router.push("/login?redirect=/admin"); return; }
            setUser(data.user.email ?? "Admin");
        });
        setCurrent(window.location.pathname);
    }, []);

    return (
        <div className="min-h-screen bg-surface-50 flex">
            {/* ── Sidebar (desktop) ── */}
            <aside className="hidden lg:flex flex-col w-64 bg-ink-900 border-r border-white/[0.06] fixed inset-y-0 left-0 z-40">
                <div className="p-6 border-b border-white/[0.06]">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-red-brand rounded-xl flex items-center justify-center shadow-md shadow-red-brand/30">
                            <Package className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <span className="text-white font-bold text-sm block" style={{ fontFamily: "Space Grotesk, sans-serif" }}>PAN African Express</span>
                            <span className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">Admin Panel</span>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group",
                                current === item.href
                                    ? "bg-red-brand text-white shadow-md shadow-red-brand/30"
                                    : "text-white/50 hover:text-white hover:bg-white/8"
                            )}>
                            <item.icon className="w-4 h-4" />
                            {item.label}
                            {current === item.href && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/[0.06]">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-red-brand flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {user?.[0]?.toUpperCase() ?? "A"}
                        </div>
                        <div className="min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{user}</p>
                            <p className="text-white/30 text-[10px]">Administrator</p>
                        </div>
                    </div>
                    <button onClick={() => signOut()}
                        className="w-full flex items-center gap-2 px-4 py-3 text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-xl text-sm font-semibold transition-all">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* ── Mobile top bar ── */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-ink-900 border-b border-white/[0.06] flex items-center justify-between px-5 py-4">
                <span className="text-white font-bold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>PAX Admin</span>
                <button onClick={() => setOpen(!open)} className="text-white/60 hover:text-white transition-colors">
                    {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* ── Mobile drawer ── */}
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-ink-900 border-r border-white/[0.06] flex flex-col pt-16">
                        <nav className="flex-1 p-4 space-y-1">
                            {navItems.map((item) => (
                                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                                        current === item.href ? "bg-red-brand text-white" : "text-white/50 hover:text-white hover:bg-white/8"
                                    )}>
                                    <item.icon className="w-4 h-4" />{item.label}
                                </Link>
                            ))}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main content ── */}
            <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 overflow-auto">
                {children}
            </main>
        </div>
    );
}
