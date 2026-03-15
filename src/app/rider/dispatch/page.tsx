"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Navigation, Package, MapPin, Phone,
    ChevronRight, CheckCircle2, Loader2,
    Truck, AlertCircle, ExternalLink, Clock,
    ArrowRight, Radio, User, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { riderUpdateStatus } from "@/app/actions/rider";
import { cn } from "@/lib/utils";

const STATUS_FLOW = [
    { status: "collected", label: "Collected", desc: "Parcel picked up from sender", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { status: "in_transit", label: "In Transit", desc: "Moving to destination hub", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { status: "at_hub", label: "At Hub", desc: "Arrived at delivery hub", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { status: "out_for_delivery", label: "Out for Delivery", desc: "Last-mile delivery underway", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
    { status: "delivered", label: "Delivered", desc: "Parcel handed to recipient", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
];

const NEXT_STATUS: Record<string, string> = {
    collected: "in_transit",
    in_transit: "at_hub",
    at_hub: "out_for_delivery",
    out_for_delivery: "delivered",
};

const NEXT_STATUS_LABEL: Record<string, string> = {
    collected: "Mark In Transit",
    in_transit: "Mark At Hub",
    at_hub: "Mark Out for Delivery",
    out_for_delivery: "Mark Delivered",
};

export default function RiderDispatchPage() {
    const [shipments, setShipments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any>(null);
    const [confirm, setConfirm] = useState<{ shipment: any; nextStatus: string } | null>(null);
    const [isPending, start] = useTransition();
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [locationInput, setLocationInput] = useState("");
    const [riderId, setRiderId] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: riderData } = await (supabase as any)
                .from("riders")
                .select("id, full_name, status")
                .eq("user_id", user.id)
                .single();

            if (!riderData) { setLoading(false); return; }
            setRiderId(riderData.id);

            const { data } = await (supabase as any)
                .from("shipments")
                .select("*")
                .eq("rider_id", riderData.id)
                .in("status", ["collected", "in_transit", "at_hub", "out_for_delivery"])
                .order("created_at", { ascending: true });

            setShipments(data ?? []);
            setLoading(false);
        };
        load();
    }, []);

    const handleStatusUpdate = (shipment: any) => {
        const next = NEXT_STATUS[shipment.status];
        if (!next) return;
        setConfirm({ shipment, nextStatus: next });
    };

    const executeUpdate = () => {
        if (!confirm) return;
        start(async () => {
            const res = await riderUpdateStatus(confirm.shipment.id, confirm.nextStatus as any, locationInput);
            if (res.success) {
                setShipments(prev => prev.map(s =>
                    s.id === confirm.shipment.id ? { ...s, status: confirm.nextStatus } : s
                ).filter(s => s.status !== "delivered"));
                if (selected?.id === confirm.shipment.id) setSelected((p: any) => ({ ...p, status: confirm.nextStatus }));
                showToast(`✓ Status updated to ${confirm.nextStatus.replace(/_/g, " ")}`, "success");
                setLocationInput(""); // Clear location input
            } else {
                showToast(res.error ?? "Update failed", "error");
            }
            setConfirm(null);
        });
    };

    const showToast = (msg: string, type: "success" | "error") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const getStatusInfo = (status: string) =>
        STATUS_FLOW.find(s => s.status === status) ?? STATUS_FLOW[0];

    const getProgress = (status: string) => {
        const idx = STATUS_FLOW.findIndex(s => s.status === status);
        return Math.round(((idx + 1) / STATUS_FLOW.length) * 100);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0e] relative overflow-hidden">

            {/* Background effects */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#eb0000]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* ── Toast ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
                        className={cn(
                            "fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl text-sm font-bold shadow-2xl backdrop-blur-xl border",
                            toast.type === "success"
                                ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300"
                                : "bg-red-950/90 border-red-500/30 text-red-300"
                        )}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Confirm Modal ── */}
            <AnimatePresence>
                {confirm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md"
                            onClick={() => setConfirm(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none"
                        >
                            <div className="bg-[#111118] border border-white/10 rounded-[2.5rem] p-10 w-full max-w-md pointer-events-auto shadow-2xl">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-[#eb0000]/10 border border-[#eb0000]/20 flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-8 h-8 text-[#eb0000]" />
                                </div>
                                <h2 className="text-2xl font-black text-white text-center tracking-tight mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                    Confirm Status Update
                                </h2>
                                <p className="text-white/40 text-sm text-center mb-8">
                                    Set <span className="text-white font-bold">{confirm.shipment.tracking_id}</span> to{" "}
                                    <span className="text-emerald-400 font-bold">{confirm.nextStatus.replace(/_/g, " ").toUpperCase()}</span>?
                                </p>

                                {/* Location Input */}
                                <div className="mb-8 space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Current Location (Optional)</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#eb0000] transition-colors" />
                                        <input
                                            type="text"
                                            value={locationInput}
                                            onChange={(e) => setLocationInput(e.target.value)}
                                            placeholder="e.g. Lekki Hub, Lagos"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-[#eb0000]/50 transition-all placeholder:text-white/10"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setConfirm(null)}
                                        className="py-4 rounded-2xl bg-white/[0.04] border border-white/10 text-white/50 hover:text-white text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={executeUpdate}
                                        disabled={isPending}
                                        className="py-4 rounded-2xl bg-[#eb0000] text-white text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#eb0000]/20 disabled:opacity-40"
                                    >
                                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Confirm <CheckCircle2 className="w-4 h-4" /></>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className="relative z-10 flex h-[calc(100vh-56px)]">

                {/* ── Left: Dispatch List ── */}
                <div className={cn(
                    "flex flex-col border-r border-white/[0.06] bg-[#0d0d12] transition-all duration-300",
                    selected ? "hidden lg:flex w-[380px] flex-shrink-0" : "flex w-full lg:w-[380px] lg:flex-shrink-0"
                )}>
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-white/[0.06]">
                        <div className="flex items-center gap-3 mb-1">
                            <Navigation className="w-5 h-5 text-[#eb0000]" />
                            <h1 className="text-white font-black text-lg tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                Active Dispatch
                            </h1>
                        </div>
                        <p className="text-white/30 text-xs">
                            {loading ? "Loading..." : `${shipments.length} payload${shipments.length !== 1 ? "s" : ""} assigned to you`}
                        </p>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="p-6 border-b border-white/[0.04] animate-pulse flex gap-4">
                                    <div className="w-12 h-12 bg-white/[0.04] rounded-2xl" />
                                    <div className="flex-1 space-y-2 pt-1">
                                        <div className="h-4 bg-white/[0.04] rounded-full w-2/3" />
                                        <div className="h-3 bg-white/[0.03] rounded-full w-1/2" />
                                    </div>
                                </div>
                            ))
                        ) : shipments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-20 px-8 text-center">
                                <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mb-5">
                                    <Radio className="w-10 h-10 text-white/10" />
                                </div>
                                <p className="text-white/20 font-black uppercase tracking-[0.3em] text-xs">No Active Payloads</p>
                                <p className="text-white/10 text-[10px] mt-2">Go active and wait for dispatch.</p>
                            </div>
                        ) : shipments.map((s, i) => {
                            const statusInfo = getStatusInfo(s.status);
                            const isSelected = selected?.id === s.id;
                            const progress = getProgress(s.status);
                            return (
                                <motion.div
                                    key={s.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.07 }}
                                    onClick={() => setSelected(s)}
                                    className={cn(
                                        "p-6 border-b border-white/[0.04] cursor-pointer transition-all group",
                                        isSelected ? "bg-white/[0.05] border-l-2 border-l-[#eb0000]" : "hover:bg-white/[0.02]"
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", statusInfo.bg, statusInfo.border, "border")}>
                                            <Package className={cn("w-6 h-6", statusInfo.color)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-white font-black text-sm font-mono truncate">{s.tracking_id}</p>
                                                <ChevronRight className={cn("w-4 h-4 flex-shrink-0 transition-colors", isSelected ? "text-[#eb0000]" : "text-white/10 group-hover:text-white/30")} />
                                            </div>
                                            <p className="text-white/50 text-xs font-bold truncate">
                                                {s.sender_state} <ArrowRight className="w-3 h-3 inline" /> {s.recipient_state}
                                            </p>
                                            {/* Status badge */}
                                            <div className="flex items-center gap-2 mt-3">
                                                <span className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border", statusInfo.bg, statusInfo.color, statusInfo.border)}>
                                                    {statusInfo.label}
                                                </span>
                                                {/* progress bar */}
                                                <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#eb0000] rounded-full transition-all duration-700"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-[9px] font-black text-white/20">{progress}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Right: Detail Panel ── */}
                <div className={cn(
                    "flex-1 overflow-y-auto",
                    !selected && "hidden lg:flex items-center justify-center bg-[#0a0a0e]"
                )}>
                    {!selected ? (
                        <div className="text-center px-10">
                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mx-auto mb-6">
                                <Package className="w-12 h-12 text-white/10" />
                            </div>
                            <p className="text-white/20 font-black uppercase tracking-[0.3em] text-sm">Select a Payload</p>
                            <p className="text-white/10 text-xs mt-2">Pick a shipment from the list to view details</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selected.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-6 lg:p-10 max-w-2xl"
                            >
                                {/* Back button (mobile) */}
                                <button
                                    onClick={() => setSelected(null)}
                                    className="lg:hidden flex items-center gap-2 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 transition-colors"
                                >
                                    <X className="w-4 h-4" /> Back to List
                                </button>

                                {/* Tracking ID header */}
                                <div className="mb-8">
                                    <p className="text-[#eb0000] text-[10px] font-black uppercase tracking-[0.4em] mb-1">Active Payload</p>
                                    <h2 className="text-3xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                        {selected.tracking_id}
                                    </h2>
                                </div>

                                {/* Status flow stepper */}
                                <div className="bg-[#111118] border border-white/[0.06] rounded-[2rem] p-7 mb-6">
                                    <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-6">Delivery Pipeline</h3>
                                    <div className="space-y-4">
                                        {STATUS_FLOW.map((step, i) => {
                                            const currentIdx = STATUS_FLOW.findIndex(s => s.status === selected.status);
                                            const isDone = i < currentIdx;
                                            const isCurrent = i === currentIdx;
                                            return (
                                                <div key={step.status} className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                                                        isDone ? "bg-emerald-500/20 border border-emerald-500/30" :
                                                            isCurrent ? cn(step.bg, "border", step.border, "shadow-lg") :
                                                                "bg-white/[0.03] border border-white/[0.05]"
                                                    )}>
                                                        {isDone
                                                            ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                            : <div className={cn("w-2 h-2 rounded-full", isCurrent ? step.color.replace("text-", "bg-") : "bg-white/10")} />
                                                        }
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={cn("text-xs font-black uppercase tracking-widest", isDone ? "text-emerald-400" : isCurrent ? step.color : "text-white/20")}>
                                                            {step.label}
                                                        </p>
                                                        {isCurrent && <p className="text-white/30 text-[10px] mt-0.5">{step.desc}</p>}
                                                    </div>
                                                    {isCurrent && (
                                                        <span className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border", step.bg, step.color, step.border)}>
                                                            CURRENT
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Route Summary */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {[
                                        { label: "Pick Up From", val: selected.sender_name, sub: selected.sender_state, icon: MapPin, color: "text-blue-400", bg: "bg-blue-500/10" },
                                        { label: "Deliver To", val: selected.recipient_name, sub: selected.recipient_state, icon: Navigation, color: "text-[#eb0000]", bg: "bg-[#eb0000]/10" },
                                    ].map(item => (
                                        <div key={item.label} className="bg-[#111118] border border-white/[0.06] rounded-[1.5rem] p-6">
                                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-4", item.bg)}>
                                                <item.icon className={cn("w-4.5 h-4.5", item.color)} />
                                            </div>
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">{item.label}</p>
                                            <p className="text-white font-bold text-sm truncate">{item.val}</p>
                                            <p className="text-white/40 text-xs mt-0.5">{item.sub}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Contact Info */}
                                <div className="bg-[#111118] border border-white/[0.06] rounded-[1.5rem] p-6 mb-6 space-y-4">
                                    <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Contact Details</h3>
                                    {[
                                        { label: "Sender", name: selected.sender_name, phone: selected.sender_phone },
                                        { label: "Recipient", name: selected.recipient_name, phone: selected.recipient_phone },
                                    ].map(p => (
                                        <div key={p.label} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-white/[0.05] flex items-center justify-center text-white font-black text-xs">
                                                    {p.name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">{p.label}</p>
                                                    <p className="text-white text-sm font-bold">{p.name}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={`tel:${p.phone}`}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                <Phone className="w-3.5 h-3.5" /> Call
                                            </a>
                                        </div>
                                    ))}
                                </div>

                                {/* Shipment details */}
                                <div className="bg-[#111118] border border-white/[0.06] rounded-[1.5rem] p-6 mb-8">
                                    <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Payload Specs</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        {[
                                            ["Service", selected.service_type?.replace(/_/g, " ")],
                                            ["Weight", `${selected.weight_kg} kg`],
                                            ["Declared Value", selected.declared_value ? `₦${Number(selected.declared_value).toLocaleString()}` : "—"],
                                            ["Insured", selected.insured ? "✓ Yes" : "No"],
                                        ].map(([k, v]) => (
                                            <div key={k as string}>
                                                <p className="text-white/20 text-[9px] font-black uppercase tracking-widest mb-1">{k}</p>
                                                <p className="text-white font-bold capitalize">{v}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {selected.special_instructions && (
                                        <div className="mt-4 pt-4 border-t border-white/[0.04]">
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Special Instructions</p>
                                            <p className="text-amber-400/80 text-xs font-medium leading-relaxed">{selected.special_instructions}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                {NEXT_STATUS[selected.status] && (
                                    <div className="space-y-4">
                                        {/* Maps Deep Link */}
                                        <a
                                            href={`https://maps.google.com/?q=${encodeURIComponent(
                                                selected.status === "out_for_delivery"
                                                    ? `${selected.recipient_address || ''}, ${selected.destination_city || ''}, ${selected.recipient_state || ''}`
                                                    : `${selected.destination_city || ''}, ${selected.recipient_state || ''}`
                                            )}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-xs font-black uppercase tracking-widest transition-all"
                                        >
                                            <Navigation className="w-4 h-4" /> Open in Maps <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                                        </a>

                                        {/* Status Advance CTA */}
                                        <button
                                            onClick={() => handleStatusUpdate(selected)}
                                            disabled={isPending}
                                            className="w-full flex items-center justify-center gap-3 py-5 rounded-[1.75rem] bg-[#eb0000] text-white text-sm font-black uppercase tracking-[0.2em] hover:bg-red-600 transition-all shadow-2xl shadow-[#eb0000]/25 disabled:opacity-30 active:scale-95"
                                        >
                                            {isPending
                                                ? <Loader2 className="w-5 h-5 animate-spin" />
                                                : <><CheckCircle2 className="w-5 h-5" /> {NEXT_STATUS_LABEL[selected.status]}</>
                                            }
                                        </button>

                                        <p className="text-center text-[9px] text-white/15 font-bold uppercase tracking-[0.2em]">
                                            This action updates tracking for sender &amp; recipient
                                        </p>
                                    </div>
                                )}

                                {selected.status === "delivered" && (
                                    <div className="text-center py-8 border border-emerald-500/20 rounded-[2rem] bg-emerald-500/5">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                                        <p className="text-emerald-400 font-black uppercase tracking-widest text-sm">Delivered Successfully</p>
                                        <p className="text-white/30 text-xs mt-1">Great work! Earnings will be credited to your wallet.</p>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}
