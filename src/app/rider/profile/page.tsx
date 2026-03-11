"use client";

import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
    User, Phone, MapPin, Bike, Truck,
    Star, CheckCircle2, Shield, LogOut,
    Edit3, Loader2, Save, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { setRiderStatus } from "@/app/actions/rider";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const CITIES = [
    "Lagos", "Abuja", "Kano", "Port Harcourt", "Ibadan",
    "Kaduna", "Enugu", "Jos", "Calabar", "Abeokuta"
];

const STATUS_OPTIONS = [
    { val: "active", label: "Active", desc: "Visible to dispatch system", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
    { val: "resting", label: "Resting", desc: "Taking a break", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
    { val: "offline", label: "Offline", desc: "Not available", color: "text-white/30", bg: "bg-white/[0.03]", border: "border-white/10" },
];

export default function RiderProfilePage() {
    const [rider, setRider] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [city, setCity] = useState("");
    const [isPending, start] = useTransition();
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await (supabase as any)
                .from("riders")
                .select("*")
                .eq("user_id", user.id)
                .single();
            if (data) { setRider(data); setCity(data.current_city ?? ""); }
            setLoading(false);
        };
        load();
    }, []);

    const handleStatusChange = (status: string) => {
        if (!rider || rider.status === status) return;
        start(async () => {
            const res = await setRiderStatus(rider.id, status as any);
            if (res.success) {
                setRider((p: any) => ({ ...p, status }));
                showToast("Status updated successfully");
            }
        });
    };

    const handleSaveCity = () => {
        if (!rider) return;
        start(async () => {
            await (supabase as any)
                .from("riders")
                .update({ current_city: city })
                .eq("id", rider.id);
            setRider((p: any) => ({ ...p, current_city: city }));
            setEditing(false);
            showToast("Location updated");
        });
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0e] p-4 lg:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

            {/* Toast */}
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-[#1a1a22] border border-white/10 rounded-2xl text-white text-sm font-bold shadow-2xl"
                >
                    ✓ {toast}
                </motion.div>
            )}

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-4 bg-[#eb0000] rounded-full" />
                        <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">Rider Identity</span>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        My <span className="text-[#eb0000]">Profile</span>
                    </h1>
                </div>

                {/* Identity Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#111118] to-[#0e0e14] border border-white/[0.08] rounded-[2.5rem] p-8"
                >
                    {loading ? (
                        <div className="flex items-center gap-6 animate-pulse">
                            <div className="w-24 h-24 rounded-[2rem] bg-white/[0.04]" />
                            <div className="space-y-3 flex-1">
                                <div className="h-6 bg-white/[0.04] rounded-full w-1/2" />
                                <div className="h-4 bg-white/[0.03] rounded-full w-1/3" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-6 flex-wrap">
                            <div className={cn(
                                "w-24 h-24 rounded-[2rem] flex items-center justify-center border-2 text-white/60 transition-all",
                                rider?.status === "active"
                                    ? "bg-emerald-500/10 border-emerald-500/30"
                                    : "bg-white/[0.05] border-white/10"
                            )}>
                                {rider?.vehicle_type === "bike"
                                    ? <Bike className="w-12 h-12" />
                                    : <Truck className="w-12 h-12" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                    {rider?.full_name}
                                </h2>
                                <div className="flex items-center gap-4 mt-2 flex-wrap">
                                    <span className="flex items-center gap-1.5 text-white/40 text-xs font-bold">
                                        <Phone className="w-3.5 h-3.5" /> {rider?.phone}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-white/40 text-xs font-bold capitalize">
                                        {rider?.vehicle_type === "bike" ? <Bike className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                                        {rider?.vehicle_type}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-amber-400 text-xs font-black">
                                        <Star className="w-3.5 h-3.5" /> {rider?.rating}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-emerald-400/70 text-xs font-bold">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> {rider?.total_deliveries} drops
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Current Location */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#111118] border border-white/[0.06] rounded-[2rem] p-7"
                >
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-[#eb0000]" />
                            <h3 className="text-white font-bold tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                Operational Sector
                            </h3>
                        </div>
                        <button
                            onClick={() => setEditing(!editing)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            {editing ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Edit3 className="w-3.5 h-3.5" /> Edit</>}
                        </button>
                    </div>

                    {editing ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {CITIES.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setCity(c)}
                                        className={cn(
                                            "py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all",
                                            city === c
                                                ? "bg-[#eb0000] border-[#eb0000] text-white shadow-lg"
                                                : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white"
                                        )}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleSaveCity}
                                disabled={isPending}
                                className="w-full py-4 rounded-2xl bg-[#eb0000] text-white text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#eb0000]/20"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Location</>}
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 px-4 py-4 bg-white/[0.03] border border-white/[0.05] rounded-2xl">
                            <div className="w-2 h-2 rounded-full bg-[#eb0000] animate-pulse" />
                            <span className="text-white font-bold">{rider?.current_city ?? "Not set"}</span>
                        </div>
                    )}
                </motion.div>

                {/* Status Control */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-[#111118] border border-white/[0.06] rounded-[2rem] p-7"
                >
                    <div className="flex items-center gap-3 mb-5">
                        <Shield className="w-5 h-5 text-blue-400" />
                        <h3 className="text-white font-bold tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            Availability Status
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {STATUS_OPTIONS.map(opt => (
                            <button
                                key={opt.val}
                                onClick={() => handleStatusChange(opt.val)}
                                disabled={isPending}
                                className={cn(
                                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all text-left",
                                    rider?.status === opt.val
                                        ? cn(opt.bg, opt.border)
                                        : "bg-white/[0.02] border-white/[0.05] hover:border-white/20"
                                )}
                            >
                                <div className={cn(
                                    "w-3 h-3 rounded-full flex-shrink-0",
                                    opt.val === "active" ? "bg-emerald-400" :
                                        opt.val === "resting" ? "bg-amber-400" : "bg-white/20"
                                )} />
                                <div className="flex-1">
                                    <p className={cn("text-sm font-black", rider?.status === opt.val ? opt.color : "text-white/50")}>{opt.label}</p>
                                    <p className="text-[10px] text-white/20 font-medium mt-0.5">{opt.desc}</p>
                                </div>
                                {rider?.status === opt.val && isPending && (
                                    <Loader2 className="w-4 h-4 animate-spin text-white/30" />
                                )}
                                {rider?.status === opt.val && !isPending && (
                                    <CheckCircle2 className={cn("w-4 h-4", opt.color)} />
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Account Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#111118] border border-white/[0.06] rounded-[2rem] p-7"
                >
                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Account</h3>
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-[#eb0000]/5 border border-[#eb0000]/20 text-[#eb0000]/80 hover:bg-[#eb0000]/10 hover:text-[#eb0000] text-xs font-black uppercase tracking-widest transition-all"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out of Rider Hub
                    </button>
                </motion.div>

            </div>
        </div>
    );
}
