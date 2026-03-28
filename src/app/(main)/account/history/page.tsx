"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Clock, Package, CheckCircle2, XCircle, Navigation, MapPin,
    Star, ChevronRight, ArrowLeft, Loader2, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMyBookings } from "@/app/actions/on_demand";

type Booking = Awaited<ReturnType<typeof getMyBookings>>[number];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    searching: { label: "Searching", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: Loader2 },
    accepted: { label: "Accepted", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: CheckCircle2 },
    rider_arriving: { label: "Rider Arriving", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: Navigation },
    picked_up: { label: "Picked Up", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", icon: Package },
    in_transit: { label: "In Transit", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", icon: Navigation },
    delivered: { label: "Delivered", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: XCircle },
    failed: { label: "Failed", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: AlertCircle },
};

const ACTIVE = ["searching", "accepted", "rider_arriving", "picked_up", "in_transit"];

export default function BookingHistoryPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "active" | "delivered" | "cancelled">("all");

    useEffect(() => {
        getMyBookings(50).then(data => {
            setBookings(data);
            setLoading(false);
        });
    }, []);

    const filters: { key: typeof filter; label: string; count?: number }[] = [
        { key: "all", label: "All", count: bookings.length },
        { key: "active", label: "Active", count: bookings.filter(b => ACTIVE.includes(b.status)).length },
        { key: "delivered", label: "Delivered", count: bookings.filter(b => b.status === "delivered").length },
        { key: "cancelled", label: "Cancelled", count: bookings.filter(b => b.status === "cancelled").length },
    ];

    const filtered = bookings.filter(b => {
        if (filter === "active") return ACTIVE.includes(b.status);
        if (filter === "delivered") return b.status === "delivered";
        if (filter === "cancelled") return b.status === "cancelled";
        return true;
    });

    const BOX = "bg-[#13131a] border border-white/[0.08] rounded-3xl";

    return (
        <div className="bg-[#0d0d14] min-h-screen pt-24 pb-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <button onClick={() => router.push("/account")}
                        className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm font-semibold mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Account
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                Booking History
                            </h1>
                            <p className="text-white/40 text-sm mt-1">All your on-demand delivery requests</p>
                        </div>
                        <Link href="/account/book"
                            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-500/20">
                            + New Delivery
                        </Link>
                    </div>
                </motion.div>

                {/* Filter tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
                    {filters.map(f => (
                        <button key={f.key} onClick={() => setFilter(f.key)}
                            className={cn(
                                "flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all",
                                filter === f.key
                                    ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                                    : "bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white/70"
                            )}>
                            {f.label}
                            {f.count !== undefined && f.count > 0 && (
                                <span className={cn(
                                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                    filter === f.key ? "bg-white/20 text-white" : "bg-white/[0.08] text-white/40"
                                )}>{f.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className={cn(BOX, "p-16 flex items-center justify-center")}>
                        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={cn(BOX, "p-16 text-center")}>
                        <Package className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-white/40 font-semibold text-lg mb-1">No bookings found</p>
                        <p className="text-white/25 text-sm mb-6">
                            {filter === "all" ? "You haven't made any deliveries yet." : `No ${filter} bookings yet.`}
                        </p>
                        <Link href="/account/book"
                            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all">
                            Book Your First Delivery
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((booking, i) => {
                            const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.searching;
                            const Icon = cfg.icon;
                            const isActive = ACTIVE.includes(booking.status);
                            const rider = (booking as any).rider;

                            return (
                                <motion.div key={booking.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}>
                                    <Link href={isActive
                                        ? `/account/book/tracking/${booking.id}`
                                        : `/account/book/tracking/${booking.id}`
                                    }>
                                        <div className={cn(
                                            BOX, "p-5 hover:border-white/[0.16] transition-all group cursor-pointer",
                                            isActive && "ring-1 ring-red-500/20 border-red-500/10"
                                        )}>
                                            <div className="flex items-start gap-4">
                                                {/* Status icon */}
                                                <div className={cn(
                                                    "w-11 h-11 rounded-2xl border flex items-center justify-center flex-shrink-0",
                                                    cfg.bg
                                                )}>
                                                    <Icon className={cn("w-5 h-5", cfg.color, booking.status === "searching" && "animate-spin")} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    {/* Route */}
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-white font-bold text-sm truncate max-w-[200px]">
                                                            {booking.pickup_address.split(",")[0]}
                                                        </p>
                                                        <ChevronRight className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
                                                        <p className="text-white/70 text-sm truncate">
                                                            {booking.dropoff_address.split(",")[0]}
                                                        </p>
                                                    </div>

                                                    {/* Meta row */}
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <span className={cn(
                                                            "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border",
                                                            cfg.bg, cfg.color
                                                        )}>
                                                            {cfg.label}
                                                        </span>

                                                        <span className="text-white/25 text-xs">
                                                            {new Date(booking.created_at).toLocaleDateString("en-NG", {
                                                                day: "numeric", month: "short", year: "numeric"
                                                            })}
                                                        </span>

                                                        {booking.distance_km && (
                                                            <span className="text-white/25 text-xs">{booking.distance_km} km</span>
                                                        )}

                                                        {booking.customer_rating && (
                                                            <span className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                                                                <Star className="w-3 h-3 fill-amber-400" />
                                                                {booking.customer_rating}/5
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Rider name if available */}
                                                    {rider && (
                                                        <p className="text-white/30 text-[11px] mt-1.5">
                                                            Rider: {rider.full_name}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Price + arrow */}
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <div className="text-right">
                                                        <p className="text-white font-bold text-sm">
                                                            ₦{(booking.final_price ?? booking.estimated_price).toLocaleString()}
                                                        </p>
                                                        <p className="text-white/25 text-[10px] capitalize">{booking.payment_method}</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                                                </div>
                                            </div>

                                            {isActive && (
                                                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                    <span className="text-red-400 text-xs font-bold">Tap to track live</span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
