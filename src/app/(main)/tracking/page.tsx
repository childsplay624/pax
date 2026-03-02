"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense, useTransition } from "react";
import {
    Search, Package, CheckCircle2, Clock, MapPin, Shield,
    Wifi, Radio, Phone, AlertCircle, ArrowRight, Zap,
    RotateCcw, Truck, Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { Shipment, TrackingEvent } from "@/types/database";

/* ── Countdown hook ──────────────────────────────────────────── */
const useCountdown = (etaStr: string | null) => {
    const [t, setT] = useState({ h: 0, m: 0, s: 0 });
    useEffect(() => {
        const update = () => {
            if (!etaStr) return;
            const diff = Math.max(0, new Date(etaStr).getTime() - Date.now());
            const totalSec = Math.floor(diff / 1000);
            setT({ h: Math.floor(totalSec / 3600), m: Math.floor((totalSec % 3600) / 60), s: totalSec % 60 });
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [etaStr]);
    return t;
};

/* ── Progress bar ───────────────────────────────────────────── */
const ProgressBar = ({ events }: { events: TrackingEvent[] }) => {
    const total = events.length;
    const doneCount = events.filter(e => e.status === "done").length;
    const curIdx = events.findIndex(e => e.status === "current");
    const progress = curIdx >= 0 ? curIdx : doneCount;
    const pct = total > 1 ? Math.round((progress / (total - 1)) * 100) : 0;
    const origin = events[0]?.event_location?.split("—")[0]?.trim() ?? "Origin";
    const dest = events[events.length - 1]?.event_location ?? "Destination";

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-white/40 uppercase tracking-wider">
                <span>{origin}</span>
                <span className="text-red-400">{pct}% Complete</span>
                <span>{dest}</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-red-brand to-red-400 relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-[3px] border-red-brand shadow-md shadow-red-brand/30" />
                </motion.div>
            </div>
            <div className="flex justify-between">
                {events.map((e) => (
                    <div key={e.id} className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        e.status === "done" ? "bg-red-brand" :
                            e.status === "current" ? "bg-red-brand animate-pulse" : "bg-white/20"
                    )} />
                ))}
            </div>
        </div>
    );
};

/* ── Nigeria route map ───────────────────────────────────────── */
const RouteMap = ({ origin, dest }: { origin: string; dest: string }) => (
    <div className="relative w-full h-full bg-ink-900 flex items-center justify-center overflow-hidden rounded-2xl">
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 400 260" preserveAspectRatio="none">
            {Array.from({ length: 9 }).map((_, i) => <line key={`v${i}`} x1={(i / 8) * 400} y1={0} x2={(i / 8) * 400} y2={260} stroke="white" strokeWidth="0.5" />)}
            {Array.from({ length: 7 }).map((_, i) => <line key={`h${i}`} x1={0} y1={(i / 6) * 260} x2={400} y2={(i / 6) * 260} stroke="white" strokeWidth="0.5" />)}
        </svg>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 260" preserveAspectRatio="none">
            <path d="M 60,200 Q 130,100 190,145" fill="none" stroke="#dc2626" strokeWidth="2" />
            <path d="M 190,145 Q 250,80 340,90" fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="8 5" opacity="0.5">
                <animate attributeName="stroke-dashoffset" values="0;-26" dur="1.2s" repeatCount="indefinite" calcMode="linear" />
            </path>
            <circle cx="60" cy="200" r="6" fill="#dc2626" /><circle cx="60" cy="200" r="12" fill="rgba(220,38,38,0.15)" />
            <circle cx="190" cy="145" r="5" fill="#dc2626">
                <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="190" cy="145" r="3.5" fill="white" />
            <circle cx="340" cy="90" r="6" fill="rgba(220,38,38,0.3)" stroke="#dc2626" strokeWidth="1.5" />
            <circle cx="340" cy="90" r="2.5" fill="#dc2626" />
        </svg>
        <div className="absolute bottom-3 left-4 text-[9px] font-bold text-white/50 uppercase tracking-widest">{origin}</div>
        <div className="absolute top-[54%] left-[46%] text-[9px] font-bold text-red-400 uppercase tracking-widest -translate-x-1/2 -translate-y-1/2">Via Ibadan ●</div>
        <div className="absolute top-[32%] right-6 text-[9px] font-bold text-white/50 uppercase tracking-widest">{dest}</div>
        <motion.div className="absolute rounded-full opacity-30"
            style={{ width: 120, height: 120, left: "calc(47% - 60px)", top: "calc(54% - 60px)", background: "conic-gradient(from 0deg,rgba(220,38,38,0) 0%,rgba(220,38,38,0.25) 15%,rgba(220,38,38,0) 25%)" }}
            animate={{ rotate: 360 }} transition={{ duration: 4, ease: "linear", repeat: Infinity }} />
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2.5 bg-black/40 backdrop-blur-sm border-b border-white/[0.06]">
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-red-400">PAX Live Route</span>
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-brand animate-pulse" /><span className="text-[9px] font-semibold text-white/50">{origin} → {dest}</span></div>
            <Wifi className="w-3 h-3 text-white/30" />
        </div>
    </div>
);

