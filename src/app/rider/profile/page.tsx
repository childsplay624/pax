"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Phone, MapPin, Bike, Truck,
    Star, CheckCircle2, Shield, LogOut,
    Edit3, Loader2, Save, X, Camera, Upload
} from "lucide-react";
import Image from "next/image";
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
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    // Avatar upload state
    const fileRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data } = await (supabase as any)
                .from("riders")
                .select("*")
                .eq("user_id", user.id)
                .single();
            if (data) {
                setRider(data);
                setCity(data.current_city ?? "");
                if (data.avatar_url) setAvatarPreview(data.avatar_url);
            }
            setLoading(false);
        };
        load();
    }, []);

    /* ── Avatar upload ────────────────────────────────────────── */
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !rider) return;

        // Validate file type & size
        if (!file.type.startsWith("image/")) {
            showToast("Please select an image file", "error");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast("Image must be under 5 MB", "error");
            return;
        }

        // Show instant local preview
        const localPreview = URL.createObjectURL(file);
        setAvatarPreview(localPreview);
        setUploading(true);

        try {
            const ext = file.name.split(".").pop();
            const path = `${rider.id}/avatar.${ext}`;

            // Upload to Supabase Storage
            const { error: uploadErr } = await supabase.storage
                .from("rider-avatars")
                .upload(path, file, { upsert: true, contentType: file.type });

            if (uploadErr) throw uploadErr;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from("rider-avatars")
                .getPublicUrl(path);

            const publicUrl = urlData.publicUrl + `?t=${Date.now()}`; // cache-bust

            // Persist to riders table
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: dbErr } = await (supabase as any)
                .from("riders")
                .update({ avatar_url: publicUrl })
                .eq("id", rider.id);

            if (dbErr) throw dbErr;

            setAvatarPreview(publicUrl);
            setRider((p: any) => ({ ...p, avatar_url: publicUrl }));
            showToast("Profile photo updated!", "success");
        } catch (err: any) {
            showToast(err.message ?? "Upload failed", "error");
            setAvatarPreview(rider.avatar_url ?? null);
        } finally {
            setUploading(false);
        }
    };

    /* ── Status change ────────────────────────────────────────── */
    const handleStatusChange = (status: string) => {
        if (!rider || rider.status === status) return;
        start(async () => {
            const res = await setRiderStatus(rider.id, status as any);
            if (res.success) {
                setRider((p: any) => ({ ...p, status }));
                showToast("Status updated", "success");
            }
        });
    };

    /* ── City save ────────────────────────────────────────────── */
    const handleSaveCity = () => {
        if (!rider) return;
        start(async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
                .from("riders")
                .update({ current_city: city })
                .eq("id", rider.id);
            setRider((p: any) => ({ ...p, current_city: city }));
            setEditing(false);
            showToast("Location updated", "success");
        });
    };

    const showToast = (msg: string, type: "success" | "error") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3200);
    };

    const initials = rider?.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "R";

    return (
        <div className="min-h-screen bg-[#0a0a0e] p-4 lg:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

            {/* Hidden file input */}
            <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className={cn(
                            "fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl text-sm font-bold shadow-2xl backdrop-blur-xl border",
                            toast.type === "success"
                                ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300"
                                : "bg-red-950/90 border-red-500/30 text-red-300"
                        )}
                    >
                        {toast.type === "success" ? "✓" : "✕"} {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">

                {/* Page header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-4 bg-[#eb0000] rounded-full" />
                        <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">Rider Identity</span>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        My <span className="text-[#eb0000]">Profile</span>
                    </h1>
                </div>

                {/* ── Identity Card with Avatar Upload ── */}
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

                            {/* Avatar with upload overlay */}
                            <div className="relative flex-shrink-0 group">
                                <div className={cn(
                                    "w-24 h-24 rounded-[2rem] overflow-hidden border-2 transition-all duration-300",
                                    rider?.status === "active"
                                        ? "border-emerald-500/40"
                                        : "border-white/10"
                                )}>
                                    {avatarPreview ? (
                                        <Image
                                            src={avatarPreview}
                                            alt="Profile photo"
                                            width={96}
                                            height={96}
                                            className="w-full h-full object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[#eb0000]/20 to-[#111118] flex items-center justify-center">
                                            <span className="text-white font-black text-2xl">{initials}</span>
                                        </div>
                                    )}

                                    {/* Upload overlay on hover */}
                                    <button
                                        onClick={() => fileRef.current?.click()}
                                        disabled={uploading}
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-[2rem] flex flex-col items-center justify-center gap-1.5 transition-opacity duration-200 cursor-pointer"
                                    >
                                        {uploading ? (
                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                        ) : (
                                            <>
                                                <Camera className="w-6 h-6 text-white" />
                                                <span className="text-white text-[9px] font-black uppercase tracking-wider">Change</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Upload progress ring */}
                                {uploading && (
                                    <div className="absolute -inset-1 rounded-[2.2rem] border-2 border-[#eb0000]/50 animate-pulse" />
                                )}

                                {/* Camera badge */}
                                {!uploading && (
                                    <button
                                        onClick={() => fileRef.current?.click()}
                                        className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#eb0000] rounded-xl flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors border-2 border-[#0e0e14]"
                                    >
                                        <Camera className="w-3.5 h-3.5 text-white" />
                                    </button>
                                )}
                            </div>

                            {/* Info */}
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

                                {/* Upload hint */}
                                <button
                                    onClick={() => fileRef.current?.click()}
                                    disabled={uploading}
                                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/30 hover:text-white hover:border-white/20 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
                                >
                                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                    {uploading ? "Uploading…" : "Upload Photo"}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* ── Operational Sector ── */}
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

                    <AnimatePresence mode="wait">
                        {editing ? (
                            <motion.div
                                key="edit"
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-2 gap-3">
                                    {CITIES.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setCity(c)}
                                            className={cn(
                                                "py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all",
                                                city === c
                                                    ? "bg-[#eb0000] border-[#eb0000] text-white shadow-lg shadow-[#eb0000]/20"
                                                    : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white hover:border-white/20"
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
                            </motion.div>
                        ) : (
                            <motion.div
                                key="view"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex items-center gap-3 px-4 py-4 bg-white/[0.03] border border-white/[0.05] rounded-2xl"
                            >
                                <div className="w-2 h-2 rounded-full bg-[#eb0000] animate-pulse" />
                                <span className="text-white font-bold">{rider?.current_city ?? "Not set"}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ── Availability Status ── */}
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
                                {rider?.status === opt.val && isPending && <Loader2 className="w-4 h-4 animate-spin text-white/30" />}
                                {rider?.status === opt.val && !isPending && <CheckCircle2 className={cn("w-4 h-4", opt.color)} />}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* ── Account ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#111118] border border-white/[0.06] rounded-[2rem] p-7 mb-8"
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
