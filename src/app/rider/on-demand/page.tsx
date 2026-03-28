"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Navigation, MapPin, Package, Phone, Clock, CheckCircle2,
    Loader2, AlertCircle, ChevronRight, Zap, X, User,
    DollarSign, Radio, RefreshCw
} from "lucide-react";
import {
    APIProvider,
    Map,
    Marker,
} from "@vis.gl/react-google-maps";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
    riderAcceptBooking,
    riderUpdateBookingStatus,
    getOpenBookings,
    getRiderActiveBooking,
} from "@/app/actions/on_demand";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!;

const STATUS_FLOW: { status: string; label: string; nextLabel: string; color: string; bg: string }[] = [
    { status: "accepted", label: "Accepted", nextLabel: "I'm Heading to Pickup", color: "text-blue-400", bg: "bg-blue-500/10" },
    { status: "rider_arriving", label: "Heading to Pickup", nextLabel: "Package Picked Up", color: "text-purple-400", bg: "bg-purple-500/10" },
    { status: "picked_up", label: "Package In Hand", nextLabel: "Mark In Transit", color: "text-amber-400", bg: "bg-amber-500/10" },
    { status: "in_transit", label: "In Transit", nextLabel: "Mark Delivered", color: "text-orange-400", bg: "bg-orange-500/10" },
];

const NEXT_STATUS: Record<string, string> = {
    accepted: "rider_arriving",
    rider_arriving: "picked_up",
    picked_up: "in_transit",
    in_transit: "delivered",
};

