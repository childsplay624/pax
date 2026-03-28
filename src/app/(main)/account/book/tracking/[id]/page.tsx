"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin, Navigation, Package, Phone, Star, ChevronLeft,
    Clock, CheckCircle2, XCircle, Loader2, MessageSquare, X,
    AlertCircle
} from "lucide-react";
import {
    APIProvider,
    Map,
    Marker,
    useMap,
    useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { cancelBooking, rateBooking } from "@/app/actions/on_demand";
import type { BookingRequest } from "@/types/database";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!;

type BookingWithRider = BookingRequest & {
    rider?: {
        id: string;
        full_name: string;
        phone: string;
        vehicle_type: string;
        average_rating: number | null;
        avatar_url: string | null;
        current_lat: number | null;
        current_lng: number | null;
    } | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
    searching: { label: "Finding your rider…", color: "text-amber-400", icon: Loader2, bg: "bg-amber-500/15" },
    accepted: { label: "Rider accepted!", color: "text-blue-400", icon: CheckCircle2, bg: "bg-blue-500/15" },
    rider_arriving: { label: "Rider is on the way", color: "text-blue-400", icon: Navigation, bg: "bg-blue-500/15" },
    picked_up: { label: "Package picked up", color: "text-purple-400", icon: Package, bg: "bg-purple-500/15" },
    in_transit: { label: "On the way to you", color: "text-orange-400", icon: Navigation, bg: "bg-orange-500/15" },
    delivered: { label: "Delivered! 🎉", color: "text-emerald-400", icon: CheckCircle2, bg: "bg-emerald-500/15" },
    cancelled: { label: "Booking cancelled", color: "text-red-400", icon: XCircle, bg: "bg-red-500/15" },
    failed: { label: "Delivery failed", color: "text-red-400", icon: XCircle, bg: "bg-red-500/15" },
};

const ACTIVE_STATUSES = ["searching", "accepted", "rider_arriving", "picked_up", "in_transit"];
const PROGRESS_STEPS = ["Searching", "Accepted", "Picked Up", "In Transit", "Delivered"];
const PROGRESS_STATUS_MAP: Record<string, number> = {
    searching: 0, accepted: 1, rider_arriving: 1, picked_up: 2, in_transit: 3, delivered: 4
};

/* ── Route line between two points ───────────────────────────── */
function RoutePolyline({ pickup, dropoff }: { pickup: { lat: number; lng: number }; dropoff: { lat: number; lng: number } }) {
    const map = useMap();
    const routesLib = useMapsLibrary("routes");

    useEffect(() => {
        if (!map || !routesLib) return;
        const ds = new routesLib.DirectionsService();
        const dr = new routesLib.DirectionsRenderer({ map, suppressMarkers: true });

        ds.route({
            origin: pickup,
            destination: dropoff,
            travelMode: window.google.maps.TravelMode.DRIVING,
        }).then(result => dr.setDirections(result)).catch(() => { });

        return () => dr.setMap(null);
    }, [map, routesLib, pickup, dropoff]);

    return null;
}

/* ── Rating Modal ─────────────────────────────────────────────── */
function RatingModal({
    bookingId,
    riderName,
    onClose,
}: {
    bookingId: string;
    riderName: string;
    onClose: () => void;
}) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        await rateBooking(bookingId, rating, comment);
        setDone(true);
        setTimeout(onClose, 1500);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 60, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 60 }}
                className="bg-[#16161e] border border-white/[0.1] rounded-3xl p-8 w-full max-w-sm relative">

                <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors">
                    <X className="w-5 h-5" />
                </button>

                {done ? (
                    <div className="text-center py-4">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                        <p className="text-white font-bold text-lg">Thanks for rating!</p>
                    </div>
                ) : (
                    <>
                        <h3 className="text-white font-bold text-xl mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            Rate your delivery
                        </h3>
                        <p className="text-white/40 text-sm mb-6">How was your experience with {riderName}?</p>

                        {/* Stars */}
                        <div className="flex items-center justify-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} onClick={() => setRating(star)}
                                    className="transition-transform hover:scale-110 active:scale-95">
                                    <Star className={cn("w-9 h-9", star <= rating ? "fill-amber-400 text-amber-400" : "text-white/20")} />
                                </button>
                            ))}
                        </div>

                        <textarea
                            placeholder="Leave a comment (optional)…"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            rows={3}
                            className="w-full bg-white/[0.06] border border-white/[0.1] rounded-2xl px-4 py-3 text-white placeholder-white/25 text-sm outline-none resize-none focus:border-amber-500/40 transition-all mb-5"
                        />

                        <button onClick={handleSubmit} disabled={submitting}
                            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                            Submit Rating
                        </button>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
}