/* ── Skeleton ─────────────────────────────────────────────────  */
const Skeleton = () => (
    <div className="space-y-5 max-w-4xl mx-auto">
        <div className="skeleton h-6 w-48 rounded-xl" />
        <div className="skeleton h-4 w-80 rounded-xl" />
        <div className="skeleton h-56 rounded-3xl mt-6" />
        <div className="grid grid-cols-3 gap-4 mt-4">
            {[0, 1, 2].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
    </div>
);

/* ── Status label helper ─────────────────────────────────────── */
const statusLabel: Record<string, string> = {
    pending: "Pending", confirmed: "Order Confirmed", collected: "Collected",
    in_transit: "In Transit", at_hub: "At Hub", out_for_delivery: "Out for Delivery",
    delivered: "Delivered", failed: "Delivery Failed",
};

const sampleIds = ["PAX-738291", "PAX-004421"];

/* ── Main ─────────────────────────────────────────────────────  */
const TrackingContent = () => {
    const searchParams = useSearchParams();
    const urlId = searchParams.get("id") || "";
    const [trackingId, setTrackingId] = useState(urlId);
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [events, setEvents] = useState<TrackingEvent[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isPending, startTransition] = useTransition();

    const countdown = useCountdown(shipment?.estimated_delivery ?? null);

    const doSearch = async (id: string) => {
        if (!id.trim()) return;
        setError(null); setShipment(null); setEvents([]);

        startTransition(async () => {
            // Fetch from Supabase
            const { data: s, error: se } = await supabase
                .from("shipments")
                .select("*")
                .eq("tracking_id", id.toUpperCase().trim())
                .single();

            if (se || !s) { setError("Shipment not found. Please verify your tracking ID."); return; }
            setShipment(s as Shipment);

            const { data: evts } = await supabase
                .from("tracking_events")
                .select("*")
                .eq("tracking_id", id.toUpperCase().trim())
                .order("sort_order", { ascending: true });

            setEvents((evts ?? []) as TrackingEvent[]);
        });
    };

    useEffect(() => { if (urlId) doSearch(urlId); }, []); // eslint-disable-line

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); doSearch(trackingId); };

    return (
        <div className="min-h-screen bg-surface-50 pt-28 pb-32">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(220,38,38,0.05),transparent)] pointer-events-none" />

            <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">

                {/* ── Hero ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                    className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 bg-red-brand/8 border border-red-brand/15 rounded-full px-4 py-2 mb-6">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-brand animate-pulse" />
                        <span className="text-red-brand text-[10px] font-bold uppercase tracking-[0.3em]">Real-Time Tracking</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-bold text-ink-900 tracking-tight mb-2 leading-none" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Where's Your</h1>
                    <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-8 leading-none" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        <span className="gradient-text-red">Parcel?</span>
                    </h1>
                    <p className="text-ink-400 text-lg max-w-lg mx-auto">Enter your PAX tracking number for live updates across our Nigeria network.</p>
                </motion.div>

                {/* ── Search ── */}
                <motion.form onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="max-w-2xl mx-auto mb-5">
                    <div className={cn(
                        "bg-white rounded-2xl flex items-center border transition-all duration-300",
                        isFocused ? "border-red-brand/40 shadow-[0_0_0_4px_rgba(220,38,38,0.08),0_8px_32px_rgba(17,17,24,0.08)]"
                            : "border-surface-200 shadow-md shadow-ink-900/5"
                    )}>
                        <div className="pl-5 pr-2"><Package className="w-5 h-5 text-ink-300" /></div>
                        <input
                            type="text"
                            placeholder="Enter Tracking ID — e.g. PAX-738291"
                            className="flex-1 bg-transparent px-3 py-4 text-ink-900 font-semibold placeholder-ink-300 outline-none text-base"
                            value={trackingId}
                            onChange={e => setTrackingId(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                        />
                        <button type="submit" disabled={isPending}
                            className="btn-magnetic bg-red-brand hover:bg-red-dark disabled:opacity-60 text-white m-2 px-7 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-md shadow-red-brand/20 flex-shrink-0">
                            {isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                            Track
                        </button>
                    </div>
                </motion.form>

                {/* Sample chips */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="flex flex-wrap items-center justify-center gap-2 mb-16">
                    <span className="text-ink-300 text-xs font-semibold">Try a sample:</span>
                    {sampleIds.map(id => (
                        <button key={id} type="button"
                            onClick={() => { setTrackingId(id); doSearch(id); }}
                            className="bg-white border border-surface-200 rounded-full px-3 py-1 text-xs font-mono font-semibold text-ink-500 hover:border-red-brand/40 hover:text-red-brand transition-colors shadow-sm">
                            {id}
                        </button>
                    ))}
                </motion.div>

                {/* ── Error ── */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="max-w-2xl mx-auto mb-8 bg-red-brand/8 border border-red-brand/20 rounded-2xl px-6 py-4 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-brand flex-shrink-0" />
                            <p className="text-red-brand text-sm font-semibold">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Loading state ── */}
                <AnimatePresence mode="wait">
                    {isPending && <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Skeleton /></motion.div>}

                    {/* ── Results ── */}
                    {shipment && !isPending && (
                        <motion.div key="result"
                            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-6"
                        >
                            {/* ── Dark status card ── */}
                            <div className="bg-ink-900 rounded-[2rem] p-8 md:p-10 relative overflow-hidden border border-white/[0.05] shadow-2xl">
                                <div className="absolute -top-20 -right-20 w-80 h-80 bg-red-brand/10 rounded-full blur-[80px] pointer-events-none" />
                                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-brand to-transparent" />

                                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                                    <div className="lg:col-span-2">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="relative w-3 h-3">
                                                <div className="absolute inset-0 rounded-full bg-red-brand animate-ping opacity-60" />
                                                <div className="w-3 h-3 rounded-full bg-red-brand" />
                                            </div>
                                            <span className="text-red-400 text-[10px] font-bold uppercase tracking-[0.3em]">Live · Supabase Connected</span>
                                        </div>
                                        <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-3 leading-none" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                            {statusLabel[shipment.status] ?? shipment.status}
                                        </h2>
                                        <p className="text-white/50 text-base mb-2">
                                            {shipment.origin_city} → {shipment.destination_city}
                                        </p>
                                        {shipment.estimated_delivery && (
                                            <p className="text-white/30 text-sm">Est. arrival: <span className="text-white/70 font-semibold">{new Date(shipment.estimated_delivery).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })} WAT · {shipment.destination_city}</span></p>
                                        )}
                                    </div>

                                    {/* Countdown */}
                                    <div className="flex flex-col items-center lg:items-end gap-3">
                                        <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Arrives In</span>
                                        <div className="flex items-center gap-2">
                                            {[{ val: countdown.h, unit: "HRS" }, { val: countdown.m, unit: "MIN" }, { val: countdown.s, unit: "SEC" }].map((c, i) => (
                                                <div key={i} className="flex items-end gap-1">
                                                    <div className="bg-white/8 border border-white/10 rounded-2xl px-4 py-3 text-center min-w-[56px]">
                                                        <AnimatePresence mode="popLayout">
                                                            <motion.span key={c.val}
                                                                initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="block text-3xl font-bold text-white font-mono leading-none"
                                                                style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                                                {String(c.val).padStart(2, "0")}
                                                            </motion.span>
                                                        </AnimatePresence>
                                                        <span className="text-[8px] text-white/30 font-bold uppercase tracking-widest mt-1 block">{c.unit}</span>
                                                    </div>
                                                    {i < 2 && <span className="text-red-brand font-bold text-2xl mb-3 animate-pulse">:</span>}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                                            <CheckCircle2 className="w-3.5 h-3.5" /><span>On schedule</span>
                                        </div>
                                    </div>
                                </div>

                                {events.length > 0 && (
                                    <div className="relative z-10 mt-8"><ProgressBar events={events} /></div>
                                )}
                            </div>

                            {/* ── Main grid ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                                {/* ── Left: meta + timeline ── */}
                                <div className="lg:col-span-3 space-y-5">
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { icon: MapPin, label: "Destination", val: shipment.destination_city ?? "—" },
                                            { icon: Shield, label: "Insured", val: shipment.insured ? "100% Covered" : "Not Insured" },
                                            { icon: Package, label: "Weight", val: shipment.weight_kg ? `${shipment.weight_kg} kg` : "—" },
                                        ].map((d, i) => (
                                            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 + 0.3 }}
                                                className="card p-5 text-center group">
                                                <div className="inline-flex p-2.5 bg-red-brand/8 rounded-xl mb-3 group-hover:bg-red-brand transition-colors">
                                                    <d.icon className="w-4 h-4 text-red-brand group-hover:text-white transition-colors" />
                                                </div>
                                                <p className="text-[10px] text-ink-400 font-bold uppercase tracking-widest mb-1">{d.label}</p>
                                                <p className="text-ink-900 font-bold text-sm">{d.val}</p>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Timeline */}
                                    <div className="card p-8">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <p className="text-[10px] text-ink-400 font-bold uppercase tracking-widest mb-1">Tracking Number</p>
                                                <p className="text-2xl font-bold text-ink-900 font-mono" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{shipment.tracking_id}</p>
                                            </div>
                                            <button onClick={() => { setShipment(null); setEvents([]); setTrackingId(""); }}
                                                className="flex items-center gap-1.5 text-xs font-semibold text-red-brand hover:text-red-dark transition-colors">
                                                <RotateCcw className="w-3.5 h-3.5" /> New Search
                                            </button>
                                        </div>

                                        {events.length > 0 && (
                                            <div className="relative">
                                                <div className="absolute left-5 top-5 bottom-5 w-px bg-surface-200" />
                                                <motion.div className="absolute left-5 top-5 w-px bg-gradient-to-b from-red-brand to-red-brand/20 origin-top"
                                                    initial={{ scaleY: 0 }}
                                                    animate={{ scaleY: events.filter(e => e.status === "done").length / (events.length - 1) }}
                                                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                                                    style={{ height: "calc(100% - 40px)" }} />
                                                <div className="space-y-8">
                                                    {events.map((ev, i) => (
                                                        <motion.div key={ev.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 + 0.3 }}
                                                            className="relative flex items-start gap-5">
                                                            <div className={cn("relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                                                                ev.status === "done" ? "bg-red-brand shadow-lg shadow-red-brand/30" :
                                                                    ev.status === "current" ? "bg-white border-2 border-red-brand shadow-md shadow-red-brand/20" :
                                                                        "bg-surface-100 border border-surface-200")}>
                                                                {ev.status === "done" ? <CheckCircle2 className="w-4 h-4 text-white" /> :
                                                                    ev.status === "current" ? <motion.div className="w-2.5 h-2.5 rounded-full bg-red-brand" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} /> :
                                                                        <div className="w-2 h-2 rounded-full bg-ink-300" />}
                                                            </div>
                                                            <div className={cn("flex-1 pb-2 min-w-0", ev.status === "upcoming" && "opacity-35")}>
                                                                <div className="flex items-start justify-between gap-4 mb-1">
                                                                    <h4 className={cn("font-bold text-sm", ev.status === "current" ? "text-red-brand" : "text-ink-900")} style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                                                        {ev.event_title}
                                                                        {ev.status === "current" && (
                                                                            <span className="ml-2 inline-flex items-center gap-1 text-[9px] bg-red-brand/10 text-red-brand border border-red-brand/20 rounded-full px-2 py-0.5 font-bold uppercase tracking-wider">
                                                                                <span className="w-1 h-1 rounded-full bg-red-brand animate-pulse" />Live
                                                                            </span>
                                                                        )}
                                                                    </h4>
                                                                    <span className="text-[10px] text-ink-400 font-mono flex-shrink-0">{ev.event_time ?? "—"}</span>
                                                                </div>
                                                                {ev.event_location && <div className="flex items-center gap-1.5 text-xs text-ink-400"><MapPin className="w-3 h-3 flex-shrink-0" /><span>{ev.event_location}</span></div>}
                                                                {ev.event_date && <p className="text-[9px] text-ink-300 mt-0.5 uppercase tracking-widest font-semibold">{ev.event_date}</p>}
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ── Right ── */}
                                <div className="lg:col-span-2 space-y-5">
                                    <div className="overflow-hidden rounded-3xl border border-surface-200 shadow-sm" style={{ height: 280 }}>
                                        <RouteMap origin={shipment.origin_city ?? "Origin"} dest={shipment.destination_city ?? "Destination"} />
                                    </div>

                                    {/* Telemetry */}
                                    <div className="card p-6">
                                        <div className="flex items-center gap-2 mb-5">
                                            <Radio className="w-4 h-4 text-red-brand animate-pulse" />
                                            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-red-brand">Live Telemetry</span>
                                        </div>
                                        <div className="space-y-4">
                                            {[
                                                { label: "GPS Signal", val: "Strong", ok: true },
                                                { label: "Parcel Condition", val: "Good", ok: true },
                                                { label: "Route Optimised", val: "Yes", ok: true },
                                                { label: "Insured", val: shipment.insured ? "Yes" : "No", ok: shipment.insured },
                                            ].map((t, i) => (
                                                <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 + 0.5 }}
                                                    className="flex items-center justify-between">
                                                    <span className="text-ink-400 text-sm">{t.label}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("w-1.5 h-1.5 rounded-full", t.ok ? "bg-red-brand" : "bg-ink-300")} />
                                                        <span className="text-ink-900 text-sm font-bold">{t.val}</span>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                        <div className="mt-5 pt-4 border-t border-surface-100">
                                            <div className="flex items-center gap-2 text-xs text-ink-400">
                                                <Zap className="w-3.5 h-3.5 text-red-brand" />
                                                <span>Service: <span className="font-semibold text-ink-600 capitalize">{shipment.service_type.replace("_", " ")}</span></span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rider */}
                                    {shipment.rider_name && (
                                        <div className="card p-6">
                                            <div className="flex items-center gap-4 mb-5">
                                                <div className="w-12 h-12 rounded-full bg-red-brand flex items-center justify-center font-bold text-white text-lg shadow-md shadow-red-brand/30 flex-shrink-0">
                                                    {shipment.rider_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-ink-900 text-sm">{shipment.rider_name}</p>
                                                    <p className="text-xs text-ink-400">PAX Delivery Partner</p>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                                                        <span className="text-[10px] text-ink-400 ml-1">4.97 · Verified</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {shipment.rider_phone && (
                                                <a href={`tel:${shipment.rider_phone}`}
                                                    className="w-full flex items-center justify-center gap-2 bg-surface-50 hover:bg-surface-100 border border-surface-200 text-ink-700 py-3 rounded-xl font-semibold text-sm transition-colors">
                                                    <Phone className="w-4 h-4 text-red-brand" /> Contact Driver
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Support */}
                                    <div className="bg-red-brand rounded-3xl p-6 text-white relative overflow-hidden">
                                        <div className="absolute -top-8 -right-8 w-36 h-36 bg-red-400/20 rounded-full blur-3xl" />
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4 text-white/80" /><p className="font-bold text-base">Need help?</p></div>
                                            <p className="text-white/70 text-sm mb-5">Our Nigeria support team is available 24/7 for urgent delivery issues.</p>
                                            <div className="space-y-3">
                                                <a href="tel:+23417005000" className="w-full flex items-center justify-center gap-2 bg-white text-red-brand py-3 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors">
                                                    <Phone className="w-4 h-4" /> +234 1 700 5000
                                                </a>
                                                <button className="w-full bg-white/15 hover:bg-white/25 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                                                    <ArrowRight className="w-4 h-4" /> Raise a Dispute
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Empty state ── */}
                    {!shipment && !isPending && !error && (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
                            <div className="w-24 h-24 bg-red-brand/8 border border-red-brand/15 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Truck className="w-10 h-10 text-red-brand opacity-80" />
                            </div>
                            <h3 className="text-2xl font-bold text-ink-900 mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Enter a Tracking ID above</h3>
                            <p className="text-ink-400 text-sm max-w-sm mx-auto">Your PAX tracking number was sent via SMS and email when your parcel was booked.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default function TrackingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-surface-50 flex items-center justify-center">
                <div className="flex items-center gap-3 text-red-brand">
                    <div className="w-5 h-5 border-2 border-red-brand border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-bold uppercase tracking-widest">Connecting to Live Network...</span>
                </div>
            </div>
        }>
            <TrackingContent />
        </Suspense>
    );
}