export default function RiderOnDemandPage() {
    const [openJobs, setOpenJobs] = useState<any[]>([]);
    const [activeBooking, setActiveBooking] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [riderId, setRiderId] = useState<string | null>(null);
    const [riderLat, setRiderLat] = useState<number | null>(null);
    const [riderLng, setRiderLng] = useState<number | null>(null);
    const [selectedJob, setSelectedJob] = useState<any | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [isPending, start] = useTransition();
    const [confirmDelivery, setConfirmDelivery] = useState(false);

    const showToast = useCallback((msg: string, type: "success" | "error") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    const loadData = useCallback(async () => {
        setRefreshing(true);
        const [jobs, active] = await Promise.all([
            getOpenBookings(),
            getRiderActiveBooking(),
        ]);
        setOpenJobs(jobs);
        setActiveBooking(active);
        setRefreshing(false);
        setLoading(false);
    }, []);

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data }) => {
            if (!data.user) return;

            // Get rider ID
            const { data: riderData } = await (supabase as any)
                .from("riders")
                .select("id, current_lat, current_lng")
                .eq("user_id", data.user.id)
                .single();

            if (riderData) {
                setRiderId(riderData.id);
                setRiderLat(riderData.current_lat);
                setRiderLng(riderData.current_lng);
            }
        });

        loadData();

        // Start GPS tracking
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(async (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setRiderLat(lat);
                setRiderLng(lng);

                // Update rider location in DB
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                await (supabase as any)
                    .from("riders")
                    .update({ current_lat: lat, current_lng: lng })
                    .eq("user_id", user.id);
            }, null, { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 });

            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [loadData]);

    // Realtime subscription for booking updates
    useEffect(() => {
        if (!activeBooking) return;
        const channel = supabase
            .channel(`rider-booking-${activeBooking.id}`)
            .on(
                "postgres_changes" as any,
                { event: "UPDATE", schema: "public", table: "booking_requests", filter: `id=eq.${activeBooking.id}` },
                (payload: any) => setActiveBooking((prev: any) => ({ ...prev, ...payload.new }))
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [activeBooking?.id]);

    const handleAccept = (bookingId: string) => {
        start(async () => {
            const res = await riderAcceptBooking(bookingId);
            if (res.success) {
                showToast("✓ Job accepted! Head to the pickup location.", "success");
                setSelectedJob(null);
                await loadData();
            } else {
                showToast(res.error ?? "Failed to accept", "error");
            }
        });
    };

    const handleStatusUpdate = (newStatus: string) => {
        if (!activeBooking) return;
        start(async () => {
            const res = await riderUpdateBookingStatus(
                activeBooking.id,
                newStatus as any
            );
            if (res.success) {
                if (newStatus === "delivered") {
                    showToast("🎉 Delivery completed! Earnings credited.", "success");
                    setActiveBooking(null);
                    setConfirmDelivery(false);
                    await loadData();
                } else {
                    setActiveBooking((prev: any) => ({ ...prev, status: newStatus }));
                    showToast(`✓ Status updated to ${newStatus.replace(/_/g, " ")}`, "success");
                    setConfirmDelivery(false);
                }
            } else {
                showToast(res.error ?? "Update failed", "error");
            }
        });
    };

    const mapCenter = riderLat && riderLng
        ? { lat: riderLat, lng: riderLng }
        : activeBooking?.pickup_lat
            ? { lat: Number(activeBooking.pickup_lat), lng: Number(activeBooking.pickup_lng) }
            : { lat: 6.5244, lng: 3.3792 };

    const BOX = "bg-[#111118] border border-white/[0.07] rounded-3xl";

    const currentStatusFlow = activeBooking
        ? STATUS_FLOW.find(s => s.status === activeBooking.status)
        : null;

    return (
        <APIProvider apiKey={GOOGLE_MAPS_KEY}>
            <div className="min-h-screen bg-[#0a0a0e] pb-10">

                {/* Toast */}
                <AnimatePresence>
                    {toast && (
                        <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
                            className={cn(
                                "fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-bold shadow-2xl border",
                                toast.type === "success"
                                    ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300"
                                    : "bg-red-950/90 border-red-500/30 text-red-300"
                            )}>
                            {toast.msg}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Confirm delivery modal */}
                <AnimatePresence>
                    {confirmDelivery && activeBooking && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md"
                                onClick={() => setConfirmDelivery(false)} />
                            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
                                <div className="bg-[#111118] border border-white/[0.1] rounded-[2rem] p-8 w-full max-w-sm pointer-events-auto shadow-2xl">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                    </div>
                                    <h3 className="text-white font-bold text-xl text-center mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                        Confirm Delivery
                                    </h3>
                                    <p className="text-white/40 text-sm text-center mb-6">
                                        Mark this booking as delivered? Earnings will be credited to your wallet instantly.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setConfirmDelivery(false)}
                                            className="py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white/50 hover:text-white text-sm font-bold transition-all">
                                            Cancel
                                        </button>
                                        <button onClick={() => handleStatusUpdate("delivered")} disabled={isPending}
                                            className="py-3 rounded-2xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Confirm</>}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Job detail modal */}
                <AnimatePresence>
                    {selectedJob && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md"
                                onClick={() => setSelectedJob(null)} />
                            <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: "100%" }}
                                className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
                                <div className="pointer-events-auto bg-[#111118] border-t border-white/[0.1] rounded-t-[2rem] p-8 max-w-2xl mx-auto shadow-2xl">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold mb-1">New Job</p>
                                            <h3 className="text-white font-bold text-xl" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                                Delivery Request
                                            </h3>
                                        </div>
                                        <button onClick={() => setSelectedJob(null)}
                                            className="w-10 h-10 bg-white/[0.06] rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Route */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-start gap-3 p-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl">
                                            <div className="w-8 h-8 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Navigation className="w-3.5 h-3.5 text-red-400" />
                                            </div>
                                            <div>
                                                <p className="text-white/30 text-[10px] uppercase font-bold">Pickup</p>
                                                <p className="text-white text-sm mt-0.5">{selectedJob.pickup_address}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl">
                                            <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-white/30 text-[10px] uppercase font-bold">Dropoff</p>
                                                <p className="text-white text-sm mt-0.5">{selectedJob.dropoff_address}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Job stats */}
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="text-center p-3 bg-white/[0.04] rounded-2xl">
                                            <p className="text-white/30 text-[9px] uppercase font-bold mb-1">Distance</p>
                                            <p className="text-white font-bold">{selectedJob.distance_km ?? "—"} km</p>
                                        </div>
                                        <div className="text-center p-3 bg-white/[0.04] rounded-2xl">
                                            <p className="text-white/30 text-[9px] uppercase font-bold mb-1">Package</p>
                                            <p className="text-white font-bold capitalize">{selectedJob.package_size}</p>
                                        </div>
                                        <div className="text-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                            <p className="text-emerald-400/60 text-[9px] uppercase font-bold mb-1">Earn</p>
                                            <p className="text-emerald-400 font-bold">₦{Math.round((selectedJob.estimated_price ?? 0) * 0.7).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <button onClick={() => handleAccept(selectedJob.id)} disabled={isPending}
                                        className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-500/20 disabled:opacity-50">
                                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                        Accept Job
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                On-Demand Jobs
                            </h1>
                            <p className="text-white/40 text-sm mt-0.5">Accept jobs and earn per delivery</p>
                        </div>
                        <button onClick={loadData} disabled={refreshing}
                            className="w-10 h-10 bg-white/[0.06] border border-white/[0.08] rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-all">
                            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                        {/* Left: Active delivery or job list */}
                        <div className="lg:col-span-3 space-y-5">

                            {/* Active booking */}
                            {activeBooking && currentStatusFlow && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className={cn(BOX, "p-6 ring-1 ring-red-500/20 border-red-500/10")}>

                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        <p className="text-red-400 text-xs font-bold uppercase tracking-widest">Active Delivery</p>
                                    </div>

                                    <div className="space-y-3 mb-5">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Navigation className="w-3.5 h-3.5 text-red-400" />
                                            </div>
                                            <div>
                                                <p className="text-white/30 text-[10px] uppercase font-bold">Pickup</p>
                                                <p className="text-white text-sm">{activeBooking.pickup_address}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-white/30 text-[10px] uppercase font-bold">Dropoff</p>
                                                <p className="text-white text-sm">{activeBooking.dropoff_address}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Receiver info */}
                                    <div className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-2xl mb-5">
                                        <User className="w-4 h-4 text-white/30" />
                                        <div className="flex-1">
                                            <p className="text-white text-sm font-bold">{activeBooking.receiver_name}</p>
                                            <p className="text-white/40 text-xs">{activeBooking.receiver_phone}</p>
                                        </div>
                                        <a href={`tel:${activeBooking.receiver_phone}`}
                                            className="w-9 h-9 bg-emerald-500/15 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 hover:bg-emerald-500/25 transition-all">
                                            <Phone className="w-3.5 h-3.5" />
                                        </a>
                                    </div>

                                    {/* Status + earnings */}
                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                        <div className={cn("p-3 rounded-2xl text-center border", currentStatusFlow.bg,
                                            currentStatusFlow.bg.replace("bg-", "border-").replace("/10", "/20"))}>
                                            <p className="text-white/30 text-[9px] uppercase font-bold mb-1">Status</p>
                                            <p className={cn("font-bold text-sm capitalize", currentStatusFlow.color)}>
                                                {currentStatusFlow.label}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-2xl text-center border bg-emerald-500/10 border-emerald-500/20">
                                            <p className="text-white/30 text-[9px] uppercase font-bold mb-1">Your Earnings</p>
                                            <p className="text-emerald-400 font-bold text-sm">
                                                ₦{Math.round((activeBooking.estimated_price ?? 0) * 0.7).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    {activeBooking.status !== "delivered" && (
                                        <button
                                            onClick={() => {
                                                const next = NEXT_STATUS[activeBooking.status];
                                                if (next === "delivered") {
                                                    setConfirmDelivery(true);
                                                } else {
                                                    handleStatusUpdate(next);
                                                }
                                            }}
                                            disabled={isPending}
                                            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-500/20 disabled:opacity-50">
                                            {isPending
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <><CheckCircle2 className="w-4 h-4" /> {currentStatusFlow.nextLabel}</>
                                            }
                                        </button>
                                    )}

                                    {/* Deep link to maps */}
                                    <a
                                        href={`https://maps.google.com/?q=${encodeURIComponent(
                                            activeBooking.status === "picked_up" || activeBooking.status === "in_transit"
                                                ? activeBooking.dropoff_address
                                                : activeBooking.pickup_address
                                        )}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-2 mt-3 bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white py-3 rounded-2xl text-sm font-semibold transition-all">
                                        <Navigation className="w-4 h-4" />
                                        Open in Google Maps
                                    </a>
                                </motion.div>
                            )}

                            {/* Open jobs list */}
                            {!activeBooking && (
                                <div className={cn(BOX, "overflow-hidden")}>
                                    <div className="px-6 py-5 border-b border-white/[0.07] flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            <h2 className="text-white font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                                Available Jobs
                                            </h2>
                                        </div>
                                        <span className="bg-white/[0.06] border border-white/[0.08] text-white/50 text-xs font-bold px-3 py-1 rounded-full">
                                            {openJobs.length} open
                                        </span>
                                    </div>

                                    {loading ? (
                                        <div className="p-8 space-y-4">
                                            {Array.from({ length: 3 }).map((_, i) => (
                                                <div key={i} className="flex gap-4 animate-pulse">
                                                    <div className="w-12 h-12 bg-white/[0.04] rounded-2xl" />
                                                    <div className="flex-1 space-y-2 pt-1">
                                                        <div className="h-4 bg-white/[0.04] rounded w-3/4" />
                                                        <div className="h-3 bg-white/[0.03] rounded w-1/2" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : openJobs.length === 0 ? (
                                        <div className="p-16 text-center">
                                            <Radio className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                            <p className="text-white/30 font-bold mb-1">No open jobs right now</p>
                                            <p className="text-white/15 text-sm">Stay online — new jobs appear here in real-time</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-white/[0.04]">
                                            {openJobs.map((job, i) => (
                                                <motion.div key={job.id}
                                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.07 }}
                                                    onClick={() => setSelectedJob(job)}
                                                    className="p-5 flex items-center gap-4 cursor-pointer hover:bg-white/[0.03] transition-all group">

                                                    <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                                                        <Zap className="w-5 h-5 text-amber-400" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white font-bold text-sm truncate">
                                                            {job.pickup_address?.split(",")[0]}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-white/30 text-xs">→</span>
                                                            <p className="text-white/50 text-xs truncate">
                                                                {job.dropoff_address?.split(",")[0]}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <span className="text-white/20 text-[10px]">{job.distance_km} km</span>
                                                            <span className="text-white/20 text-[10px] capitalize">{job.package_size}</span>
                                                            <span className="text-emerald-400 text-[10px] font-bold">
                                                                +₦{Math.round((job.estimated_price ?? 0) * 0.7).toLocaleString()} earn
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/40 transition-colors flex-shrink-0" />
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right: Map */}
                        <div className="lg:col-span-2">
                            <div className={cn(BOX, "overflow-hidden h-72 lg:h-full lg:min-h-[500px] sticky top-24")}>
                                <Map
                                    defaultCenter={mapCenter}
                                    center={mapCenter}
                                    defaultZoom={13}
                                    disableDefaultUI
                                    className="w-full h-full"
                                    mapId="pax-rider-map"
                                >
                                    {/* Rider's position */}
                                    {riderLat && riderLng && (
                                        <Marker position={{ lat: riderLat, lng: riderLng }} title="You" />
                                    )}

                                    {/* Active pickup */}
                                    {activeBooking?.pickup_lat && activeBooking?.pickup_lng && (
                                        <Marker
                                            position={{ lat: Number(activeBooking.pickup_lat), lng: Number(activeBooking.pickup_lng) }}
                                            title="Pickup"
                                        />
                                    )}

                                    {/* Active dropoff */}
                                    {activeBooking?.dropoff_lat && activeBooking?.dropoff_lng && (
                                        <Marker
                                            position={{ lat: Number(activeBooking.dropoff_lat), lng: Number(activeBooking.dropoff_lng) }}
                                            title="Dropoff"
                                        />
                                    )}

                                    {/* Open job pickup points */}
                                    {!activeBooking && openJobs.map(job => (
                                        job.pickup_lat && job.pickup_lng && (
                                            <Marker
                                                key={job.id}
                                                position={{ lat: Number(job.pickup_lat), lng: Number(job.pickup_lng) }}
                                                title={`Job: ${job.pickup_address?.split(",")[0]}`}
                                            />
                                        )
                                    ))}
                                </Map>

                                <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-2xl px-3 py-2 border border-white/[0.1] text-xs">
                                    <div className="flex items-center gap-2 text-white/60">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span>Your location (live)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </APIProvider>
    );
}
