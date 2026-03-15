"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Package, MessageSquare, Truck, CheckCircle2,
    AlertCircle, CalendarDays, ArrowRight, Zap,
    TrendingUp, ShieldCheck, Users, Banknote,
    Clock, ChevronRight, Search, Filter, MoreHorizontal, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAdminStats } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
    confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/5",
    collected: "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-purple-500/5",
    in_transit: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5",
    at_hub: "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-orange-500/5",
    out_for_delivery: "bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-sky-500/5",
    delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5",
    failed: "bg-red-500/10 text-red-500 border-red-500/20 shadow-red-500/5",
    pending: "bg-white/5 text-white/30 border-white/10",
};

const STATUS_LABELS: Record<string, string> = {
    confirmed: "Confirmed", collected: "Collected", in_transit: "In Transit",
    at_hub: "At Hub", out_for_delivery: "Out for Delivery", delivered: "Delivered",
    failed: "Failed", pending: "Pending",
};

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalShipments: 0, inTransit: 0, delivered: 0,
        failed: 0, todayBookings: 0, totalMessages: 0,
        totalRevenue: 0, totalBusinesses: 0, totalUsers: 0, pendingKYC: 0
    });
    const [shipments, setShipments] = useState<any[]>([]);
    const [kycRequests, setKycRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const serverStats = await getAdminStats();
                setStats(serverStats);
                setShipments(serverStats.recentShipments ?? []);
                setKycRequests(serverStats.recentKYC ?? []);
            } catch (error) {
                console.error("Failed to load admin stats:", error);
            }
            setLoading(false);
        }
        load();
    }, []);

    const BOX = "bg-[#111116]/80 backdrop-blur-xl border border-white/[0.06] rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:border-white/10";

    return (
        <div className="p-6 lg:p-10 space-y-10 min-h-screen bg-[#0c0c10]">

            {/* Top Navigation & Greeting */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-red-brand animate-pulse" />
                        <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">System Operational</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Control <span className="text-red-brand">Center</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-1.5 flex items-center gap-1">
                        {["Day", "Week", "Month"].map(t => (
                            <button key={t} className={cn("px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all", t === "Week" ? "bg-red-brand text-white shadow-lg" : "text-white/30 hover:text-white")}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Primary KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Revenue", val: `₦${stats.totalRevenue.toLocaleString()}`, icon: Banknote, color: "text-emerald-400", bg: "bg-emerald-500/10", trend: "+12.5%", glow: "shadow-emerald-500/20" },
                    { label: "Active Vectors", val: stats.inTransit, icon: Truck, color: "text-blue-400", bg: "bg-blue-500/10", trend: "+14", glow: "shadow-blue-500/20" },
                    { label: "Neural Registry", val: stats.totalUsers, icon: Users, color: "text-purple-400", bg: "bg-purple-500/10", trend: `${stats.totalBusinesses} Businesses`, glow: "shadow-purple-500/20" },
                    { label: "Pending KYC", val: stats.pendingKYC, icon: ShieldCheck, color: "text-amber-400", bg: "bg-amber-500/10", trend: "Action Required", glow: "shadow-amber-500/20" },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className={cn(BOX, "p-10 group hover:-translate-y-1 transition-all duration-500 relative overflow-hidden cursor-default")}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] -rotate-45 translate-x-16 -translate-y-16 group-hover:bg-white/[0.03] transition-colors" />
                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all group-hover:scale-110", s.bg, s.color, s.glow)}>
                                <s.icon className="w-8 h-8" />
                            </div>
                            <div className={cn("px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5", s.color, s.bg)}>
                                {s.trend}
                            </div>
                        </div>
                        <h3 className="text-4xl font-black text-white mb-2 tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            {loading ? <span className="animate-pulse opacity-20">—</span> : s.val}
                        </h3>
                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">{s.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Visual Analytics Block */}
                <div className={cn(BOX, "xl:col-span-2 p-8 flex flex-col")}>
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Booking Volume Trends</h2>
                            <p className="text-white/30 text-xs">Real-time performance across all service regions.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-brand" />
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Growth</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Revenue</span>
                            </div>
                        </div>
                    </div>

                    {/* Highly Sophisticated Visualizer (SVG Custom Chart) */}
                    <div className="flex-1 min-h-[300px] relative flex items-end justify-between gap-1 px-4">
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-px bg-white/[0.03]" />)}
                        </div>
                        {Array.from({ length: 24 }).map((_, i) => {
                            const h = 20 + Math.random() * 80;
                            return (
                                <div key={i} className="flex-1 group relative">
                                    <motion.div
                                        initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.02, duration: 1 }}
                                        className="w-full bg-gradient-to-t from-red-brand/10 to-red-brand/40 rounded-t-lg group-hover:from-red-brand/40 group-hover:to-red-brand transition-all relative">
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {Math.floor(Math.random() * 100)}
                                        </div>
                                    </motion.div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Operations Feed */}
                <div className="space-y-8">

                    {/* KYC Section */}
                    <div className={cn(BOX, "p-8")}>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Credential Audit</h3>
                            <Link href="/admin/verify" className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.04] text-white/30 hover:text-white transition-all">
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="space-y-6">
                            {kycRequests.length === 0 ? (
                                <div className="py-10 text-center">
                                    <ShieldCheck className="w-10 h-10 text-white/5 mx-auto mb-3" />
                                    <p className="text-white/20 text-xs font-bold uppercase tracking-widest">All Clear</p>
                                </div>
                            ) : kycRequests.map((k, i) => (
                                <motion.div key={k.id} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-full bg-red-brand flex items-center justify-center text-white font-black text-xs">
                                        {k.company_name?.[0] || k.full_name?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{k.company_name || k.full_name}</p>
                                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Business KYC — Pending</p>
                                    </div>
                                    <Link href={`/admin/verify?id=${k.id}`} className="text-white/20 hover:text-red-brand transition-colors">
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Operational Alerts */}
                    <div className={cn(BOX, "p-8 bg-red-brand/5 border-red-brand/10")}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-brand" />
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-brand">System Alerts</h3>
                            </div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-brand text-white">2</span>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                                <p className="text-[11px] font-bold text-white leading-relaxed">
                                    High failure rate detected on <span className="text-red-brand">Same-Day</span> service in Lagos Island.
                                </p>
                                <p className="text-[9px] text-white/30 mt-2">12 mins ago</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Section: Live Shipment Monitoring */}
            <div className={BOX}>
                <div className="px-8 py-8 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Live Monitoring</h2>
                        <p className="text-white/30 text-xs font-medium">Tracking the pulse of all active logistical movements.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                            <input type="text" placeholder="Track shipment..." className="bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-red-brand/40 min-w-[240px]" />
                        </div>
                        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/10 text-white/30 hover:text-white transition-all">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.01] border-b border-white/[0.06]">
                                {["Vector Identity", "Origin Sector", "Payload Target", "Client Link", "System Tier", "Telemetry", "Status Protocol"].map(h => (
                                    <th key={h} className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/10">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {shipments.map((s, i) => (
                                <tr key={s.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-red-brand/40 animate-pulse" />
                                            <span className="font-mono text-xs font-black text-white">{s.tracking_id}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <p className="text-sm font-black text-white/80 tracking-tight">{s.origin_city}</p>
                                        <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-1">Source node</p>
                                    </td>
                                    <td className="px-10 py-8">
                                        <p className="text-sm font-black text-white/80 tracking-tight">{s.destination_city}</p>
                                        <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-1">Target termination</p>
                                    </td>
                                    <td className="px-10 py-8">
                                        <p className="text-sm font-black text-white/80 tracking-tight">{s.sender_name}</p>
                                        <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-1">Authority: Level 1</p>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-brand/80 border border-red-brand/20 px-3 py-1 rounded-lg bg-red-brand/5">{s.service_type}</span>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-1.5 w-24 bg-white/5 rounded-full overflow-hidden shadow-inner">
                                                <div className="h-full bg-gradient-to-r from-red-brand/20 to-red-brand rounded-full w-[65%] shadow-[0_0_10px_rgba(235,0,0,0.5)]" />
                                            </div>
                                            <span className="text-[10px] font-black text-white/40 tabular-nums">65%</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className={cn("inline-flex px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] border shadow-sm transition-all", STATUS_COLORS[s.status] ?? STATUS_COLORS.pending)}>
                                            {STATUS_LABELS[s.status] ?? s.status}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Governance & Control Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Identity Governance", desc: "Manage operational nodes & user permissions.", icon: Users, href: "/admin/users", col: "text-red-brand", bg: "bg-red-brand/10" },
                    { label: "Fleet Command", desc: "Audit real-time logistics unit telemetry & status.", icon: Truck, href: "/admin/fleet", col: "text-blue-400", bg: "bg-blue-500/10" },
                    { label: "System Audit", desc: "Review merchant KYC status & regulatory compliance.", icon: Shield, href: "/admin/verify", col: "text-emerald-400", bg: "bg-emerald-500/10" },
                ].map((l) => (
                    <Link key={l.label} href={l.href} className={cn(BOX, "p-8 group hover:border-white/20 transition-all")}>
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", l.bg)}>
                            <l.icon className={cn("w-7 h-7", l.col)} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{l.label}</h3>
                        <p className="text-white/30 text-[11px] leading-relaxed mb-6 font-medium">{l.desc}</p>
                        <div className="flex items-center gap-2 text-[10px] font-black text-white/20 group-hover:text-white transition-colors uppercase tracking-[0.3em]">
                            Enter Module <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                    </Link>
                ))}
            </div>

        </div>
    );
}