/* ── Main Tracking Page ───────────────────────────────────────── */
export default function BookingTrackingPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [booking, setBooking] = useState<BookingWithRider | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [showRating, setShowRating] = useState(false);

    const fetchBooking = useCallback(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
            .from("booking_requests")
            .select(`
                *,
                rider:rider_id (
                    id, full_name, phone, vehicle_type,
                    average_rating, avatar_url, current_lat, current_lng
                )
            `)
            .eq("id", id)
            .single();
        if (data) {
            setBooking(data);
            // Auto-show rating modal when delivered and not yet rated
            if (data.status === "delivered" && !data.customer_rating) {
                setTimeout(() => setShowRating(true), 1500);
            }
        }
        setLoading(false);
    }, [id]);

    // Initial fetch
    useEffect(() => {
        fetchBooking();
    }, [fetchBooking]);

    // Supabase Realtime subscription — live updates
    useEffect(() => {
        const channel = supabase
            .channel(`booking-${id}`)
            .on(
                "postgres_changes" as any,
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "booking_requests",
                    filter: `id=eq.${id}`,
                },
                (payload: any) => {
                    setBooking(prev => prev ? { ...prev, ...payload.new } : prev);
                    if (payload.new.status === "delivered" && !payload.new.customer_rating) {
                        setTimeout(() => setShowRating(true), 1500);
                    }
                }
            )
            .subscribe();

        // Also poll rider location every 15s when active
        const locationInterval = setInterval(async () => {
            if (!booking?.rider_id) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: riderData } = await (supabase as any)
                .from("riders")
                .select("current_lat, current_lng")
                .eq("id", booking.rider_id)
                .single();
            if (riderData) {
                setBooking(prev => prev ? {
                    ...prev,
                    rider: prev.rider ? { ...prev.rider, ...riderData } : prev.rider
                } : prev);
            }
        }, 15000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(locationInterval);
        };
    }, [id, booking?.rider_id]);

    const handleCancel = async () => {
        setCancelling(true);
        const result = await cancelBooking(id);
        if (result.success) {
            setBooking(prev => prev ? { ...prev, status: "cancelled" } : prev);
        }
        setCancelling(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center flex-col gap-4">
                <AlertCircle className="w-12 h-12 text-red-400" />
                <p className="text-white/60 font-semibold">Booking not found</p>
                <button onClick={() => router.push("/account")} className="text-red-400 text-sm font-bold">
                    ← Back to account
                </button>
            </div>
        );
    }

    const statusCfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.searching;
    const StatusIcon = statusCfg.icon;
    const progressStep = PROGRESS_STATUS_MAP[booking.status] ?? 0;
    const isActive = ACTIVE_STATUSES.includes(booking.status);

    // Map center: prefer rider location if available
    const mapCenter = booking.rider?.current_lat && booking.rider?.current_lng
        ? { lat: booking.rider.current_lat, lng: booking.rider.current_lng }
        : booking.pickup_lat && booking.pickup_lng
            ? { lat: Number(booking.pickup_lat), lng: Number(booking.pickup_lng) }
            : { lat: 6.5244, lng: 3.3792 };

    return (
        <APIProvider apiKey={GOOGLE_MAPS_KEY}>
            <div className="min-h-screen bg-[#0d0d14] pt-20 pb-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">

                    {/* Back button */}
                    <button onClick={() => router.push("/account")}
                        className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm font-semibold mb-6">
                        <ChevronLeft className="w-4 h-4" /> My Account
                    </button>

                    {/* Status Banner */}
                    <motion.div
                        key={booking.status}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("flex items-center gap-3 px-5 py-4 rounded-2xl border mb-6", statusCfg.bg,
                            booking.status === "searching" ? "border-amber-500/20" :
                                booking.status === "delivered" ? "border-emerald-500/20" :
                                    booking.status === "cancelled" ? "border-red-500/20" :
                                        "border-blue-500/20"
                        )}>
                        <StatusIcon className={cn("w-5 h-5 flex-shrink-0", statusCfg.color,
                            booking.status === "searching" ? "animate-spin" : ""
                        )} />
                        <div className="flex-1">
                            <p className={cn("font-bold text-base", statusCfg.color)}>{statusCfg.label}</p>
                            {booking.status === "searching" && (
                                <p className="text-white/40 text-xs mt-0.5">We&apos;re finding the nearest available rider for you</p>
                            )}
                        </div>
                        <span className="text-white/20 text-xs font-mono">#{id.slice(0, 8).toUpperCase()}</span>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                        {/* Left panel */}
                        <div className="lg:col-span-3 space-y-5">

                            {/* Progress steps */}
                            <div className="bg-[#13131a] border border-white/[0.08] rounded-3xl p-6">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-white font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Delivery Progress</h3>
                                    {isActive && (
                                        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            Live
                                        </span>
                                    )}
                                </div>

                                <div className="mt-5">
                                    {PROGRESS_STEPS.map((s, i) => (
                                        <div key={s} className="flex items-start gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={cn(
                                                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                                                    i < progressStep ? "bg-emerald-500" :
                                                        i === progressStep ? "bg-red-500 ring-4 ring-red-500/20" :
                                                            "bg-white/[0.07]"
                                                )}>
                                                    {i < progressStep
                                                        ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                                        : i === progressStep
                                                            ? <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                                            : <div className="w-2 h-2 rounded-full bg-white/20" />
                                                    }
                                                </div>
                                                {i < PROGRESS_STEPS.length - 1 && (
                                                    <div className={cn("w-0.5 h-8 my-1 rounded-full transition-all", i < progressStep ? "bg-emerald-500" : "bg-white/[0.07]")} />
                                                )}
                                            </div>
                                            <div className="pb-1 pt-0.5">
                                                <p className={cn("text-sm font-bold transition-colors",
                                                    i <= progressStep ? "text-white" : "text-white/30"
                                                )}>{s}</p>
                                                {i === progressStep && isActive && (
                                                    <p className="text-white/40 text-xs mt-0.5">Current stage</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Delivery details */}
                            <div className="bg-[#13131a] border border-white/[0.08] rounded-3xl p-6 space-y-4">
                                <h3 className="text-white font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Delivery Details</h3>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Navigation className="w-3.5 h-3.5 text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Pickup</p>
                                            <p className="text-white/80 text-sm mt-0.5">{booking.pickup_address}</p>
                                        </div>
                                    </div>
                                    <div className="ml-4 h-6 border-l border-dashed border-white/[0.1]" />
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Dropoff</p>
                                            <p className="text-white/80 text-sm mt-0.5">{booking.dropoff_address}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-white/[0.06]" />

                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-white/30 text-[10px] uppercase font-bold">Distance</p>
                                        <p className="text-white font-bold text-sm mt-1">{booking.distance_km ?? "—"} km</p>
                                    </div>
                                    <div>
                                        <p className="text-white/30 text-[10px] uppercase font-bold">Package</p>
                                        <p className="text-white font-bold text-sm mt-1 capitalize">{booking.package_size}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/30 text-[10px] uppercase font-bold">Price</p>
                                        <p className="text-white font-bold text-sm mt-1">₦{booking.estimated_price.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Rider card */}
                            {booking.rider && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="bg-[#13131a] border border-white/[0.08] rounded-3xl p-6">
                                    <h3 className="text-white font-bold mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Your Rider</h3>

                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {booking.rider.avatar_url
                                                ? <img src={booking.rider.avatar_url} alt={booking.rider.full_name} className="w-full h-full object-cover" />
                                                : <span className="text-white font-bold text-lg">{booking.rider.full_name[0]}</span>
                                            }
                                        </div>

                                        <div className="flex-1">
                                            <p className="text-white font-bold">{booking.rider.full_name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-white/40 text-xs capitalize">{booking.rider.vehicle_type}</span>
                                                {booking.rider.average_rating && (
                                                    <span className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                                                        <Star className="w-3 h-3 fill-amber-400" />
                                                        {booking.rider.average_rating.toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <a href={`tel:${booking.rider.phone}`}
                                            className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 hover:bg-emerald-500/25 transition-all">
                                            <Phone className="w-4 h-4" />
                                        </a>
                                    </div>
                                </motion.div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                {isActive && booking.status !== "picked_up" && booking.status !== "in_transit" && (
                                    <button onClick={handleCancel} disabled={cancelling}
                                        className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-4 py-3 rounded-2xl font-bold text-sm transition-all">
                                        {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                        Cancel Booking
                                    </button>
                                )}
                                {booking.status === "delivered" && !booking.customer_rating && (
                                    <button onClick={() => setShowRating(true)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-3 rounded-2xl font-bold text-sm transition-all">
                                        <Star className="w-4 h-4" />
                                        Rate Delivery
                                    </button>
                                )}
                                {booking.status === "delivered" && booking.customer_rating && (
                                    <div className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-2xl font-bold text-sm">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Rated {booking.customer_rating}/5 ⭐
                                    </div>
                                )}
                                <button onClick={() => router.push("/account/history")}
                                    className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] text-white/50 hover:text-white px-4 py-3 rounded-2xl font-semibold text-sm transition-all">
                                    <Clock className="w-4 h-4" />
                                    History
                                </button>
                            </div>

                        </div>

                        {/* Right: Map */}
                        <div className="lg:col-span-2">
                            <div className="bg-[#13131a] border border-white/[0.08] rounded-3xl overflow-hidden h-[400px] lg:h-full lg:min-h-[600px] sticky top-24">
                                <Map
                                    defaultCenter={mapCenter}
                                    center={mapCenter}
                                    defaultZoom={13}
                                    disableDefaultUI
                                    className="w-full h-full"
                                    mapId="pax-tracking-map"
                                >
                                    {/* Pickup marker */}
                                    {booking.pickup_lat && booking.pickup_lng && (
                                        <Marker
                                            position={{ lat: Number(booking.pickup_lat), lng: Number(booking.pickup_lng) }}
                                            title="Pickup"
                                        />
                                    )}

                                    {/* Dropoff marker */}
                                    {booking.dropoff_lat && booking.dropoff_lng && (
                                        <Marker
                                            position={{ lat: Number(booking.dropoff_lat), lng: Number(booking.dropoff_lng) }}
                                            title="Dropoff"
                                        />
                                    )}

                                    {/* Rider's live location */}
                                    {booking.rider?.current_lat && booking.rider?.current_lng && (
                                        <Marker
                                            position={{
                                                lat: Number(booking.rider.current_lat),
                                                lng: Number(booking.rider.current_lng)
                                            }}
                                            title={`Rider: ${booking.rider.full_name}`}
                                        />
                                    )}

                                    {/* Route line */}
                                    {booking.pickup_lat && booking.pickup_lng && booking.dropoff_lat && booking.dropoff_lng && (
                                        <RoutePolyline
                                            pickup={{ lat: Number(booking.pickup_lat), lng: Number(booking.pickup_lng) }}
                                            dropoff={{ lat: Number(booking.dropoff_lat), lng: Number(booking.dropoff_lng) }}
                                        />
                                    )}
                                </Map>

                                {/* Map overlay legend */}
                                <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/[0.1]">
                                    <div className="flex flex-col gap-2 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                                            <span className="text-white/60">Pickup</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                                            <span className="text-white/60">Dropoff</span>
                                        </div>
                                        {booking.rider && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                                                <span className="text-white/60">Rider (live)</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rating modal */}
            <AnimatePresence>
                {showRating && booking.rider && (
                    <RatingModal
                        bookingId={id}
                        riderName={booking.rider.full_name}
                        onClose={() => setShowRating(false)}
                    />
                )}
            </AnimatePresence>
        </APIProvider>
    );
}
