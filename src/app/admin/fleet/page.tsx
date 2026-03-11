"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Truck, Bike, MapPin, Star, Shield,
    Zap, Search, Filter, CheckCircle2,
    AlertCircle, ChevronRight, X, User,
    Activity, Clipboard, Navigation,
    Loader2, Users, ShieldCheck, ArrowUpRight, Clock
} from "lucide-react";
import { getRiders, getFleetStats, assignRiderToShipment } from "@/app/actions/admin";
import { getDashboardShipments } from "@/app/actions/dashboard";
import { cn } from "@/lib/utils";

const BOX = "bg-[#111116]/80 backdrop-blur-xl border border-white/[0.06] rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:border-white/10";
const STATUS_COLORS: any = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5",
    on_delivery: "bg-red-brand/10 text-red-brand border-red-brand/20 shadow-red-brand/5",
    resting: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5",
    offline: "bg-white/5 text-white/20 border-white/10"
};

export default function FleetCommandPage() {
    const [riders, setRiders] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [pendingShipments, setPendingShipments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Dispatch UI
    const [dispatchShipment, setDispatchShipment] = useState<any>(null);
    const [selectedRider, setSelectedRider] = useState<string | null>(null);
    const [isDispatching, startDispatch] = useTransition();

    const loadData = async () => {
        setLoading(true);
        const [r, s, p] = await Promise.all([
            getRiders(),
            getFleetStats(),
            getDashboardShipments(1, 10, "", "confirmed")
        ]);
        setRiders(r);
        setStats(s);
        setPendingShipments(p.shipments);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleAssign = async () => {
        if (!dispatchShipment || !selectedRider) return;
        startDispatch(async () => {
            const res = await assignRiderToShipment(dispatchShipment.id, selectedRider);
            if (res.success) {
                setDispatchShipment(null);
                setSelectedRider(null);
                loadData();
            } else {
                alert(res.error);
            }
        });
    };

    return (
        <div className="p-8 lg:p-12 space-y-10 min-h-screen bg-[#0c0c10]">

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-4 bg-red-brand rounded-full" />
                        <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">Fleet Telemetry Active</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Command <span className="text-red-brand">& Dispatch</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Nodes Synchronized</span>
                    </div>
                </div>
            </div>

            {/* Fleet Pulse Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Fleet Density", val: stats?.totalRiders ?? 0, desc: "Operational Units", icon: Users, col: "text-blue-400", glow: "shadow-blue-500/20" },
                    { label: "Deployment Index", val: `${stats?.fleetHealth ?? 0}%`, desc: "Availability index", icon: Zap, col: "text-emerald-400", glow: "shadow-emerald-500/20" },
                    { label: "In-Transit Sync", val: stats?.ridersInTransit ?? 0, desc: "Live Deliveries", icon: Activity, col: "text-red-brand", glow: "shadow-red-brand/20" },
                    { label: "Trust Protocol", val: stats?.avgFleetRating ?? "5.0", desc: "Performance Score", icon: Star, col: "text-amber-400", glow: "shadow-amber-500/20" },
                ].map(s => (
                    <div key={s.label} className={cn(BOX, "p-10 group hover:-translate-y-1 transition-all duration-500 relative overflow-hidden")}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] -rotate-45 translate-x-16 -translate-y-16 group-hover:bg-white/[0.03] transition-colors" />
                        <div className={cn("p-4 rounded-2xl bg-white/[0.03] w-fit mb-6 transition-all group-hover:scale-110", s.col, s.glow)}>
                            <s.icon className="w-6 h-6" />
                        </div>
                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{s.label}</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-5xl font-black text-white tracking-tighter mb-1">{s.val}</p>
                            <div className="w-1 h-1 rounded-full bg-white/20 mb-2" />
                        </div>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{s.desc}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

                {/* Real-time Fleet Monitoring List */}
                <div className="xl:col-span-2 space-y-8">
                    <div className={BOX}>
                        <div className="px-10 py-8 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <Navigation className="w-5 h-5 text-red-brand" />
                                <h2 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Personnel Registry</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                                    <input type="text" placeholder="Search Unit..." className="bg-white/[0.03] border border-white/10 rounded-full pl-9 pr-4 py-2 text-[10px] text-white outline-none focus:border-red-brand/40 transition-all w-48 font-black uppercase tracking-widest" />
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-white/[0.04]">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="p-10 animate-pulse flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-white/[0.03]" />
                                        <div className="flex-1 space-y-3"><div className="h-4 bg-white/[0.03] rounded-full w-1/3" /><div className="h-3 bg-white/[0.02] rounded-full w-1/4" /></div>
                                    </div>
                                ))
                            ) : riders.map((r, idx) => (
                                <motion.div
                                    key={r.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-10 group hover:bg-white/[0.02] transition-all flex items-center gap-10 relative overflow-hidden"
                                >
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-red-brand scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-white/10 to-transparent border border-white/10 flex items-center justify-center text-white/40 group-hover:text-white group-hover:scale-110 transition-all shadow-xl">
                                            {r.vehicle_type === 'bike' ? <Bike className="w-10 h-10" /> : <Truck className="w-10 h-10" />}
                                        </div>
                                        <div className={cn("absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-[6px] border-[#0c0c10] shadow-lg",
                                            r.status === 'active' ? "bg-emerald-500 shadow-emerald-500/20" :
                                                r.status === 'on_delivery' ? "bg-red-brand animate-pulse shadow-red-brand/20" :
                                                    "bg-amber-500 shadow-amber-500/20"
                                        )} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-2">
                                            <h3 className="text-2xl font-black text-white tracking-tighter">{r.full_name}</h3>
                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-3 py-1 border border-white/5 rounded-full bg-white/[0.02]">{r.vehicle_type} node</span>
                                        </div>
                                        <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                                            <span className="flex items-center gap-2 group-hover:text-white/40 transition-colors"><MapPin className="w-3.5 h-3.5 text-blue-400" /> Sector: {r.current_city || 'Central Hub'}</span>
                                            <span className="flex items-center gap-2 group-hover:text-white/40 transition-colors"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {r.total_deliveries} payloads dropped</span>
                                            <span className="flex items-center gap-2 group-hover:text-white/40 transition-colors cursor-help"><Star className="w-3.5 h-3.5 text-amber-400" /> {r.rating} Trust Rating</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-3">
                                        <div className={cn("inline-flex px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] border shadow-sm transition-all", STATUS_COLORS[r.status] || STATUS_COLORS.active)}>
                                            {r.status.replace('_', ' ')}
                                        </div>
                                        <button className="text-[10px] font-black text-white/20 hover:text-white uppercase tracking-[0.3em] transition-all bg-white/[0.03] border border-white/10 px-6 py-3 rounded-2xl hover:bg-red-brand hover:border-red-brand hover:shadow-lg hover:shadow-red-brand/20 active:scale-95">Link Telemetry</button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* AI Dispatch Queue */}
                <div className="space-y-8">
                    <div className={cn(BOX, "p-10 bg-gradient-to-br from-[#111116] to-[#0c0c10] border-red-brand/10 relative overflow-hidden group")}>
                        <div className="absolute inset-0 bg-red-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-red-brand/20 text-red-brand">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight">AI Dispatch Radar</h2>
                                    <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.4em]">Autonomous Routing Active</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded bg-red-brand/10 text-red-brand border border-red-brand/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-brand animate-ping" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Live</span>
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            {pendingShipments.length === 0 ? (
                                <div className="py-20 text-center flex flex-col items-center gap-6 opacity-20">
                                    <div className="w-20 h-20 rounded-full border-4 border-dashed border-white/20 flex items-center justify-center animate-spin-slow">
                                        <Navigation className="w-10 h-10" />
                                    </div>
                                    <p className="font-black uppercase tracking-[0.5em] text-[10px]">Radar Clear — Zero Payloads Pending</p>
                                </div>
                            ) : pendingShipments.map(s => (
                                <div key={s.id} onClick={() => setDispatchShipment(s)}
                                    className="p-8 rounded-[2.5rem] border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] hover:border-red-brand/40 cursor-pointer transition-all group overflow-hidden relative shadow-lg">
                                    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-all">
                                        <ArrowUpRight className="w-6 h-6 text-red-brand" />
                                    </div>
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 font-mono">Payload: {s.tracking_id}</p>
                                    <h4 className="text-xl font-black text-white mb-6 leading-tight">{s.sender_state} <span className="text-red-brand px-2">→</span> {s.recipient_state}</h4>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <span className="px-3 py-1.5 rounded-xl bg-red-brand/10 text-red-brand text-[9px] font-black uppercase tracking-widest">Priority Link</span>
                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest italic flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> Awaiting Logistics Unit
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={cn(BOX, "p-8 border-emerald-500/20 bg-emerald-500/5")}>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-400" /> Dispatch Protocol
                        </h3>
                        <p className="text-xs text-emerald-100/40 leading-relaxed font-medium">Assign a verified logistics unit to a confirmed shipment payload. This will trigger the collection sequence and notifying both sender and recipient.</p>
                    </div>
                </div>
            </div>

            {/* Dispatch Modal */}
            <AnimatePresence>
                {dispatchShipment && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xl" onClick={() => setDispatchShipment(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none">
                            <div className="bg-[#111116] border border-red-brand/30 rounded-[2.5rem] p-12 w-full max-w-2xl pointer-events-auto shadow-2xl relative">
                                <button onClick={() => setDispatchShipment(null)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-all"><X className="w-6 h-6" /></button>

                                <div className="mb-10 flex items-center gap-6">
                                    <div className="w-20 h-20 bg-red-brand/10 rounded-[2rem] flex items-center justify-center border border-red-brand/20">
                                        <Clipboard className="w-10 h-10 text-red-brand" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Dispatch Protocol</h2>
                                        <p className="text-white/30 text-[10px] mt-1 font-black uppercase tracking-[0.4em]">Linking payload: {dispatchShipment.tracking_id}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-10 mb-10">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-widest border-b border-white/5 pb-2">Shipment Telemetry</h3>
                                        <div className="space-y-3">
                                            {[
                                                ["Origin", dispatchShipment.sender_state],
                                                ["Destination", dispatchShipment.recipient_state],
                                                ["Recipient", dispatchShipment.recipient_name],
                                                ["Service", dispatchShipment.service_type],
                                            ].map(([k, v]) => (
                                                <div key={k} className="flex justify-between items-center bg-white/[0.02] p-3 rounded-xl border border-white/5">
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{k}</span>
                                                    <span className="text-xs font-bold text-white/80">{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-widest border-b border-white/5 pb-2">Select Logistics Unit</h3>
                                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                            {riders.filter(r => r.status === 'active').map(r => (
                                                <button key={r.id} onClick={() => setSelectedRider(r.id)}
                                                    className={cn("w-full p-4 rounded-2xl border transition-all flex items-center justify-between",
                                                        selectedRider === r.id ? "bg-red-brand border-red-brand text-white shadow-xl shadow-red-brand/20" : "bg-white/[0.03] border-white/5 text-white/40 hover:text-white hover:bg-white/[0.05]"
                                                    )}>
                                                    <div className="flex items-center gap-3">
                                                        {r.vehicle_type === 'bike' ? <Bike className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{r.full_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black">
                                                        <Star className="w-3 h-3 text-amber-500" /> {r.rating}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button disabled={!selectedRider || isDispatching} onClick={handleAssign}
                                    className="w-full py-6 rounded-[2rem] bg-white text-black font-black uppercase tracking-[0.3em] text-xs transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-20">
                                    {isDispatching ? <Loader2 className="w-6 h-6 animate-spin" /> : <><ShieldCheck className="w-6 h-6" /> Authorize Dispatch Sequence</>}
                                </button>
                                <p className="text-center text-[9px] text-white/20 font-black uppercase tracking-[0.2em] mt-6">Rider will be notified of collection address via secure PAX Hub mobile</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
}
