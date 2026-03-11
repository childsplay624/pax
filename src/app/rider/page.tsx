"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Zap, Star, CheckCircle2, Package, MapPin,
    ArrowRight, TrendingUp, Bike, Truck,
    ToggleLeft, ToggleRight, Loader2, Navigation,
    Clock, ChevronRight, Radio, Shield, Activity
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { setRiderStatus, getRiderStats } from "@/app/actions/rider";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, { label: string; color: string; glow: string }> = {
    active: { label: "Active", color: "text-emerald-400", glow: "shadow-emerald-500/30" },
    on_delivery: { label: "On Delivery", color: "text-red-400", glow: "shadow-red-500/30" },
    resting: { label: "Resting", color: "text-amber-400", glow: "shadow-amber-500/30" },
    offline: { label: "Offline", color: "text-white/30", glow: "" },
};

export default function RiderCockpitPage() {
    const [rider, setRider] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, start] = useTransition();
    const [toast, setToast] = useState<string | null>(null);

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

    const handleToggle = () => {
        if (!rider) return;
        const next = rider.status === "active" ? "resting" : "active";
        start(async () => {
            const res = await setRiderStatus(rider.id, next);
            if (res.success) {
                setRider((p: any) => ({ ...p, status: next }));
                showToast(next === "active" ? "🟢 You are now Active & visible to dispatch" : "🟡 Status set to Resting");
            }
        });
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3500);
    };

    const fmt = (n: number) => `₦${Number(n).toLocaleString("en-NG")}`;
    const isActive = rider?.status === "active";

    return (
        <div className="min-h-screen bg-[#0a0a0e] p-4 lg:p-8 space-y-6 relative overflow-hidden">

            {/* Background glow effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#eb0000]/5 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* ── Toast Notification ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -40 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-[#1a1a22] border border-white/10 rounded-2xl text-white text-sm font-bold shadow-2xl backdrop-blur-xl"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Hero Cockpit Header ── */}
            <div className="relative z-10 max-w-5xl mx-auto">

                {/* Rider Identity Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-gradient-to-br from-[#111118] via-[#0f0f16] to-[#0a0a0e] border border-white/[0.08] rounded-[2.5rem] p-8 lg:p-10 overflow-hidden"
                >
                    {/* Decorative ring */}
                    <div className={cn(
                        "absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 blur-[80px] -mr-20 -mt-20 transition-colors duration-700",
                        isActive ? "bg-emerald-400" : "bg-amber-400"
                    )} />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-8">

                        {/* Avatar + Status Ring */}
                        <div className="relative flex-shrink-0">
                            <div className={cn(
                                "w-24 h-24 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-2xl border-4 transition-all duration-500",
                                isActive
                                    ? "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30"
                                    : "bg-gradient-to-br from-white/10 to-transparent border-white/10"
                            )}>
                                {loading ? (
                                    <Loader2 className="w-10 h-10 animate-spin opacity-30" />
                                ) : rider?.vehicle_type === "bike" ? (
                                    <Bike className="w-12 h-12" />
                                ) : (
                                    <Truck className="w-12 h-12" />
                                )}
                            </div>
                            {/* Live indicator dot */}
                            <div className={cn(
                                "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-[#0a0a0e] shadow-lg transition-all",
                                isActive ? "bg-emerald-500 shadow-emerald-500/50" : "bg-amber-400 shadow-amber-400/50"
                            )}>
                                {isActive && <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-60" />}
                            </div>
                        </div>

                        {/* Name + Details */}
                        <div className="flex-1 min-w-0">
                            {loading ? (
                                <div className="space-y-3">
                                    <div className="h-8 bg-white/5 rounded-xl w-48 animate-pulse" />
                                    <div className="h-4 bg-white/5 rounded-xl w-32 animate-pulse" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 flex-wrap mb-1">
                                        <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                            {rider?.full_name ?? "Rider"}
                                        </h1>
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                            isActive
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                        )}>
                                            {STATUS_LABEL[rider?.status]?.label ?? rider?.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-6 text-white/30 text-xs flex-wrap">
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-[#eb0000]" />
                                            {rider?.current_city ?? "Base Hub"}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Star className="w-3.5 h-3.5 text-amber-400" />
                                            {rider?.rating} Trust Rating
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                            {rider?.total_deliveries?.toLocaleString()} Drops
                                        </span>
                                        <span className="flex items-center gap-1.5 capitalize">
                                            {rider?.vehicle_type === "bike" ? <Bike className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                                            {rider?.vehicle_type}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Active Toggle */}
                        <div className="flex-shrink-0">
                            <button
                                onClick={handleToggle}
                                disabled={isPending || loading}
                                className={cn(
                                    "relative flex flex-col items-center gap-3 px-8 py-6 rounded-[2rem] border-2 transition-all duration-500 group min-w-[150px]",
                                    isActive
                                        ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20"
                                        : "bg-white/[0.03] border-white/10 hover:border-white/20"
                                )}
                            >
                                <div className="relative">
                                    {isPending
                                        ? <Loader2 className="w-10 h-10 text-white/40 animate-spin" />
                                        : isActive
                                            ? <ToggleRight className="w-10 h-10 text-emerald-400" />
                                            : <ToggleLeft className="w-10 h-10 text-white/30" />
                                    }
                                    {isActive && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className={cn("text-xs font-black uppercase tracking-widest", isActive ? "text-emerald-400" : "text-white/30")}>
                                        {isActive ? "Go Offline" : "Go Active"}
                                    </p>
                                    <p className="text-[9px] text-white/20 font-bold mt-0.5">
                                        {isActive ? "Tap to rest" : "Tap to start"}
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* ── KPI Stats Row ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    {[
                        {
                            label: "Today's Drops",
                            val: loading ? "—" : stats?.todayDrops ?? 0,
                            icon: CheckCircle2,
                            color: "text-emerald-400",
                            bg: "bg-emerald-500/10",
                            delay: 0.1,
                        },
                        {
                            label: "Weekly Earnings",
                            val: loading ? "—" : fmt(stats?.weeklyEarnings ?? 0),
                            icon: TrendingUp,
                            color: "text-blue-400",
                            bg: "bg-blue-500/10",
                            delay: 0.15,
                        },
                        {
                            label: "All-Time Drops",
                            val: loading ? "—" : (rider?.total_deliveries ?? 0).toLocaleString(),
                            icon: Package,
                            color: "text-purple-400",
                            bg: "bg-purple-500/10",
                            delay: 0.2,
                        },
                        {
                            label: "Trust Rating",
                            val: loading ? "—" : `${rider?.rating ?? "5.0"} ★`,
                            icon: Star,
                            color: "text-amber-400",
                            bg: "bg-amber-500/10",
                            delay: 0.25,
                        },
                    ].map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: s.delay }}
                            className="bg-[#111118] border border-white/[0.06] rounded-[1.75rem] p-6 group hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", s.bg)}>
                                <s.icon className={cn("w-5 h-5", s.color)} />
                            </div>
                            <p className="text-2xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                {s.val}
                            </p>
                            <p className="text-[10px] text-white/25 font-black uppercase tracking-[0.2em] mt-1">{s.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* ── Live Dispatch Panel (if active) ── */}
                <AnimatePresence>
                    {isActive && !loading && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-6 overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-[#eb0000]/10 via-[#111118] to-[#111118] border border-[#eb0000]/20 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center gap-6">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-14 h-14 rounded-2xl bg-[#eb0000]/15 border border-[#eb0000]/20 flex items-center justify-center flex-shrink-0">
                                        <Radio className="w-7 h-7 text-[#eb0000] animate-pulse" />
                                    </div>
                                    <div>
                                        <p className="text-[#eb0000] text-[10px] font-black uppercase tracking-[0.4em] mb-1">Dispatch Radar Active</p>
                                        <h3 className="text-white font-black text-xl tracking-tight">Listening for assignments...</h3>
                                        <p className="text-white/30 text-xs mt-0.5">You will be notified when a payload is routed to you.</p>
                                    </div>
                                </div>
                                <a
                                    href="/rider/dispatch"
                                    className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-[#eb0000] text-white text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-[#eb0000]/20 flex-shrink-0"
                                >
                                    View Dispatch <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Recent Delivery History ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 bg-[#111118] border border-white/[0.06] rounded-[2rem] overflow-hidden"
                >
                    <div className="px-8 py-6 border-b border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-white/20" />
                            <h2 className="text-white font-bold tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                Recent Deliveries
                            </h2>
                        </div>
                        <a href="/rider/performance" className="text-[10px] font-black text-white/20 hover:text-[#eb0000] uppercase tracking-widest transition-colors flex items-center gap-1.5">
                            Full History <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                    </div>

                    <div className="divide-y divide-white/[0.04]">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="px-8 py-5 flex items-center gap-4 animate-pulse">
                                    <div className="w-10 h-10 bg-white/[0.04] rounded-xl" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3.5 bg-white/[0.04] rounded-full w-1/3" />
                                        <div className="h-3 bg-white/[0.03] rounded-full w-1/4" />
                                    </div>
                                    <div className="h-6 bg-white/[0.04] rounded-full w-20" />
                                </div>
                            ))
                        ) : (stats?.history ?? []).length === 0 ? (
                            <div className="px-8 py-16 text-center">
                                <Package className="w-10 h-10 text-white/5 mx-auto mb-3" />
                                <p className="text-white/20 text-xs font-black uppercase tracking-widest">No deliveries yet</p>
                            </div>
                        ) : (stats?.history ?? []).slice(0, 6).map((s: any, i: number) => (
                            <motion.div
                                key={s.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="px-8 py-5 flex items-center gap-5 group hover:bg-white/[0.02] transition-colors"
                            >
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-bold truncate">{s.sender_state} → {s.recipient_state}</p>
                                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        {new Date(s.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                                        <span className="text-white/10">·</span>
                                        {s.service_type?.replace(/_/g, " ")}
                                    </p>
                                </div>
                                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest flex-shrink-0">
                                    Delivered
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* ── Quick Actions ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pb-8">
                    {[
                        {
                            label: "Active Dispatch",
                            icon: Navigation,
                            desc: "View payloads currently assigned to you.",
                            href: "/rider/dispatch",
                            color: "from-[#eb0000]/10 to-[#111118]",
                            border: "border-[#eb0000]/20",
                            iconColor: "text-[#eb0000]",
                            iconBg: "bg-[#eb0000]/10",
                        },
                        {
                            label: "Performance Stats",
                            icon: TrendingUp,
                            desc: "Analyse your delivery speed & rating trends.",
                            href: "/rider/performance",
                            color: "from-blue-500/10 to-[#111118]",
                            border: "border-blue-500/20",
                            iconColor: "text-blue-400",
                            iconBg: "bg-blue-500/10",
                        },
                        {
                            label: "Rider Profile",
                            icon: Shield,
                            desc: "Update your vehicle info and account details.",
                            href: "/rider/profile",
                            color: "from-purple-500/10 to-[#111118]",
                            border: "border-purple-500/20",
                            iconColor: "text-purple-400",
                            iconBg: "bg-purple-500/10",
                        },
                    ].map(item => (
                        <a
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "bg-gradient-to-br border rounded-[2rem] p-7 group hover:-translate-y-1 transition-all duration-300 hover:border-white/20",
                                item.color, item.border
                            )}
                        >
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform", item.iconBg)}>
                                <item.icon className={cn("w-6 h-6", item.iconColor)} />
                            </div>
                            <h3 className="text-white font-black text-base tracking-tight mb-1.5" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{item.label}</h3>
                            <p className="text-white/30 text-xs leading-relaxed">{item.desc}</p>
                        </a>
                    ))}
                </div>

            </div>
        </div>
    );
}
