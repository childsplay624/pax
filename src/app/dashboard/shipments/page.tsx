"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, ChevronLeft, ChevronRight, ExternalLink, X, Printer } from "lucide-react";
import { getDashboardShipments } from "@/app/actions/dashboard";
import { cn } from "@/lib/utils";
import type { Shipment } from "@/types/database";

const STATUSES = [
    { label: "All", value: "" },
    { label: "Active", value: "in_transit" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Delivered", value: "delivered" },
    { label: "Failed", value: "failed" },
];

const BADGE: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "bg-amber-500/15 text-amber-400 border border-amber-500/20" },
    confirmed: { label: "Confirmed", cls: "bg-blue-500/15 text-blue-400 border border-blue-500/20" },
    collected: { label: "Collected", cls: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20" },
    in_transit: { label: "In Transit", cls: "bg-orange-500/15 text-orange-400 border border-orange-500/20" },
    at_hub: { label: "At Hub", cls: "bg-purple-500/15 text-purple-400 border border-purple-500/20" },
    out_for_delivery: { label: "Out for Delivery", cls: "bg-sky-500/15 text-sky-400 border border-sky-500/20" },
    delivered: { label: "Delivered", cls: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" },
    failed: { label: "Failed", cls: "bg-red-500/15 text-red-400 border border-red-500/20" },
};

const PAGE_SIZE = 15;

export default function ShipmentsPage() {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [status, setStatus] = useState("");
    const [isPending, start] = useTransition();

    const fetchData = useCallback((pg: number, q: string, st: string) => {
        start(async () => {
            const res = await getDashboardShipments(pg, PAGE_SIZE, q, st);
            setShipments(res.shipments as Shipment[]);
            setTotal(res.count);
        });
    }, []);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 380);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => { setPage(1); fetchData(1, debouncedSearch, status); }, [debouncedSearch, status, fetchData]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const BOX = "bg-[#16161e] border border-white/[0.08] rounded-2xl overflow-hidden";

    return (
        <div className="p-5 lg:p-6 space-y-4">

            {/* Header box */}
            <div className={BOX}>
                <div className="flex items-center justify-between p-5">
                    <div>
                        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Shipments</h1>
                        <p className="text-white/30 text-sm mt-0.5">{total.toLocaleString()} total records</p>
                    </div>
                    <Link href="/dashboard/book"
                        className="flex items-center gap-2 bg-red-brand hover:bg-red-dark text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-brand/20">
                        + New Shipment
                    </Link>
                </div>
            </div>

            {/* Filters box */}
            <div className={BOX}>
                <div className="flex flex-col sm:flex-row gap-3 p-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                        <input type="text" placeholder="Search tracking ID, name…" value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-11 pr-10 py-2.5 text-white placeholder-white/25 text-sm font-medium outline-none focus:border-red-brand/40 focus:bg-white/[0.07] transition-all" />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
                        {STATUSES.map(s => (
                            <button key={s.value} onClick={() => setStatus(s.value)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                    status === s.value ? "bg-red-brand text-white shadow-sm" : "text-white/40 hover:text-white/70"
                                )}>{s.label}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table box */}
            <div className={BOX}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 rounded-full bg-blue-500" />
                        <p className="text-white font-bold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>All Shipments</p>
                    </div>
                    <span className="text-white/25 text-xs">{total} records</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[900px]">
                        <thead>
                            <tr className="border-b border-white/[0.06]">
                                {["Tracking ID", "Sender", "Recipient", "Route", "Weight", "Service", "Status", "Booked", "Actions"].map(h => (
                                    <th key={h} className="text-left text-white/25 text-[10px] font-bold uppercase tracking-widest px-5 py-3.5">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            <AnimatePresence mode="wait">
                                {isPending ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <tr key={i}>
                                            {Array.from({ length: 8 }).map((_, j) => (
                                                <td key={j} className="px-5 py-4">
                                                    <div className="h-3.5 bg-white/[0.06] rounded animate-pulse w-24" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : shipments.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-20">
                                            <Package className="w-10 h-10 text-white/10 mx-auto mb-3" />
                                            <p className="text-white/30 text-sm font-semibold">No shipments found</p>
                                            {search && <p className="text-white/20 text-xs mt-1">Try a different search term</p>}
                                        </td>
                                    </tr>
                                ) : shipments.map((s, i) => {
                                    const badge = BADGE[s.status] ?? { label: s.status, cls: "bg-white/10 text-white/40" };
                                    return (
                                        <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                            className="hover:bg-white/[0.03] transition-colors group">
                                            <td className="px-5 py-3.5">
                                                <Link href={`/tracking?id=${s.tracking_id}`}
                                                    className="flex items-center gap-1.5 font-mono text-red-400 hover:text-red-300 font-bold text-xs transition-colors">
                                                    {s.tracking_id}
                                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                            </td>
                                            <td className="px-5 py-3.5 text-white/60 text-xs font-medium max-w-[120px] truncate">{s.sender_name ?? "—"}</td>
                                            <td className="px-5 py-3.5 text-white/60 text-xs font-medium max-w-[120px] truncate">{s.recipient_name ?? "—"}</td>
                                            <td className="px-5 py-3.5 text-white/30 text-[11px] whitespace-nowrap">{s.origin_city} → {s.destination_city}</td>
                                            <td className="px-5 py-3.5 text-white/40 text-xs">{s.weight_kg ? `${s.weight_kg} kg` : "—"}</td>
                                            <td className="px-5 py-3.5 text-white/30 text-[10px] font-bold uppercase tracking-wider capitalize">
                                                {s.service_type?.replace("_", " ")}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap", badge.cls)}>{badge.label}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-white/25 text-xs whitespace-nowrap">
                                                {new Date(s.created_at).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "2-digit" })}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <Link href={`/dashboard/shipments/${s.id}/waybill`}
                                                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-red-brand hover:border-red-brand/40 transition-all group/btn"
                                                    title="Print Waybill">
                                                    <Printer className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                                                </Link>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06]">
                        <p className="text-white/30 text-xs">
                            Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => { const p = page - 1; setPage(p); fetchData(p, debouncedSearch, status); }} disabled={page === 1}
                                className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                                const pg = i + 1;
                                return (
                                    <button key={pg} onClick={() => { setPage(pg); fetchData(pg, debouncedSearch, status); }}
                                        className={cn("w-8 h-8 rounded-lg text-xs font-bold transition-all",
                                            page === pg ? "bg-red-brand text-white" : "bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.1]"
                                        )}>{pg}</button>
                                );
                            })}
                            <button onClick={() => { const p = page + 1; setPage(p); fetchData(p, debouncedSearch, status); }} disabled={page === totalPages}
                                className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
