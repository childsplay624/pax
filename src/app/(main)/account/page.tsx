"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Package, MapPin, Clock, Truck, CheckCircle2, AlertCircle,
    ArrowRight, LogOut, Wallet, Search, ShieldCheck, Bike,
    Zap, Navigation, Plus, Star, History, ChevronRight, Home, Briefcase
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import { getMyBookings } from "@/app/actions/on_demand";

const BOOKING_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    searching: { label: "Searching for rider…", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    accepted: { label: "Rider accepted", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    rider_arriving: { label: "Rider on the way", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    picked_up: { label: "Package picked up", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    in_transit: { label: "In transit", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
    delivered: { label: "Delivered", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    cancelled: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
    failed: { label: "Failed", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
};

const ACTIVE_STATUSES = ["searching", "accepted", "rider_arriving", "picked_up", "in_transit"];

export default function AccountPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ email: string; id: string; name: string; role?: string } | null>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data }) => {
            if (!data.user) { router.push("/login?redirect=/account"); return; }
            setUser({
                email: data.user.email!,
                id: data.user.id,
                name: (data.user.user_metadata?.full_name as string) || data.user.email?.split("@")[0] || "User"
            });

            // Fetch profile for role
            const [profileRes, bookingsData, walletRes] = await Promise.all([
                (supabase as any).from("profiles").select("account_type").eq("id", data.user.id).single(),
                getMyBookings(10),
                (supabase as any).from("wallets").select("balance").eq("user_id", data.user.id).single(),
            ]);

            if (profileRes.data) setUser(u => u ? { ...u, role: profileRes.data.account_type } : null);
            setBookings(bookingsData);
            setWalletBalance(walletRes.data?.balance ?? null);
            setLoading(false);
        });
    }, [router]);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    const activeBooking = bookings.find(b => ACTIVE_STATUSES.includes(b.status));
    const stats = {
        total: bookings.length,
        delivered: bookings.filter(b => b.status === "delivered").length,
        active: bookings.filter(b => ACTIVE_STATUSES.includes(b.status)).length,
    };

    const BOX = "bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden";

    return (
        <div className="bg-slate-50 min-h-screen pt-32 pb-24 relative overflow-hidden">
            {/* Soft background gradient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(220,38,38,0.06),transparent)] pointer-events-none" />

            <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 space-y-8">

                {/* ── Hero Header ── */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            Personal Account
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            {loading ? "Welcome back 👋" : `${greeting}, ${user?.name?.split(" ")[0]} 👋`}
                        </h1>
                        <p className="text-slate-400 mt-2 font-medium">{user?.email}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {walletBalance !== null && (
                            <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm">
                                <Wallet className="w-4 h-4 text-emerald-500" />
                                <span className="text-slate-700 font-bold text-sm">₦{walletBalance.toLocaleString()}</span>
                            </div>
                        )}
                        <button onClick={() => signOut()}
                            className="w-11 h-11 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all shadow-sm">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>

                {/* ── Active Booking Banner ── */}
                {activeBooking && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                        <Link href={`/account/book/tracking/${activeBooking.id}`}>
                            <div className="relative bg-gradient-to-r from-red-600 to-red-500 rounded-[2rem] p-6 shadow-2xl shadow-red-500/20 overflow-hidden group hover:-translate-y-0.5 transition-transform">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_50%,rgba(255,255,255,0.1),transparent)]" />
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                            <Navigation className="w-6 h-6 text-white animate-pulse" />
                                        </div>
                                        <div>
                                            <p className="text-red-100 text-xs font-bold uppercase tracking-wider mb-0.5">Active Delivery</p>
                                            <p className="text-white font-bold text-lg" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                                {BOOKING_STATUS_CONFIG[activeBooking.status]?.label}
                                            </p>
                                            <p className="text-red-100/70 text-sm mt-0.5 truncate max-w-xs">
                                                → {activeBooking.dropoff_address?.split(",")[0]}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-white/70 text-sm hidden sm:block">Track live</span>
                                        <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )}

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Bookings", val: stats.total, icon: Package, color: "text-blue-600", bg: "bg-blue-50", accent: "bg-blue-500" },
                        { label: "In Progress", val: stats.active, icon: Truck, color: "text-amber-600", bg: "bg-amber-50", accent: "bg-amber-500" },
                        { label: "Delivered", val: stats.delivered, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", accent: "bg-emerald-500" },
                    ].map((s, i) => (
                        <motion.div key={s.label}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className={cn(BOX, "p-6")}>
                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4", s.bg)}>
                                <s.icon className={cn("w-5 h-5", s.color)} />
                            </div>
                            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                {loading ? "—" : s.val}
                            </p>
                            <p className="text-slate-400 text-xs font-semibold mt-1">{s.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* ── Main CTA: Book a Delivery ── */}
                <Link href="/account/book">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-slate-900 rounded-[2rem] p-8 hover:-translate-y-0.5 transition-transform cursor-pointer shadow-xl shadow-slate-900/10 group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-red-500 rounded-3xl flex items-center justify-center shadow-lg shadow-red-500/30">
                                    <Navigation className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">On-Demand Delivery</p>
                                    <h2 className="text-white text-2xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                        Book a Delivery
                                    </h2>
                                    <p className="text-white/40 text-sm mt-1">
                                        Find a rider near you in minutes · Live GPS tracking
                                    </p>
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                                <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                        {/* Feature pills */}
                        <div className="flex flex-wrap gap-2 mt-6">
                            {["📍 Google Maps tracking", "💬 Call your rider", "⭐ Rate & review", "📸 Proof of delivery"].map(f => (
                                <span key={f} className="text-white/40 text-xs bg-white/[0.06] border border-white/[0.08] px-3 py-1.5 rounded-full font-medium">
                                    {f}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                </Link>

                {/* ── Grid: Recent Bookings + Quick Actions ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Recent Bookings */}
                    <div className="lg:col-span-2">
                        <div className={cn(BOX, "h-full")}>
                            <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-5 rounded-full bg-red-500" />
                                    <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                        Recent Deliveries
                                    </h2>
                                </div>
                                <Link href="/account/history"
                                    className="flex items-center gap-1 text-red-500 text-sm font-bold hover:text-red-600 transition-colors">
                                    View All <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            {loading ? (
                                <div className="p-8 space-y-4">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-2xl animate-pulse" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
                                                <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : bookings.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                        <Package className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 font-semibold mb-2">No deliveries yet</p>
                                    <p className="text-slate-300 text-sm mb-6">Book your first delivery to see it here</p>
                                    <Link href="/account/book"
                                        className="inline-flex items-center gap-2 text-red-500 font-bold hover:text-red-600 transition-colors">
                                        <Plus className="w-4 h-4" /> Book now
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {bookings.slice(0, 5).map((booking, i) => {
                                        const cfg = BOOKING_STATUS_CONFIG[booking.status];
                                        const isActive = ACTIVE_STATUSES.includes(booking.status);
                                        return (
                                            <Link key={booking.id} href={`/account/book/tracking/${booking.id}`}>
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                    transition={{ delay: i * 0.06 }}
                                                    className="px-7 py-5 flex items-center gap-4 hover:bg-slate-50 transition-all group">
                                                    <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center flex-shrink-0", cfg?.bg)}>
                                                        {isActive
                                                            ? <Navigation className={cn("w-5 h-5 animate-pulse", cfg?.color)} />
                                                            : booking.status === "delivered"
                                                                ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                                : <AlertCircle className="w-5 h-5 text-red-400" />
                                                        }
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-slate-700 font-bold text-sm truncate max-w-[160px]">
                                                                {booking.pickup_address?.split(",")[0]}
                                                            </p>
                                                            <ArrowRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
                                                            <p className="text-slate-500 text-sm truncate">
                                                                {booking.dropoff_address?.split(",")[0]}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn("text-[10px] font-bold uppercase tracking-wider", cfg?.color)}>
                                                                {cfg?.label}
                                                            </span>
                                                            {booking.customer_rating && (
                                                                <span className="flex items-center gap-0.5 text-amber-500 text-[10px] font-bold">
                                                                    <Star className="w-2.5 h-2.5 fill-amber-500" />
                                                                    {booking.customer_rating}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0 flex items-center gap-3">
                                                        <div>
                                                            <p className="text-slate-700 font-bold text-sm">₦{booking.estimated_price?.toLocaleString()}</p>
                                                            <p className="text-slate-300 text-[10px]">
                                                                {new Date(booking.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                                                            </p>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-red-500 group-hover:border-red-500 transition-all">
                                                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-5">
                        {/* Dark action box */}
                        <div className={cn(BOX, "p-7 bg-slate-900 border-none shadow-2xl shadow-slate-900/15")}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1.5 h-5 rounded-full bg-red-500" />
                                <h2 className="text-xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                    Quick Links
                                </h2>
                            </div>

                            <div className="space-y-2.5">
                                {[
                                    {
                                        label: "Book Delivery",
                                        sub: "On-demand rider",
                                        href: "/account/book",
                                        icon: Navigation,
                                        color: "bg-red-500/15 text-red-400"
                                    },
                                    {
                                        label: "Delivery History",
                                        sub: "All past bookings",
                                        href: "/account/history",
                                        icon: History,
                                        color: "bg-purple-500/15 text-purple-400"
                                    },
                                    {
                                        label: "Track Package",
                                        sub: "Public shipment tracker",
                                        href: "/tracking",
                                        icon: Search,
                                        color: "bg-blue-500/15 text-blue-400"
                                    },
                                    {
                                        label: "Book Shipment",
                                        sub: "Inter-city delivery",
                                        href: "/book",
                                        icon: Package,
                                        color: "bg-amber-500/15 text-amber-400"
                                    },
                                ].map((item, i) => (
                                    <Link key={item.label} href={item.href}>
                                        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.07 + 0.3 }}
                                            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all group">
                                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", item.color)}>
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white text-sm font-bold">{item.label}</p>
                                                <p className="text-white/30 text-[10px]">{item.sub}</p>
                                            </div>
                                            <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/40 transition-colors" />
                                        </motion.div>
                                    </Link>
                                ))}

                                {/* Become a Rider */}
                                {user?.role === "personal" && (
                                    <Link href="/riders/apply">
                                        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.65 }}
                                            className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all group mt-1">
                                            <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/30">
                                                <Bike className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white text-sm font-bold">Become a Rider</p>
                                                <p className="text-red-400 text-[10px] font-bold">Earn with PAX</p>
                                            </div>
                                            <Zap className="w-3.5 h-3.5 text-red-500/50 animate-pulse" />
                                        </motion.div>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Business upgrade card */}
                        <div className={cn(BOX, "p-7 bg-gradient-to-br from-blue-600 to-indigo-700 border-none shadow-xl shadow-blue-900/10 relative overflow-hidden")}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                            <Package className="w-7 h-7 text-white/40 mb-4" />
                            <h3 className="text-white font-bold text-lg leading-tight mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                Ship at scale?
                            </h3>
                            <p className="text-white/60 text-sm mb-5">Bulk shipping, API access & lower rates.</p>
                            <Link href="/register?type=business"
                                className="inline-block bg-white text-blue-700 px-5 py-2.5 rounded-full font-bold text-xs shadow-lg hover:shadow-xl transition-all">
                                Explore Business Account
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
