"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    TrendingUp, CheckCircle2, Star, Package,
    Clock, Zap, BarChart3, Calendar, ArrowUpRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getRiderStats } from "@/app/actions/rider";
import { cn } from "@/lib/utils";

const SERVICE_RATES: Record<string, number> = {
    same_day: 1200, express: 1000, standard: 800, bulk: 600,
};

export default function RiderPerformancePage() {
    const [stats, setStats] = useState<any>(null);
    const [rider, setRider] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: riderData } = await (supabase as any)
                .from("riders")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (riderData) {
                setRider(riderData);
                const s = await getRiderStats(riderData.id);
                setStats(s);
            }
            setLoading(false);
        };
        load();
    }, []);

    const fmt = (n: number) => `₦${Number(n).toLocaleString("en-NG")}`;

    // Group history by day for mini chart
    const dailyData = (() => {
        if (!stats?.history) return [];
        const map: Record<string, number> = {};
        stats.history.forEach((s: any) => {
            const day = new Date(s.created_at).toLocaleDateString("en-NG", { weekday: "short" });
            map[day] = (map[day] || 0) + (SERVICE_RATES[s.service_type] || 800);
        });
        return Object.entries(map).slice(-7);
    })();
    const maxDay = Math.max(...dailyData.map(([, v]) => v), 1);

    // Delivery type breakdown
    const typeBreakdown = (() => {
        if (!stats?.history) return [];
        const map: Record<string, number> = {};
        stats.history.forEach((s: any) => {
            const k = s.service_type?.replace(/_/g, " ") ?? "standard";
            map[k] = (map[k] || 0) + 1;
        });
        const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
        return Object.entries(map).map(([k, v]) => ({
            label: k, count: v, pct: Math.round((v / total) * 100),
        }));
    })();

    const COLORS = ["text-[#eb0000]", "text-blue-400", "text-purple-400", "text-amber-400"];
    const BGS = ["bg-[#eb0000]/10", "bg-blue-500/10", "bg-purple-500/10", "bg-amber-500/10"];
    const BARS = ["from-[#eb0000]/20 to-[#eb0000]", "from-blue-500/20 to-blue-500", "from-purple-500/20 to-purple-500", "from-amber-500/20 to-amber-500"];

    return (
        <div className="min-h-screen bg-[#0a0a0e] p-4 lg:p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-4 bg-[#eb0000] rounded-full" />
                        <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">Mission Analytics</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Performance <span className="text-[#eb0000]">Report</span>
                    </h1>
                </motion.div>

                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Total Drops", val: rider?.total_deliveries?.toLocaleString() ?? "0", icon: Package, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                        { label: "Weekly Earnings", val: fmt(stats?.weeklyEarnings ?? 0), icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10" },
                        { label: "Trust Rating", val: `${rider?.rating ?? "5.0"} ★`, icon: Star, color: "text-amber-400", bg: "bg-amber-500/10" },
                        { label: "Today's Drops", val: stats?.todayDrops ?? 0, icon: Zap, color: "text-[#eb0000]", bg: "bg-[#eb0000]/10" },
                    ].map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.06 }}
                            className="bg-[#111118] border border-white/[0.06] rounded-[1.75rem] p-6"
                        >
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", s.bg)}>
                                <s.icon className={cn("w-5 h-5", s.color)} />
                            </div>
                            <p className="text-2xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                {loading ? <span className="opacity-20">—</span> : s.val}
                            </p>
                            <p className="text-[10px] text-white/25 font-black uppercase tracking-[0.2em] mt-1">{s.label}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                    {/* Earnings Bar Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="bg-[#111118] border border-white/[0.06] rounded-[2rem] p-8"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <BarChart3 className="w-5 h-5 text-[#eb0000]" />
                                <h3 className="text-white font-bold tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                    Earnings Trend
                                </h3>
                            </div>
                            <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">Last 7 Days</span>
                        </div>
                        <div className="flex items-end gap-2 h-36">
                            {loading ? (
                                Array.from({ length: 7 }).map((_, i) => (
                                    <div key={i} className="flex-1 bg-white/[0.03] rounded-t-lg animate-pulse" style={{ height: `${30 + Math.random() * 60}%` }} />
                                ))
                            ) : dailyData.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-white/20 text-xs font-bold uppercase tracking-widest">
                                    No data yet
                                </div>
                            ) : dailyData.map(([day, val]) => {
                                const h = Math.max(((val / maxDay) * 100), 8);
                                return (
                                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            transition={{ duration: 0.8, type: "spring" }}
                                            className="w-full bg-gradient-to-t from-[#eb0000]/10 to-[#eb0000]/50 rounded-t-lg hover:to-[#eb0000] transition-colors cursor-default"
                                        />
                                        <span className="text-[8px] text-white/20 font-bold uppercase">{day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Service Breakdown */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-[#111118] border border-white/[0.06] rounded-[2rem] p-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            <h3 className="text-white font-bold tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                Service Mix
                            </h3>
                        </div>
                        <div className="space-y-5">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="space-y-2 animate-pulse">
                                        <div className="h-3 bg-white/[0.04] rounded-full w-1/2" />
                                        <div className="h-2 bg-white/[0.03] rounded-full" />
                                    </div>
                                ))
                            ) : typeBreakdown.length === 0 ? (
                                <div className="text-center py-10 text-white/20 text-xs font-bold uppercase tracking-widest">
                                    No data yet
                                </div>
                            ) : typeBreakdown.map((item, i) => (
                                <div key={item.label}>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className={cn("text-[10px] font-black uppercase tracking-widest capitalize", COLORS[i % COLORS.length])}>
                                            {item.label}
                                        </span>
                                        <span className="text-white/40 text-[10px] font-black">{item.count} drops ({item.pct}%)</span>
                                    </div>
                                    <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.pct}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.1, type: "spring" }}
                                            className={cn("h-full rounded-full bg-gradient-to-r", BARS[i % BARS.length])}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Delivery History Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-[#111118] border border-white/[0.06] rounded-[2rem] overflow-hidden"
                >
                    <div className="px-8 py-6 border-b border-white/[0.06]">
                        <h3 className="text-white font-bold tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            Delivery Log
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/[0.01] border-b border-white/[0.04]">
                                    {["Route", "Service", "Est. Earnings", "Date"].map(h => (
                                        <th key={h} className="px-8 py-4 text-[9px] font-black text-white/15 uppercase tracking-[0.3em]">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={4} className="px-8 py-5">
                                                <div className="h-4 bg-white/[0.04] rounded-full animate-pulse w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : (stats?.history ?? []).length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-16 text-center text-white/15 text-xs font-bold uppercase tracking-widest">
                                            No deliveries recorded yet
                                        </td>
                                    </tr>
                                ) : (stats?.history ?? []).map((s: any, i: number) => (
                                    <motion.tr
                                        key={s.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="group hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                                <span className="text-white text-sm font-bold">{s.sender_state} → {s.recipient_state}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 capitalize">
                                                {s.service_type?.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-emerald-400 font-black text-sm">
                                                {fmt(SERVICE_RATES[s.service_type] ?? 800)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-white/30 text-xs font-bold">
                                            {new Date(s.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
