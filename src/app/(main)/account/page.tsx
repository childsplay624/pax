"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, MapPin, Clock, ChevronRight, LogOut, User, ArrowRight, CheckCircle2, Truck, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    collected: "bg-purple-50 text-purple-700 border-purple-200",
    in_transit: "bg-amber-50 text-amber-700 border-amber-200",
    at_hub: "bg-orange-50 text-orange-700 border-orange-200",
    out_for_delivery: "bg-emerald-50 text-emerald-700 border-emerald-200",
    delivered: "bg-green-50 text-green-700 border-green-200",
    failed: "bg-red-50 text-red-700 border-red-200",
};
const STATUS_LABELS: Record<string, string> = {
    confirmed: "Confirmed", collected: "Collected", in_transit: "In Transit",
    at_hub: "At Hub", out_for_delivery: "Out for Delivery", delivered: "Delivered", failed: "Failed",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
    confirmed: CheckCircle2, collected: Package, in_transit: Truck,
    at_hub: MapPin, out_for_delivery: Truck, delivered: CheckCircle2, failed: AlertCircle,
};

export default function AccountPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ email: string; id: string } | null>(null);
    const [shipments, setShipments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (!data.user) { router.push("/login?redirect=/account"); return; }
            setUser({ email: data.user.email!, id: data.user.id });

            // Fetch shipments associated with this user's email (via sender details if logged in)
            supabase
                .from("shipments")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(20)
                .then(({ data: rows }) => {
                    setShipments(rows ?? []);
                    setLoading(false);
                });
        });
    }, []);

    const stats = {
        total: shipments.length,
        delivered: shipments.filter(s => s.status === "delivered").length,
        active: shipments.filter(s => !["delivered", "failed"].includes(s.status)).length,
    };

    return (
        <div className="bg-surface-50 min-h-screen pt-32 pb-24">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_0%,rgba(220,38,38,0.04),transparent)] pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 space-y-8">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <span className="text-red-brand text-[11px] font-bold uppercase tracking-[0.35em] block mb-2">My Account</span>
                        <h1 className="text-4xl font-bold text-ink-900" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            {loading ? "Loading…" : `Hi, ${user?.email?.split("@")[0] ?? "there"} 👋`}
                        </h1>
                        <p className="text-ink-400 text-sm mt-1">{user?.email}</p>
                    </div>
                    <button onClick={() => signOut()}
                        className="flex items-center gap-2 text-sm font-bold text-ink-400 hover:text-red-brand border border-surface-200 hover:border-red-brand/30 px-5 py-3 rounded-full transition-all">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Shipments", val: stats.total, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
                        { label: "Active", val: stats.active, icon: Truck, color: "text-amber-600", bg: "bg-amber-50" },
                        { label: "Delivered", val: stats.delivered, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                    ].map((s, i) => (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className="card p-6 text-center">
                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3", s.bg)}>
                                <s.icon className={cn("w-5 h-5", s.color)} />
                            </div>
                            <p className="text-3xl font-bold text-ink-900" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                {loading ? "—" : s.val}
                            </p>
                            <p className="text-ink-400 text-xs mt-1">{s.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* ── Quick actions ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/book"
                        className="card p-6 flex items-center gap-4 group hover:border-red-brand/30 transition-all">
                        <div className="p-3 bg-red-brand/8 rounded-2xl group-hover:bg-red-brand transition-colors flex-shrink-0">
                            <Package className="w-6 h-6 text-red-brand group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-ink-900 group-hover:text-red-brand transition-colors">Book a Shipment</p>
                            <p className="text-ink-400 text-sm">Send a new parcel anywhere in Nigeria</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-ink-300 group-hover:text-red-brand group-hover:translate-x-1 transition-all" />
                    </Link>
                    <Link href="/tracking"
                        className="card p-6 flex items-center gap-4 group hover:border-red-brand/30 transition-all">
                        <div className="p-3 bg-red-brand/8 rounded-2xl group-hover:bg-red-brand transition-colors flex-shrink-0">
                            <MapPin className="w-6 h-6 text-red-brand group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-ink-900 group-hover:text-red-brand transition-colors">Track a Parcel</p>
                            <p className="text-ink-400 text-sm">Enter a tracking ID for live updates</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-ink-300 group-hover:text-red-brand group-hover:translate-x-1 transition-all" />
                    </Link>
                </div>

                {/* ── Shipment history ── */}
                <div className="card overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-surface-100">
                        <h2 className="font-bold text-ink-900 text-lg" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            Recent Shipments
                        </h2>
                        <Link href="/book" className="text-xs font-bold text-red-brand hover:text-red-dark transition-colors flex items-center gap-1">
                            New shipment <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="divide-y divide-surface-100">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="px-6 py-5 flex items-center gap-4">
                                    <div className="skeleton h-10 w-10 rounded-2xl flex-shrink-0" />
                                    <div className="flex-1 space-y-2"><div className="skeleton h-4 w-32 rounded" /><div className="skeleton h-3 w-48 rounded" /></div>
                                    <div className="skeleton h-6 w-20 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : shipments.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <Package className="w-12 h-12 text-ink-200 mx-auto mb-4" />
                            <p className="text-ink-400 font-semibold mb-2">No shipments yet</p>
                            <p className="text-ink-300 text-sm mb-6">Book your first parcel and it'll show up here.</p>
                            <Link href="/book" className="inline-flex items-center gap-2 bg-red-brand text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-red-dark transition-colors">
                                <Package className="w-4 h-4" /> Book a Shipment
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-surface-100">
                            {shipments.map((s, i) => {
                                const Icon = STATUS_ICONS[s.status] ?? Package;
                                return (
                                    <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                        className="px-6 py-5 flex items-center gap-4 hover:bg-surface-50 transition-colors group">
                                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border", STATUS_COLORS[s.status] ?? "bg-surface-100 text-ink-400 border-surface-200")}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-ink-900 font-mono text-sm">{s.tracking_id}</p>
                                            <p className="text-ink-400 text-xs mt-0.5 truncate">
                                                {s.origin_city} → {s.destination_city}
                                                {s.recipient_name && ` · ${s.recipient_name}`}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0 flex items-center gap-3">
                                            <div className="hidden sm:block">
                                                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border", STATUS_COLORS[s.status] ?? "bg-surface-100 text-ink-400 border-surface-200")}>
                                                    {STATUS_LABELS[s.status] ?? s.status}
                                                </span>
                                                <p className="text-ink-300 text-[10px] mt-1">
                                                    {new Date(s.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                                                </p>
                                            </div>
                                            <Link href={`/tracking?id=${s.tracking_id}`}
                                                className="text-ink-300 group-hover:text-red-brand transition-colors">
                                                <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
