"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, MapPin, Package, Download } from "lucide-react";
import { getDashboardStats } from "@/app/actions/dashboard";
import { cn } from "@/lib/utils";

type Stats = Awaited<ReturnType<typeof getDashboardStats>>;

export default function AnalyticsPage() {
    const [stats,   setStats]   = useState<Stats>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardStats().then(s => { setStats(s); setLoading(false); });
    }, []);

    const monthly    = stats?.monthly ? Object.entries(stats.monthly) : [];
    const maxVal     = Math.max(...monthly.map(([, v]) => Number(v)), 1);

    const serviceBreakdown = [
        { label: "Express",  pct: 42, color: "bg-red-brand"  },
        { label: "Standard", pct: 31, color: "bg-blue-500"   },
        { label: "Same Day", pct: 18, color: "bg-amber-500"  },
        { label: "Bulk",     pct: 9,  color: "bg-purple-500" },
    ];

    const BOX = "bg-[#16161e] border border-white/[0.08] rounded-2xl overflow-hidden";

    return (
        <div className="p-5 lg:p-6 space-y-4">

            {/* ── Header box ─────────────────────────────────────────── */}
            <div className={BOX}>
                <div className="flex items-center justify-between p-5">
                    <div>
                        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Analytics</h1>
                        <p className="text-white/30 text-sm mt-0.5">Shipment performance &amp; insights</p>
                    </div>
                    <button className="flex items-center gap-2 border border-white/[0.1] hover:border-white/[0.2] text-white/60 hover:text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all">
                        <Download className="w-4 h-4" /> Export Report
                    </button>
                </div>
            </div>

            {/* ── KPI grid ───────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5 animate-pulse">
                            <div className="h-3 w-20 bg-white/10 rounded mb-3" />
                            <div className="h-7 w-14 bg-white/10 rounded" />
                        </div>
                    ))
                    : [
                        { label: "Success Rate",  value: `${stats?.successRate ?? 0}%`,                       icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                        { label: "Total Parcels", value: `${stats?.total ?? 0}`,                               icon: Package,    color: "text-blue-400",    bg: "bg-blue-400/10"    },
                        { label: "Delivered",     value: `${stats?.delivered ?? 0}`,                           icon: BarChart3,  color: "text-purple-400",  bg: "bg-purple-400/10"  },
                        { label: "Total Value",   value: `₦${((stats?.totalValue ?? 0) / 1000).toFixed(0)}K`, icon: MapPin,     color: "text-amber-400",   bg: "bg-amber-400/10"   },
                    ].map((k, i) => (
                        <motion.div key={k.label}
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-white/35 text-xs font-bold uppercase tracking-wider">{k.label}</p>
                                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", k.bg)}>
                                    <k.icon className={cn("w-3.5 h-3.5", k.color)} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{k.value}</p>
                        </motion.div>
                    ))
                }
            </div>

            {/* ── Charts row ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Volume chart box */}
                <div className={cn(BOX, "lg:col-span-2")}>
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.07]">
                        <div className="w-1.5 h-5 rounded-full bg-red-brand" />
                        <p className="text-white font-bold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Monthly Volume</p>
                        <span className="text-white/25 text-xs">— shipments per month</span>
                    </div>
                    <div className="p-5">
                        <div className="flex items-end gap-3 h-40">
                            {(monthly.length > 0
                                ? monthly
                                : [["Jan", 2], ["Feb", 4], ["Mar", 3], ["Apr", 6], ["May", 5], ["Jun", 7]] as [string, number][]
                            ).map(([mo, val], i) => (
                                <div key={mo} className="flex-1 flex flex-col items-center gap-2">
                                    <motion.div
                                        className="w-full rounded-lg bg-gradient-to-t from-red-brand to-red-400/60 relative"
                                        style={{ height: `${Math.round((Number(val) / maxVal) * 100)}%`, minHeight: 8 }}
                                        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                                        transition={{ delay: i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-white/50 text-[10px] font-bold">{val}</div>
                                    </motion.div>
                                    <span className="text-white/25 text-[10px] font-semibold">{mo}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Service breakdown box */}
                <div className={BOX}>
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.07]">
                        <div className="w-1.5 h-5 rounded-full bg-purple-500" />
                        <p className="text-white font-bold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>By Service Type</p>
                    </div>
                    <div className="p-5 space-y-4">
                        {serviceBreakdown.map((s, i) => (
                            <div key={s.label}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-white/50 text-xs font-semibold">{s.label}</span>
                                    <span className="text-white/70 text-xs font-bold">{s.pct}%</span>
                                </div>
                                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                                    <motion.div className={cn("h-full rounded-full", s.color)}
                                        initial={{ width: 0 }} animate={{ width: `${s.pct}%` }}
                                        transition={{ delay: i * 0.1 + 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>{/* end charts row */}

            {/* ── Top Destination States box ─────────────────────────── */}
            <div className={BOX}>
                <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.07]">
                    <div className="w-1.5 h-5 rounded-full bg-amber-500" />
                    <p className="text-white font-bold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Top Destination States</p>
                    <span className="text-white/25 text-xs">— where your shipments are going</span>
                </div>
                <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {loading
                            ? Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="bg-white/[0.04] rounded-2xl p-4 animate-pulse">
                                    <div className="h-8 w-10 bg-white/10 rounded mb-2" />
                                    <div className="h-3 w-20 bg-white/[0.06] rounded" />
                                </div>
                            ))
                            : (stats?.topStates.length ? stats.topStates : [
                                { state: "Lagos",      count: 4 },
                                { state: "Abuja (FCT)", count: 2 },
                                { state: "Rivers",     count: 1 },
                                { state: "Oyo",        count: 1 },
                                { state: "Kano",       count: 1 },
                            ]).map((s, i) => (
                                <motion.div key={s.state}
                                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 text-center hover:bg-white/[0.07] transition-colors">
                                    <div className="text-3xl font-bold text-red-400 mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                        {String(i + 1).padStart(2, "0")}
                                    </div>
                                    <div className="flex items-center justify-center gap-1 mb-2">
                                        <MapPin className="w-3 h-3 text-white/30" />
                                        <p className="text-white/60 text-xs font-semibold">{s.state}</p>
                                    </div>
                                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
                                        {s.count} shipment{s.count !== 1 ? "s" : ""}
                                    </p>
                                </motion.div>
                            ))
                        }
                    </div>
                </div>
            </div>

        </div>
    );
}
