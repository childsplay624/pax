"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, MessageSquare, Truck, CheckCircle2, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    collected: "bg-purple-50 text-purple-700 border-purple-200",
    in_transit: "bg-amber-50 text-amber-700 border-amber-200",
    at_hub: "bg-orange-50 text-orange-700 border-orange-200",
    out_for_delivery: "bg-emerald-50 text-emerald-700 border-emerald-200",
    delivered: "bg-green-50 text-green-700 border-green-200",
    failed: "bg-red-50 text-red-700 border-red-200",
    pending: "bg-surface-100 text-ink-500 border-surface-200",
};

const STATUS_LABELS: Record<string, string> = {
    confirmed: "Confirmed", collected: "Collected", in_transit: "In Transit",
    at_hub: "At Hub", out_for_delivery: "Out for Delivery", delivered: "Delivered",
    failed: "Failed", pending: "Pending",
};

export default function AdminDashboard() {
    const [stats, setStats] = useState({ total: 0, transit: 0, delivered: 0, contacts: 0 });
    const [shipments, setShipments] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAll() {
            const [
                { count: total },
                { count: transit },
                { count: delivered },
                { count: contacts_count },
                { data: recentShipments },
                { data: recentContacts },
            ] = await Promise.all([
                supabase.from("shipments").select("*", { count: "exact", head: true }),
                supabase.from("shipments").select("*", { count: "exact", head: true }).eq("status", "in_transit"),
                supabase.from("shipments").select("*", { count: "exact", head: true }).eq("status", "delivered"),
                supabase.from("contact_messages").select("*", { count: "exact", head: true }),
                supabase.from("shipments").select("*").order("created_at", { ascending: false }).limit(8),
                supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(5),
            ]);

            setStats({ total: total ?? 0, transit: transit ?? 0, delivered: delivered ?? 0, contacts: contacts_count ?? 0 });
            setShipments(recentShipments ?? []);
            setContacts(recentContacts ?? []);
            setLoading(false);
        }
        fetchAll();
    }, []);

    const statCards = [
        { label: "Total Shipments", val: stats.total, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "In Transit", val: stats.transit, icon: Truck, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Delivered", val: stats.delivered, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Contact Messages", val: stats.contacts, icon: MessageSquare, color: "text-red-600", bg: "bg-red-50" },
    ];

    return (
        <div className="p-6 lg:p-10 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-ink-900" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Dashboard</h1>
                <p className="text-ink-400 text-sm mt-1">PAN African Express operations overview</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {statCards.map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        className="card p-6">
                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4", s.bg)}>
                            <s.icon className={cn("w-5 h-5", s.color)} />
                        </div>
                        <p className="text-3xl font-bold text-ink-900" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            {loading ? "—" : s.val.toLocaleString()}
                        </p>
                        <p className="text-ink-400 text-sm mt-1">{s.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent shipments */}
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between p-6 border-b border-surface-100">
                        <h2 className="font-bold text-ink-900" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Recent Shipments</h2>
                        <Link href="/admin/shipments" className="text-xs font-bold text-red-brand hover:text-red-dark transition-colors flex items-center gap-1">
                            View all <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    <div className="divide-y divide-surface-100">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="p-4 flex items-center gap-4">
                                    <div className="skeleton h-4 w-32 rounded" /><div className="skeleton h-4 w-24 rounded" /><div className="skeleton h-5 w-20 rounded-full ml-auto" />
                                </div>
                            ))
                        ) : shipments.length === 0 ? (
                            <div className="p-8 text-center text-ink-400 text-sm">No shipments yet. <Link href="/book" className="text-red-brand font-semibold">Create one →</Link></div>
                        ) : shipments.map((s) => (
                            <div key={s.id} className="p-4 flex items-center gap-4 hover:bg-surface-50 transition-colors">
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-ink-900 text-sm font-mono">{s.tracking_id}</p>
                                    <p className="text-ink-400 text-xs mt-0.5">{s.origin_city} → {s.destination_city}</p>
                                </div>
                                <p className="text-ink-400 text-xs hidden sm:block">{s.sender_name ?? "—"}</p>
                                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex-shrink-0", STATUS_COLORS[s.status] ?? STATUS_COLORS.pending)}>
                                    {STATUS_LABELS[s.status] ?? s.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent contacts */}
                <div className="card">
                    <div className="flex items-center justify-between p-6 border-b border-surface-100">
                        <h2 className="font-bold text-ink-900" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Contact Messages</h2>
                        <Link href="/admin/contacts" className="text-xs font-bold text-red-brand hover:text-red-dark transition-colors flex items-center gap-1">
                            View all <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    <div className="divide-y divide-surface-100">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4 space-y-2"><div className="skeleton h-4 w-28 rounded" /><div className="skeleton h-3 w-40 rounded" /></div>)
                        ) : contacts.length === 0 ? (
                            <div className="p-8 text-center text-ink-400 text-sm">No messages yet.</div>
                        ) : contacts.map((c) => (
                            <div key={c.id} className="p-4">
                                <p className="font-semibold text-ink-900 text-sm">{c.full_name}</p>
                                <p className="text-ink-400 text-xs mt-0.5">{c.email}</p>
                                {c.message && <p className="text-ink-300 text-xs mt-1 line-clamp-2">{c.message}</p>}
                                <p className="text-ink-200 text-[10px] mt-2">{new Date(c.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
