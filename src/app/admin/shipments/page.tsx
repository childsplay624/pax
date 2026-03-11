"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Package, MapPin, RefreshCw, ChevronRight, X,
    Truck, CheckCircle2, AlertCircle, Bell, Clock, Eye,
    Printer, ArrowUpRight, Shield, Activity, TrendingUp, Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { updateShipmentStatus } from "@/app/actions/admin";
import { cn } from "@/lib/utils";
import Link from "next/link";

const BOX = "bg-[#111116]/80 backdrop-blur-xl border border-white/[0.06] rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:border-white/10";
const STATUS_COLORS: Record<string, string> = {
    confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/5",
    collected: "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-purple-500/5",
    in_transit: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5",
    at_hub: "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-orange-500/5",
    out_for_delivery: "bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-sky-500/5",
    delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5",
    failed: "bg-red-500/10 text-red-500 border-red-500/20 shadow-red-500/5",
    pending: "bg-white/5 text-white/40 border-white/10",
};

const STATUS_LABELS: Record<string, string> = {
    confirmed: "Confirmed", collected: "Collected", in_transit: "In Transit",
    at_hub: "At Hub", out_for_delivery: "Out for Delivery", delivered: "Delivered",
    failed: "Failed", pending: "Pending",
};

const STATUS_ORDER = ["confirmed", "collected", "in_transit", "at_hub", "out_for_delivery", "delivered", "failed"];

interface Shipment {
    id: string;
    tracking_id: string;
    status: string;
    service_type: string;
    sender_name: string;
    sender_phone: string;
    sender_state: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_state: string;
    origin_city: string;
    destination_city: string;
    weight_kg: number;
    declared_value: number;
    rider_name: string;
    rider_phone: string;
    special_instructions: string;
    created_at: string;
    estimated_delivery: string;
}

