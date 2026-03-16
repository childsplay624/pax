"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Package, TrendingUp, CheckCircle2, AlertCircle,
    ArrowRight, Plus, Search, Wallet, BarChart3,
    ArrowUpRight, ArrowDownRight, Clock, Building2,
} from "lucide-react";
import { getDashboardStats, getDashboardShipments } from "@/app/actions/dashboard";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Shipment } from "@/types/database";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "bg-amber-500/15 text-amber-400 border border-amber-500/20" },
    confirmed: { label: "Confirmed", cls: "bg-blue-500/15 text-blue-400 border border-blue-500/20" },
    collected: { label: "Collected", cls: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20" },
    in_transit: { label: "In Transit", cls: "bg-orange-500/15 text-orange-400 border border-orange-500/20" },
    at_hub: { label: "At Hub", cls: "bg-purple-500/15 text-purple-400 border border-purple-500/20" },
    out_for_delivery: { label: "Out for Delivery", cls: "bg-sky-500/15 text-sky-400 border border-sky-500/20" },
    delivered: { label: "Delivered", cls: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" },
    failed: { label: "Failed", cls: "bg-red-500/15 text-red-400 border border-red-500/20" },
};

/* Shared box/card class */
const BOX = "bg-[#16161e] border border-white/[0.08] rounded-2xl overflow-hidden";
const BOX_HEADER = "flex items-center justify-between px-5 py-4 border-b border-white/[0.07]";

type Stats = Awaited<ReturnType<typeof getDashboardStats>>;

function SkeletonBox() {
    return <div className="h-full w-full bg-white/[0.04] rounded-xl animate-pulse" />;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats>(null);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [userName, setUserName] = useState("Merchant");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            const name = (data.user?.user_metadata?.full_name as string) || data.user?.email?.split("@")[0] || "Merchant";
            setUserName(name);
        });
        Promise.all([getDashboardStats(), getDashboardShipments(1, 6)]).then(([s, sh]) => {
            setStats(s);
            setShipments((sh.shipments as Shipment[]).slice(0, 6));
            setLoading(false);
        });
    }, []);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    const kpis = stats ? [
        { label: "Total Shipments", value: stats.total, icon: Package, color: "text-blue-400", bg: "bg-blue-400/10 border border-blue-400/20", delta: "+8.2%", up: true },
        { label: "Active", value: stats.active, icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10 border border-amber-400/20", delta: "+3", up: true },
        { label: "Delivered", value: stats.delivered, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10 border border-emerald-400/20", delta: "+18.5%", up: true },
        { label: "Failed", value: stats.failed, icon: AlertCircle, color: "text-red-400", bg: "bg-red-400/10 border border-red-400/20", delta: "-0.4%", up: false },
    ] : [];

    const monthlyBars = stats?.monthly
        ? Object.entries(stats.monthly).slice(-6)
        : [];
    const maxBar = Math.max(...(monthlyBars as [string, number][]).map(([, v]) => v), 1);

    const quickActions = [
        { label: "Book Shipment", sub: "New delivery", href: "/dashboard/book", icon: Package, color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "Fund Wallet", sub: "Top up balance", href: "/dashboard/wallet", icon: Wallet, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { label: "Analytics", sub: "Charts & reports", href: "/dashboard/analytics", icon: BarChart3, color: "text-purple-400", bg: "bg-purple-500/10" },
        { label: "All Shipments", sub: "Search & manage", href: "/dashboard/shipments", icon: Search, color: "text-amber-400", bg: "bg-amber-500/10" },
    ];

    return (
        <div className="p-5 lg:p-6 space-y-5">

            {/* ── Row 1: Header box ────────────────────────────────────── */}
            <div className={BOX}>
                <div className="flex items-center justify-between p-5">
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="text-white/35 text-xs font-semibold mb-1 uppercase tracking-wider">{greeting} 👋</p>
                        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            {userName}
                        </h1>
                        <p className="text-white/30 text-xs mt-1">Here&apos;s your business overview for today</p>
                    </motion.div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2">
                            <Building2 className="w-3.5 h-3.5 text-red-brand" />
                            <span className="text-white/50 text-xs font-semibold">Business Account</span>
                        </div>
                        <Link href="/dashboard/book"
                            className="flex items-center gap-2 bg-red-brand hover:bg-red-dark text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-brand/20 hover:-translate-y-0.5">
                            <Plus className="w-3.5 h-3.5" /> New Shipment
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Row 2: KPI boxes (4-col grid) ────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={cn(BOX, "p-5 h-28")}><SkeletonBox /></div>
                    ))
                    : kpis.map((k, i) => (
                        <motion.div key={k.label}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className={cn(BOX, "p-5 hover:border-white/[0.14] transition-colors")}>
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", k.bg)}>
                                    <k.icon className={cn("w-4 h-4", k.color)} />
                                </div>
                                <div className={cn("flex items-center gap-0.5 text-[11px] font-bold", k.up ? "text-emerald-400" : "text-red-400")}>
                                    {k.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                    {k.delta}
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                {k.value.toLocaleString()}
                            </p>
                            <p className="text-white/35 text-xs font-semibold">{k.label}</p>
                        </motion.div>
                    ))
                }
            </div>

            {/* ── Row 3: Chart box + Quick Actions box ─────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Shipment Volume chart */}
                <div className={cn(BOX, "lg:col-span-2")}>
                    <div className={BOX_HEADER}>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-5 rounded-full bg-red-brand" />
                            <p className="text-white font-bold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Shipment Volume</p>
                            <span className="text-white/25 text-xs">— last 6 months</span>
                        </div>
                        <Link href="/dashboard/analytics" className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1 transition-colors">
                            Full Report <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="p-5">
                        <div className="flex items-end gap-3 h-32">
                            {(monthlyBars as [string, number][]).map(([mo, count], i) => (
                                <div key={mo} className="flex-1 flex flex-col items-center gap-2">
                                    <motion.div className="w-full rounded-lg relative overflow-hidden"
                                        style={{ height: `${Math.round((count / maxBar) * 100)}%`, minHeight: 8, transformOrigin: "bottom" }}
                                        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                                        transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                                        <div className="absolute inset-0 bg-gradient-to-t from-red-brand to-red-brand/30 rounded-lg" />
                                    </motion.div>
                                    <span className="text-white/30 text-[10px] font-semibold">{mo}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions box */}
                <div className={BOX}>
                    <div className={BOX_HEADER}>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-5 rounded-full bg-purple-500" />
                            <p className="text-white font-bold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Quick Actions</p>
                        </div>
                    </div>
                    <div className="p-3 space-y-2">
                        {quickActions.map((a, i) => (
                            <Link key={a.label} href={a.href}>
                                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.07 + 0.2 }}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all group cursor-pointer">
                                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", a.bg)}>
                                        <a.icon className={cn("w-4 h-4", a.color)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-xs font-bold">{a.label}</p>
                                        <p className="text-white/30 text-[10px]">{a.sub}</p>
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/40 transition-colors flex-shrink-0" />
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Row 4: Recent Shipments box ───────────────────────────── */}
            <div className={BOX}>
                <div className={BOX_HEADER}>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
                        <p className="text-white font-bold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Recent Shipments</p>
                        {!loading && (
                            <span className="text-white/25 text-xs">{shipments.length} shown</span>
                        )}
                    </div>
                    <Link href="/dashboard/shipments" className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1 transition-colors">
                        View All <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                {loading ? (
                    <div className="p-5 space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-10 bg-white/[0.04] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : shipments.length === 0 ? (
                    <div className="text-center py-14">
                        <Package className="w-10 h-10 text-white/10 mx-auto mb-3" />
                        <p className="text-white/30 text-sm font-semibold">No shipments yet</p>
                        <Link href="/dashboard/book" className="mt-4 inline-flex items-center gap-2 text-red-400 text-sm font-bold hover:text-red-300 transition-colors">
                            <Plus className="w-4 h-4" /> Book your first shipment
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/[0.05]">
                                    {["Tracking ID", "Recipient", "Route", "Service", "Status", "Date"].map(h => (
                                        <th key={h} className="text-left text-white/25 text-[10px] font-bold uppercase tracking-widest px-5 py-3">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {shipments.map((s, i) => {
                                    const badge = STATUS_BADGE[s.status] ?? { label: s.status, cls: "bg-white/10 text-white/50" };
                                    return (
                                        <motion.tr key={s.id}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.04 }}
                                            className="hover:bg-white/[0.03] transition-colors group">
                                            <td className="px-5 py-3.5">
                                                <Link href={`/tracking?id=${s.tracking_id}`}
                                                    className="font-mono text-red-400 hover:text-red-300 font-bold text-xs flex items-center gap-1.5 transition-colors">
                                                    {s.tracking_id}
                                                    <TrendingUp className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                            </td>
                                            <td className="px-5 py-3.5 text-white/70 font-medium text-xs">{s.recipient_name ?? "—"}</td>
                                            <td className="px-5 py-3.5 text-white/35 text-xs">{s.origin_city} → {s.destination_city}</td>
                                            <td className="px-5 py-3.5">
                                                <span className="text-white/35 text-[10px] font-bold uppercase tracking-wider capitalize">
                                                    {s.service_type?.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold", badge.cls)}>{badge.label}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-white/30 text-xs">
                                                {new Date(s.created_at).toLocaleDateString("en-NG", { day: "2-digit", month: "short" })}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}
