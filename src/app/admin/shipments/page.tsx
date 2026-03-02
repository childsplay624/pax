"use client";

import { useEffect, useState } from "react";
import { Search, Package, MapPin, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
    confirmed: "bg-blue-50 text-blue-700 border-blue-200", collected: "bg-purple-50 text-purple-700 border-purple-200",
    in_transit: "bg-amber-50 text-amber-700 border-amber-200", at_hub: "bg-orange-50 text-orange-700 border-orange-200",
    out_for_delivery: "bg-emerald-50 text-emerald-700 border-emerald-200", delivered: "bg-green-50 text-green-700 border-green-200",
    failed: "bg-red-50 text-red-700 border-red-200", pending: "bg-surface-100 text-ink-500 border-surface-200",
};
const STATUS_LABELS: Record<string, string> = {
    confirmed: "Confirmed", collected: "Collected", in_transit: "In Transit",
    at_hub: "At Hub", out_for_delivery: "Out for Delivery", delivered: "Delivered", failed: "Failed", pending: "Pending",
};

export default function AdminShipmentsPage() {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const load = async () => {
        setLoading(true);
        let q = supabase.from("shipments").select("*").order("created_at", { ascending: false });
        if (filter !== "all") q = q.eq("status", filter);
        const { data } = await q;
        setRows(data ?? []);
        setLoading(false);
    };

    useEffect(() => { load(); }, [filter]);

    const filtered = rows.filter(r =>
        !search || r.tracking_id?.toLowerCase().includes(search.toLowerCase()) ||
        r.sender_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.recipient_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.destination_city?.toLowerCase().includes(search.toLowerCase())
    );

    const updateStatus = async (id: string, status: string) => {
        await supabase.from("shipments").update({ status }).eq("id", id);
        load();
    };

    return (
        <div className="p-6 lg:p-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-ink-900" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Shipments</h1>
                    <p className="text-ink-400 text-sm mt-1">{rows.length} total records</p>
                </div>
                <button onClick={load} className="flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-red-brand transition-colors">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                {["all", "confirmed", "in_transit", "out_for_delivery", "delivered", "failed"].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={cn("px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all",
                            filter === s ? "bg-red-brand text-white border-red-brand shadow-md shadow-red-brand/20" : "bg-white text-ink-500 border-surface-200 hover:border-red-brand/40")}>
                        {s === "all" ? "All" : STATUS_LABELS[s]}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                <input type="text" placeholder="Search by ID, name, city…" value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white border border-surface-200 rounded-xl pl-11 pr-4 py-3 text-ink-900 text-sm font-medium placeholder-ink-300 outline-none focus:border-red-brand/40 transition-all" />
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-surface-100 bg-surface-50">
                                {["Tracking ID", "Route", "Sender", "Recipient", "Weight", "Status", "Created", "Actions"].map(h => (
                                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-ink-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                                        <td key={j} className="px-5 py-4"><div className="skeleton h-3 rounded w-20" /></td>
                                    ))}</tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} className="px-5 py-12 text-center text-ink-400 text-sm">No shipments match your filter.</td></tr>
                            ) : filtered.map(s => (
                                <tr key={s.id} className="hover:bg-surface-50 transition-colors">
                                    <td className="px-5 py-4"><span className="font-mono font-bold text-ink-900 text-xs">{s.tracking_id}</span></td>
                                    <td className="px-5 py-4 text-ink-500 text-xs whitespace-nowrap">{s.origin_city} → {s.destination_city}</td>
                                    <td className="px-5 py-4 text-ink-700 text-xs">{s.sender_name ?? "—"}</td>
                                    <td className="px-5 py-4 text-ink-700 text-xs">{s.recipient_name ?? "—"}</td>
                                    <td className="px-5 py-4 text-ink-500 text-xs">{s.weight_kg ? `${s.weight_kg} kg` : "—"}</td>
                                    <td className="px-5 py-4">
                                        <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border", STATUS_COLORS[s.status] ?? STATUS_COLORS.pending)}>
                                            {STATUS_LABELS[s.status] ?? s.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-ink-400 text-xs whitespace-nowrap">{new Date(s.created_at).toLocaleDateString("en-NG")}</td>
                                    <td className="px-5 py-4">
                                        <select defaultValue={s.status} onChange={e => updateStatus(s.id, e.target.value)}
                                            className="text-xs bg-surface-50 border border-surface-200 rounded-lg px-3 py-1.5 text-ink-700 outline-none focus:border-red-brand/40 transition-all">
                                            {Object.keys(STATUS_LABELS).map(st => <option key={st} value={st}>{STATUS_LABELS[st]}</option>)}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