export default function AdminShipmentsPage() {
    const [rows, setRows] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [selected, setSelected] = useState<Shipment | null>(null);
    const [updating, startUpdate] = useTransition();
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const load = async () => {
        setLoading(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q = (supabase as any).from("shipments").select("*").order("created_at", { ascending: false });
        if (filter !== "all") q = q.eq("status", filter);
        const { data } = await q;
        setRows(data ?? []);
        setLoading(false);
    };

    useEffect(() => { load(); }, [filter]);

    const handleStatusChange = (shipment: Shipment, newStatus: string) => {
        startUpdate(async () => {
            const result = await updateShipmentStatus(shipment.id, newStatus);
            if (result.success) {
                showToast(`✓ ${shipment.tracking_id} → ${STATUS_LABELS[newStatus]}. SMS sent.`);
                // Update local state optimistically
                setRows(prev => prev.map(r => r.id === shipment.id ? { ...r, status: newStatus } : r));
                if (selected?.id === shipment.id) setSelected(s => s ? { ...s, status: newStatus } : s);
            } else {
                showToast(result.error ?? "Update failed", "error");
            }
        });
    };

    const filtered = rows.filter(r =>
        !search ||
        r.tracking_id?.toLowerCase().includes(search.toLowerCase()) ||
        r.sender_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.recipient_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.destination_city?.toLowerCase().includes(search.toLowerCase()) ||
        r.origin_city?.toLowerCase().includes(search.toLowerCase())
    );

    const fmt = (n: number) => n ? `₦${Number(n).toLocaleString("en-NG")}` : "—";

    return (
        <div className="p-8 lg:p-12 space-y-10 min-h-screen bg-[#0c0c10]">
            {/* Toast notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className={cn(
                            "fixed top-12 right-12 z-[100] px-8 py-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-xs font-black uppercase tracking-widest flex items-center gap-4 backdrop-blur-2xl border",
                            toast.type === "success"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                        )}
                    >
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", toast.type === "success" ? "bg-emerald-500" : "bg-red-500")} />
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-4 bg-red-brand rounded-full" />
                        <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">Operational Matrix Active</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Payload <span className="text-red-brand">Matrix</span>
                    </h1>
                    <p className="text-white/20 text-[11px] font-bold uppercase tracking-[0.2em] mt-3">{rows.length} Active Vectors Synchronized</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-red-brand transition-colors" />
                        <input
                            type="text"
                            placeholder="Search Matrix..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-white/[0.03] border border-white/[0.08] rounded-2xl pl-12 pr-6 py-4 text-xs text-white placeholder-white/20 outline-none focus:border-red-brand/40 focus:bg-white/[0.05] transition-all w-72 font-black uppercase tracking-widest"
                        />
                    </div>
                    <button onClick={load}
                        className={cn("w-14 h-14 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white/30 hover:text-white hover:bg-white/[0.06] transition-all hover:border-white/20", loading && "opacity-50 pointer-events-none")}>
                        <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Status Filter Hub */}
            <div className="flex flex-wrap gap-3">
                {["all", ...STATUS_ORDER].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={cn(
                            "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all relative overflow-hidden group",
                            filter === s
                                ? "bg-white text-black border-white shadow-xl"
                                : "bg-white/[0.02] text-white/30 border-white/[0.06] hover:bg-white/[0.05] hover:text-white"
                        )}>
                        <span className="relative z-10">{s === "all" ? `Universal (${rows.length})` : STATUS_LABELS[s]}</span>
                        {filter !== s && <div className="absolute inset-0 bg-red-brand translate-y-full group-hover:translate-y-0 transition-transform opacity-10" />}
                    </button>
                ))}
            </div>

            {/* Payload Matrix Registry */}
            <div className={BOX}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.01] border-b border-white/[0.06]">
                                {["Vector Identity", "Distribution Route", "Payload Specs", "Status Protocol", "Date Log", ""].map(h => (
                                    <th key={h} className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/10 first:pl-12 last:pr-12">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i}><td colSpan={6} className="px-12 py-12 animate-pulse"><div className="h-6 bg-white/[0.03] rounded-2xl w-full" /></td></tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="px-12 py-32 text-center">
                                    <div className="inline-flex flex-col items-center gap-6 opacity-20">
                                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-white flex items-center justify-center">
                                            <Package className="w-10 h-10" />
                                        </div>
                                        <p className="font-black uppercase tracking-[0.4em] text-xs">No active payloads in this frequency</p>
                                    </div>
                                </td></tr>
                            ) : filtered.map((s, idx) => (
                                <motion.tr
                                    key={s.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group hover:bg-white/[0.02] transition-colors relative"
                                >
                                    <td className="px-12 py-8">
                                        <div className="flex items-center gap-6">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-white/10 to-transparent border border-white/10 flex items-center justify-center text-white/40 group-hover:text-red-brand group-hover:scale-110 transition-all shadow-lg">
                                                    <Package className="w-6 h-6" />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-base font-black text-white tracking-tight font-mono">{s.tracking_id}</p>
                                                    <ArrowUpRight className="w-3 h-3 text-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                                    <span className="w-1 h-1 bg-white/20 rounded-full" /> Sub: {s.service_type}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="space-y-2">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-lg">
                                                <MapPin className="w-3 h-3 text-red-brand/40" />
                                                <span className="text-[11px] font-bold text-white/60 tabular-nums">{s.origin_city} <span className="text-white/20 mx-1">→</span> {s.destination_city}</span>
                                            </div>
                                            <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] flex items-center gap-2 pl-1">
                                                <Activity className="w-3 h-3 text-blue-400/30" /> Sector: {s.recipient_state}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-white/80 tabular-nums">{s.weight_kg} <span className="text-[10px] text-white/20 uppercase">KG</span></p>
                                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">{fmt(s.declared_value)}</p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className={cn("inline-flex px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] border shadow-sm transition-all", STATUS_COLORS[s.status] || STATUS_COLORS.pending)}>
                                            {STATUS_LABELS[s.status] || s.status}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-white/40 tabular-nums">
                                                {new Date(s.created_at).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                                            </p>
                                            <p className="text-[9px] text-white/10 font-black uppercase tracking-widest italic">Sync Cycle: active</p>
                                        </div>
                                    </td>
                                    <td className="px-12 py-8 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden p-1 shadow-2xl">
                                                <select
                                                    value={s.status}
                                                    disabled={updating}
                                                    onChange={e => handleStatusChange(s, e.target.value)}
                                                    className="appearance-none bg-transparent text-[10px] font-black uppercase tracking-widest text-white/50 px-4 py-2 outline-none cursor-pointer hover:text-white transition-colors">
                                                    {STATUS_ORDER.map(st => (
                                                        <option key={st} value={st} className="bg-[#111116]">{STATUS_LABELS[st]}</option>
                                                    ))}
                                                </select>
                                                <div className="w-px h-6 bg-white/10 mx-1" />
                                                <button
                                                    onClick={() => setSelected(s)}
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                                >
                                                    <Eye className="w-4.5 h-4.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vector Analysis Slide-over */}
            <AnimatePresence>
                {selected && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[110]"
                            onClick={() => setSelected(null)} />

                        <motion.aside
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                            className="fixed top-0 right-0 bottom-0 z-[120] w-full max-w-lg bg-[#0c0c10] border-l border-white/[0.08] flex flex-col overflow-hidden shadow-[-40px_0_80px_rgba(0,0,0,0.5)]">

                            <div className="p-10 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-red-brand/10 blur-[100px] pointer-events-none" />
                                <div className="flex items-center justify-between relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="w-3.5 h-3.5 text-red-brand" />
                                            <span className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">Payload Protocol</span>
                                        </div>
                                        <h2 className="text-3xl font-black text-white tracking-tighter font-mono">{selected.tracking_id}</h2>
                                    </div>
                                    <button onClick={() => setSelected(null)}
                                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.03] text-white/40 hover:text-white hover:bg-white/10 transition-all shadow-xl">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-12 space-y-12 relative">
                                {/* Status Protocol Matrix */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Operational Sequence Update</h4>
                                        {updating && <Loader2 className="w-4 h-4 text-red-brand animate-spin" />}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {STATUS_ORDER.map(st => (
                                            <button key={st}
                                                disabled={updating || selected.status === st}
                                                onClick={() => handleStatusChange(selected, st)}
                                                className={cn(
                                                    "p-5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden group",
                                                    selected.status === st
                                                        ? "bg-red-brand border-red-brand text-white shadow-xl shadow-red-brand/20"
                                                        : "bg-white/[0.02] border-white/5 text-white/50 hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                                                )}>
                                                <span className="relative z-10">{STATUS_LABELS[st]}</span>
                                                {selected.status !== st && <div className="absolute inset-0 bg-red-brand translate-y-full group-hover:translate-y-0 transition-transform opacity-10" />}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-white/10 font-bold uppercase tracking-widest text-center mt-4 italic italic">Encryption protocol: auto-sms notifications active</p>
                                </div>

                                {/* Distribution Geometry */}
                                <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/[0.08] space-y-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <TrendingUp className="w-20 h-20 text-white" />
                                    </div>
                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className="text-center">
                                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-2">Origin</p>
                                            <p className="text-xl font-black text-white tracking-tight">{selected.origin_city}</p>
                                            <p className="text-[9px] text-white/40 font-bold uppercase mt-1">{selected.sender_state}</p>
                                        </div>
                                        <div className="flex-1 border-t-2 border-dashed border-white/10 relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#111116] px-4">
                                                <Truck className="w-6 h-6 text-red-brand animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-2">Target</p>
                                            <p className="text-xl font-black text-white tracking-tight">{selected.destination_city}</p>
                                            <p className="text-[9px] text-white/40 font-bold uppercase mt-1">{selected.recipient_state}</p>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-white/5 grid grid-cols-3 gap-6 relative z-10">
                                        <div>
                                            <p className="text-[9px] text-white/20 uppercase font-black tracking-widest mb-1">Service Type</p>
                                            <p className="text-white text-xs font-black capitalize tracking-tight">{selected.service_type?.replace("_", " ")}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-white/20 uppercase font-black tracking-widest mb-1">Payload Wt</p>
                                            <p className="text-white text-xs font-black tabular-nums">{selected.weight_kg} <span className="text-[8px] opacity-40">KG</span></p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-white/20 uppercase font-black tracking-widest mb-1">Value Sync</p>
                                            <p className="text-white text-xs font-black tabular-nums">{fmt(selected.declared_value)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Entity Links */}
                                <div className="space-y-6">
                                    {[
                                        { label: "Sender Details", name: selected.sender_name, phone: selected.sender_phone, sub: "Source Node" },
                                        { label: "Recipient Details", name: selected.recipient_name, phone: selected.recipient_phone, sub: "Termination Node" },
                                    ].map(p => (
                                        <div key={p.label} className="group p-8 rounded-[2rem] bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em]">{p.label}</span>
                                                <span className="text-[9px] text-white/10 font-black uppercase tracking-widest">{p.sub}</span>
                                            </div>
                                            <p className="text-lg font-black text-white tracking-tight mb-1 group-hover:text-red-brand transition-colors">{p.name || "UNREGISTERED"}</p>
                                            <p className="text-[11px] text-white/40 font-mono tracking-widest">{p.phone || "NODE_TEL_MISSING"}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Logistics Node (Rider) */}
                                {selected.rider_name && (
                                    <div className="p-8 rounded-[2rem] bg-emerald-500/[0.03] border border-emerald-500/10 flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                            <Truck className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-emerald-500/40 uppercase font-black tracking-widest mb-1">Assigned Logistics Unit</p>
                                            <p className="text-base font-black text-white tracking-tight">{selected.rider_name}</p>
                                            <p className="text-[10px] text-white/20 font-mono mt-1">{selected.rider_phone}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Action Matrix */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Link href={`/dashboard/shipments/${selected.id}/waybill`} target="_blank"
                                        className="flex flex-col items-center justify-center gap-3 p-8 rounded-[2.5rem] bg-red-brand text-white hover:bg-red-600 transition-all shadow-2xl shadow-red-brand/20 active:scale-95">
                                        <Printer className="w-6 h-6" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Print Waybill</span>
                                    </Link>
                                    <Link href={`/tracking?id=${selected.tracking_id}`} target="_blank"
                                        className="flex flex-col items-center justify-center gap-3 p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95">
                                        <MapPin className="w-6 h-6" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Track Live</span>
                                    </Link>
                                </div>
                            </div>

                            <div className="p-12 border-t border-white/[0.06] bg-white/[0.01]">
                                <p className="text-[10px] text-white/10 font-mono text-center uppercase tracking-[0.4em] leading-loose">
                                    Vector Status: Synchronized<br />
                                    Security Clearance: Root Admin
                                </p>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
