"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Zap, Star, CheckCircle2, Package, MapPin,
    ArrowRight, TrendingUp, Bike, Truck,
    ToggleLeft, ToggleRight, Loader2, Navigation,
    Clock, ChevronRight, Radio, Shield, Activity,
    Sun, Moon, Wallet, CreditCard, ArrowUpRight
} from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { setRiderStatus, getRiderStats, updateRiderLocation, requestPayout } from "@/app/actions/rider";
import { listBanks, resolveAccount } from "@/app/actions/payments";
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
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isWakeLockActive, setIsWakeLockActive] = useState(false);
    const [wakeLock, setWakeLock] = useState<any>(null);
    const [payoutModal, setPayoutModal] = useState(false);
    const [payoutForm, setPayoutForm] = useState({ amount: "", bankName: "", bankCode: "", accountNumber: "", accountName: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [banks, setBanks] = useState<any[]>([]);
    const [isResolving, setIsResolving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
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
        } catch (err) {
            console.warn("[PAX Rider Cockpit] Sync interrupted:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        const getBanks = async () => {
            const b = await listBanks();
            setBanks(b);
        };
        getBanks();
    }, []);

    // ── Real-time Account Resolution ──
    useEffect(() => {
        const resolve = async () => {
            if (payoutForm.accountNumber.length === 10 && payoutForm.bankCode) {
                setIsResolving(true);
                const res = await resolveAccount(payoutForm.accountNumber, payoutForm.bankCode);
                if (res.account_name) {
                    setPayoutForm(p => ({ ...p, accountName: res.account_name || "" }));
                } else {
                    setPayoutForm(p => ({ ...p, accountName: "" }));
                    showToast("❌ Could not verify this account");
                }
                setIsResolving(false);
            }
        };
        resolve();
    }, [payoutForm.accountNumber, payoutForm.bankCode]);

    // ── Real-time Location Heartbeat ──
    useEffect(() => {
        if (!rider || !["active", "on_delivery"].includes(rider.status)) return;

        if (!("geolocation" in navigator)) {
            setLocationError("Geolocation not supported");
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                // Periodic update to avoid database spam — update if precision changed or 30s elapsed
                // For simplicity, we just fire it; the server action handles the DB call.
                updateRiderLocation(rider.id, latitude, longitude);
                setLocationError(null);
            },
            (err) => {
                console.warn("[PAX Geolocation] Error:", err.message);
                setLocationError(err.code === 1 ? "Location access denied" : "Position unavailable");
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [rider?.id, rider?.status]);

    // ── Screen Wake Lock (Keep Screen On) ──
    const toggleWakeLock = async () => {
        if (!("wakeLock" in navigator)) {
            showToast("⚠️ Wake Lock not supported on this browser");
            return;
        }

        try {
            if (!isWakeLockActive) {
                const lock = await (navigator as any).wakeLock.request("screen");
                setWakeLock(lock);
                setIsWakeLockActive(true);
                showToast("☀️ Navigation Mode: Screen will stay on");

                lock.addEventListener("release", () => {
                    setIsWakeLockActive(false);
                });
            } else {
                await wakeLock?.release();
                setWakeLock(null);
                setIsWakeLockActive(false);
                showToast("🌙 Standard Mode: Screen will sleep");
            }
        } catch (err) {
            console.error("Wake Lock error:", err);
            showToast("🚨 Failed to enable Navigation Mode");
        }
    };

    // Re-acquire wake lock if tab becomes visible again
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (wakeLock !== null && document.visibilityState === "visible" && isWakeLockActive) {
                const lock = await (navigator as any).wakeLock.request("screen");
                setWakeLock(lock);
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [wakeLock, isWakeLockActive]);

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

    const handlePayout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payoutForm.amount || !payoutForm.bankName || !payoutForm.accountNumber) {
            showToast("❌ Please fill all banking details");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await requestPayout({
                amount: parseFloat(payoutForm.amount),
                bankName: payoutForm.bankName,
                accountNumber: payoutForm.accountNumber,
                accountName: payoutForm.accountName
            });

            if (res.success) {
                showToast("✅ Payout requested! Funds debited.");
                setPayoutModal(false);
                load(); // Refresh balance
            } else {
                showToast(`❌ ${res.error}`);
            }
        } finally {
            setIsSubmitting(false);
        }
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
                                "w-24 h-24 rounded-[2rem] overflow-hidden shadow-2xl border-4 transition-all duration-500 flex items-center justify-center",
                                isActive
                                    ? "border-emerald-500/40"
                                    : "border-white/10"
                            )}>
                                {loading ? (
                                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                        <Loader2 className="w-10 h-10 animate-spin opacity-30 text-white" />
                                    </div>
                                ) : rider?.avatar_url ? (
                                    <Image
                                        src={rider.avatar_url}
                                        alt={rider.full_name ?? "Rider"}
                                        width={96}
                                        height={96}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className={cn(
                                        "w-full h-full flex items-center justify-center text-white text-3xl font-black",
                                        isActive
                                            ? "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10"
                                            : "bg-gradient-to-br from-white/10 to-white/5"
                                    )}>
                                        {(rider?.full_name ?? "R").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                                    </div>
                                )}
                            </div>
                            {/* Vehicle type badge */}
                            {!loading && (
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-[#0a0a0e] border border-white/10 flex items-center gap-1">
                                    {rider?.vehicle_type === "bike"
                                        ? <Bike className="w-3 h-3 text-white/40" />
                                        : <Truck className="w-3 h-3 text-white/40" />}
                                </div>
                            )}
                            {/* Live indicator dot */}
                            <div className={cn(
                                "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0a0a0e] shadow-lg transition-all",
                                isActive ? "bg-emerald-500 shadow-emerald-500/50" : "bg-white/20"
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

                                        {/* GPS Status Indicator */}
                                        {["active", "on_delivery"].includes(rider.status) && (
                                            <div className={cn(
                                                "flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider",
                                                locationError
                                                    ? "bg-red-500/10 text-red-400 animate-pulse"
                                                    : "bg-[#eb0000]/10 text-[#eb0000]"
                                            )}>
                                                {locationError ? (
                                                    <><Shield className="w-3 h-3" /> GPS Error</>
                                                ) : (
                                                    <><Activity className="w-3 h-3 animate-pulse" /> Live Tracking Active</>
                                                )}
                                            </div>
                                        )}

                                        {/* Wake Lock Toggle */}
                                        <button
                                            onClick={toggleWakeLock}
                                            className={cn(
                                                "flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                                                isWakeLockActive
                                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                    : "bg-white/5 text-white/30 border border-white/5 hover:bg-white/10"
                                            )}
                                        >
                                            {isWakeLockActive ? (
                                                <><Sun className="w-3 h-3" /> Screen Locked On</>
                                            ) : (
                                                <><Moon className="w-3 h-3" /> Screen Auto-Sleep</>
                                            )}
                                        </button>
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
                            label: "Balance",
                            val: loading ? "—" : fmt(stats?.walletBalance ?? 0),
                            icon: Wallet,
                            color: "text-[#eb0000]",
                            bg: "bg-[#eb0000]/10",
                            delay: 0.15,
                            onClick: () => setPayoutModal(true)
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
                            className={cn(
                                "bg-[#111118] border border-white/[0.06] rounded-[1.75rem] p-6 group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden",
                                (s as any).onClick && "cursor-pointer hover:border-[#eb0000]/30"
                            )}
                            onClick={(s as any).onClick}
                        >
                            {(s as any).onClick && (
                                <div className="absolute top-4 right-4 text-[#eb0000] opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowUpRight className="w-4 h-4" />
                                </div>
                            )}
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

            {/* ── Payout Modal ── */}
            <AnimatePresence>
                {payoutModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPayoutModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-[#111118] border border-white/10 rounded-[2.5rem] p-8 lg:p-10 overflow-hidden shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#eb0000]/10 rounded-full blur-[80px] -mr-20 -mt-20" />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-[#eb0000]/10 flex items-center justify-center">
                                            <CreditCard className="w-6 h-6 text-[#eb0000]" />
                                        </div>
                                        <div>
                                            <h2 className="text-white text-xl font-black">Request Payout</h2>
                                            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Withdraw Earnings</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setPayoutModal(false)} className="text-white/20 hover:text-white transition-colors">
                                        <Radio className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handlePayout} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Amount to Withdraw (₦)</label>
                                        <input
                                            type="number"
                                            required
                                            placeholder="e.g. 5000"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-[#eb0000]/40 transition-all"
                                            value={payoutForm.amount}
                                            onChange={e => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                                        />
                                        <p className="text-[10px] text-white/20 ml-1">Available: {fmt(stats?.walletBalance ?? 0)}</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Select Bank</label>
                                            <select
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-[#eb0000]/40 transition-all appearance-none cursor-pointer"
                                                value={payoutForm.bankCode}
                                                onChange={e => {
                                                    const b = banks.find(x => x.code === e.target.value);
                                                    setPayoutForm({ ...payoutForm, bankCode: e.target.value, bankName: b?.name || "" });
                                                }}
                                            >
                                                <option value="" className="bg-[#111118]">Choose Bank</option>
                                                {banks.map(b => (
                                                    <option key={b.code} value={b.code} className="bg-[#111118]">{b.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Account Number</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="10 digits"
                                                    maxLength={10}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-[#eb0000]/40 transition-all"
                                                    value={payoutForm.accountNumber}
                                                    onChange={e => setPayoutForm({ ...payoutForm, accountNumber: e.target.value.replace(/\D/g, "") })}
                                                />
                                                {isResolving && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                        <Loader2 className="w-4 h-4 text-[#eb0000] animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Verified Name</label>
                                            <div className={cn(
                                                "w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-white/50 font-bold",
                                                payoutForm.accountName && "text-emerald-400 border-emerald-500/20 bg-emerald-500/5 transition-all"
                                            )}>
                                                {payoutForm.accountName || (isResolving ? "Verifying..." : "Awaiting details...")}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-[#eb0000] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-[#eb0000]/20 hover:bg-red-600 transition-all mt-4 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Payout"}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
