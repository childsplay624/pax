"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense, useTransition } from "react";
import {
    Search, Package, CheckCircle2, MapPin,
    Wifi, Radio, Phone, AlertCircle, ArrowRight, Zap,
    RotateCcw, Truck, Star, Navigation
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Shipment, TrackingEvent } from "@/types/database";
import { trackShipment } from "@/app/actions/tracking";

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

/* ── Route Map — real Google Maps if key is set, SVG fallback ── */
const RouteMap = ({ origin, dest, riderLat, riderLng }: { origin: string; dest: string; riderLat?: number; riderLng?: number }) => {
    const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

    if (MAPS_KEY && origin && dest) {
        const params = new URLSearchParams({
            key: MAPS_KEY,
            origin: `${origin}, Nigeria`,
            destination: `${dest}, Nigeria`,
            mode: "driving",
            maptype: "roadmap",
        });
        return (
            <div className="relative w-full h-full rounded-2xl overflow-hidden">
                <iframe
                    title="Route Map"
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: "invert(90%) hue-rotate(190deg) contrast(0.85)" }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/directions?${params.toString()}`}
                />

                {/* Live Rider Overlay if coords exist */}
                {riderLat && riderLng && (
                    <div className="absolute top-12 left-3 flex items-center gap-2 bg-emerald-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-lg border border-emerald-400/30 animate-in fade-in slide-in-from-left-4 duration-500">
                        <Navigation className="w-3.5 h-3.5 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Rider is Live</span>
                    </div>
                )}

                <div className="absolute top-2 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-brand animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-red-400">PAX Live Route</span>
                </div>
            </div>
        );
    }

    return (
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

                {riderLat && riderLng ? (
                    <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                        <circle cx="210" cy="120" r="8" fill="#10b981" className="animate-pulse" />
                        <circle cx="210" cy="120" r="4" fill="white" />
                    </motion.g>
                ) : (
                    <circle cx="190" cy="145" r="5" fill="#dc2626">
                        <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
                    </circle>
                )}

                <circle cx="190" cy="145" r="3.5" fill="white" />
                <circle cx="340" cy="90" r="6" fill="rgba(220,38,38,0.3)" stroke="#dc2626" strokeWidth="1.5" />
                <circle cx="340" cy="90" r="2.5" fill="#dc2626" />
            </svg>
            <div className="absolute bottom-3 left-4 text-[9px] font-bold text-white/50 uppercase tracking-widest">{origin}</div>
            <div className="absolute top-[54%] left-[46%] text-[9px] font-bold text-red-400 uppercase tracking-widest -translate-x-1/2 -translate-y-1/2">
                {riderLat ? "Rider Moving ●" : "Via Hub ●"}
            </div>
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
};

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

/* ── Main ─────────────────────────────────────────────────────  */
const TrackingContent = () => {
    const searchParams = useSearchParams();
    const urlId = searchParams.get("id") || "";
    const [trackingId, setTrackingId] = useState(urlId);
    const [shipment, setShipment] = useState<any | null>(null);
    const [events, setEvents] = useState<TrackingEvent[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isPending, startTransition] = useTransition();

    const countdown = useCountdown(shipment?.estimated_delivery ?? null);

    const doSearch = async (id: string) => {
        if (!id.trim()) return;
        setError(null); setShipment(null); setEvents([]);

        startTransition(async () => {
            const { shipment: s, events: evts, error: err } = await trackShipment(id.toUpperCase().trim());

            if (err || !s) {
                setError(err || "Shipment not found. Please verify your tracking ID.");
                return;
            }

            setShipment(s as unknown as Shipment);
            setEvents((evts ?? []) as unknown as TrackingEvent[]);
        });
    };

    useEffect(() => { if (urlId) doSearch(urlId); }, []); // eslint-disable-line

    // ── Live Polling for Rider Location ──
    useEffect(() => {
        if (!shipment || shipment.status === "delivered" || shipment.status === "failed") return;

        const interval = setInterval(async () => {
            const { shipment: s } = await trackShipment(shipment.tracking_id);
            if (s) {
                setShipment((prev: any) => ({
                    ...prev,
                    last_lat: (s as any).last_lat,
                    last_lng: (s as any).last_lng,
                    last_location_update: (s as any).last_location_update
                }));
            }
        }, 25000);

        return () => clearInterval(interval);
    }, [shipment?.id, shipment?.status]);

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
                    className="max-w-2xl mx-auto mb-16">
                    <div className={cn(
                        "bg-white rounded-2xl flex items-center border transition-all duration-300",
                        isFocused ? "border-red-brand/40 shadow-[0_0_0_4px_rgba(220,38,38,0.08),0_8px_32px_rgba(17,17,24,0.08)]"
                            : "border-surface-200 shadow-md shadow-ink-900/5"
                    )}>
                        <div className="pl-5 pr-2"><Package className="w-5 h-5 text-ink-300" /></div>
                        <input
                            type="text"
                            placeholder="Enter Tracking ID"
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

                    {shipment && !isPending && (
                        <motion.div key="result" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="space-y-6">
                            <div className="bg-ink-900 rounded-[2rem] p-8 md:p-10 relative overflow-hidden border border-white/[0.05] shadow-2xl">
                                <div className="absolute -top-20 -right-20 w-80 h-80 bg-red-brand/10 rounded-full blur-[80px] pointer-events-none" />
                                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-brand to-transparent" />

                                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                                    <div className="lg:col-span-2">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="relative w-3 h-3"><div className="absolute inset-0 rounded-full bg-red-brand animate-ping opacity-60" /><div className="w-3 h-3 rounded-full bg-red-brand" /></div>
                                            <span className="text-red-400 text-[10px] font-bold uppercase tracking-[0.3em]">Live · Supabase Connected</span>
                                        </div>
                                        <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-3 leading-none" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                            {statusLabel[shipment.status] ?? shipment.status}
                                        </h2>
                                        <p className="text-white/50 text-base mb-6">
                                            {shipment.origin_city} ➜ {shipment.destination_city}
                                        </p>
                                        <ProgressBar events={events} />
                                    </div>

                                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 backdrop-blur-sm">
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div><p className="text-white/30 text-[9px] font-bold uppercase tracking-widest mb-1">Hours</p><p className="text-2xl font-bold text-white">{countdown.h}</p></div>
                                            <div><p className="text-white/30 text-[9px] font-bold uppercase tracking-widest mb-1">Mins</p><p className="text-2xl font-bold text-white">{countdown.m}</p></div>
                                            <div><p className="text-white/30 text-[9px] font-bold uppercase tracking-widest mb-1">Secs</p><p className="text-2xl font-bold text-red-brand">{countdown.s}</p></div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                            <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Est. Arrival</span>
                                            <span className="text-white text-xs font-bold">{new Date(shipment.estimated_delivery).toLocaleDateString("en-NG", { day: '2-digit', month: 'short' })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-7 bg-white rounded-3xl border border-surface-200 p-8 shadow-sm">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-bold text-ink-900" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Journey Timeline</h3>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-ink-400 uppercase tracking-widest bg-surface-50 px-3 py-1.5 rounded-full border border-surface-200">
                                            <Radio className="w-3 h-3 text-red-brand animate-pulse" /> Updated just now
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        {events.map((ev, i) => (
                                            <div key={ev.id} className="relative pl-10 pb-8 last:pb-0">
                                                {i !== events.length - 1 && <div className={cn("absolute left-[13px] top-7 bottom-0 w-0.5", ev.status === "done" ? "bg-red-brand" : "bg-surface-200")} />}
                                                <div className={cn("absolute left-0 top-1.5 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all z-10 bg-white", ev.status === "done" ? "border-red-brand bg-red-brand text-white" : ev.status === "current" ? "border-red-brand scale-125 shadow-lg shadow-red-brand/20" : "border-surface-200")}>
                                                    {ev.status === "done" ? <CheckCircle2 className="w-4 h-4" /> : <div className={cn("w-2 h-2 rounded-full", ev.status === "current" ? "bg-red-brand animate-pulse" : "bg-surface-200")} />}
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                                    <h4 className={cn("font-bold text-sm", ev.status === "current" ? "text-red-brand" : "text-ink-900")} style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                                        {ev.event_title}
                                                        {ev.status === "current" && <span className="ml-2 inline-flex items-center gap-1 text-[9px] bg-red-brand/10 text-red-brand border border-red-brand/20 rounded-full px-2 py-0.5 font-bold uppercase tracking-wider"><span className="w-1 h-1 rounded-full bg-red-brand animate-pulse" />Live</span>}
                                                    </h4>
                                                    <span className="text-[10px] text-ink-400 font-mono flex-shrink-0">{ev.event_time ?? "—"}</span>
                                                </div>
                                                {ev.event_location && <div className="flex items-center gap-1.5 text-xs text-ink-400"><MapPin className="w-3 h-3 flex-shrink-0" /><span>{ev.event_location}</span></div>}
                                                {ev.event_date && <p className="text-[9px] text-ink-300 mt-0.5 uppercase tracking-widest font-semibold">{ev.event_date}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="lg:col-span-5 space-y-6">
                                    <div className="bg-ink-900 h-[380px] rounded-3xl border border-white/[0.05] overflow-hidden shadow-xl relative">
                                        <RouteMap origin={shipment.origin_city} dest={shipment.destination_city} riderLat={shipment.last_lat} riderLng={shipment.last_lng} />
                                    </div>
                                    <div className="bg-white rounded-3xl border border-surface-200 p-6 shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-2xl bg-surface-100 flex items-center justify-center"><Phone className="w-5 h-5 text-ink-400" /></div>
                                            <div><p className="text-[10px] font-black uppercase tracking-widest text-ink-300 mb-0.5">Need help?</p><p className="text-sm font-bold text-ink-900">Contact Support</p></div>
                                        </div>
                                        <button className="w-full bg-surface-50 hover:bg-surface-100 border border-surface-200 text-ink-900 py-3 rounded-2xl font-bold text-sm transition-all">Support Center</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default function TrackingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-surface-50 flex items-center justify-center"><div className="w-6 h-6 border-2 border-red-brand border-t-transparent rounded-full animate-spin" /></div>}>
            <TrackingContent />
        </Suspense>
    );
}
