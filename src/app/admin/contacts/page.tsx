"use client";

import { useEffect, useState } from "react";
import {
    Search, Mail, RefreshCw, Trash2,
    MessageSquare, Clock, Filter, CheckCircle2,
    ArrowRight, XCircle, MoreVertical, ExternalLink,
    MapPin, Truck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getContactMessages, deleteContactMessage } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

export default function AdminContactsPage() {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<any | null>(null);

    const load = async () => {
        setLoading(true);
        const data = await getContactMessages();
        setRows(data ?? []);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const filtered = rows.filter(r =>
        !search || r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.email?.toLowerCase().includes(search.toLowerCase()) ||
        r.message?.toLowerCase().includes(search.toLowerCase())
    );

    const del = async (id: string) => {
        const res = await deleteContactMessage(id);
        if (res.success) {
            setRows(prev => prev.filter(r => r.id !== id));
            if (selected?.id === id) setSelected(null);
        }
    };

    const BOX = "bg-[#111116] border border-white/[0.06] rounded-[2rem] overflow-hidden shadow-2xl";

    return (
        <div className="p-6 lg:p-10 space-y-8 min-h-screen bg-[#0c0c10]">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Inbound <span className="text-purple-500">Messages</span>
                    </h1>
                    <p className="text-white/30 text-sm mt-1">Manage public inquiries and potential sales leads.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input type="text" placeholder="Search inquiries..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white outline-none focus:border-purple-500/40 min-w-[280px]" />
                    </div>
                    <button onClick={load} className="flex items-center gap-2 bg-white/[0.03] border border-white/10 text-white/40 hover:text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all">
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* List View */}
                <div className={cn(BOX, "lg:col-span-1 flex flex-col h-[700px]")}>
                    <div className="p-6 border-b border-white/[0.06] bg-white/[0.01]">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Recent Inquiries</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="p-6 space-y-3 animate-pulse">
                                    <div className="h-4 bg-white/[0.05] rounded w-1/2" />
                                    <div className="h-3 bg-white/[0.03] rounded w-full" />
                                </div>
                            ))
                        ) : filtered.length === 0 ? (
                            <div className="p-10 text-center text-white/20 text-xs font-bold uppercase tracking-widest">No messages found</div>
                        ) : filtered.map(c => (
                            <button key={c.id} onClick={() => setSelected(c)}
                                className={cn("w-full p-6 text-left transition-all hover:bg-white/[0.02] relative group",
                                    selected?.id === c.id ? "bg-white/[0.04] border-l-4 border-purple-500" : "border-l-4 border-transparent")}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-bold text-white text-sm truncate pr-4">{c.full_name}</p>
                                    <span className="text-[9px] font-black text-white/20 uppercase whitespace-nowrap">
                                        {new Date(c.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                                    </span>
                                </div>
                                <p className="text-white/30 text-xs line-clamp-1">{c.message}</p>
                                {c.service && (
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                            {c.service}
                                        </span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content View */}
                <div className={cn(BOX, "lg:col-span-2 flex flex-col h-[700px] relative")}>
                    <AnimatePresence mode="wait">
                        {selected ? (
                            <motion.div key={selected.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                                className="flex flex-col h-full">

                                {/* View Header */}
                                <div className="p-8 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black text-xl">
                                            {selected.full_name?.[0]}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{selected.full_name}</h2>
                                            <p className="text-white/30 text-xs font-medium">{selected.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => del(selected.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <a href={`mailto:${selected.email}`} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-900/40 transition-all">
                                            <Mail className="w-4 h-4" /> Reply via Email
                                        </a>
                                    </div>
                                </div>

                                {/* View Content */}
                                <div className="flex-1 overflow-y-auto p-10 space-y-10">

                                    {/* Lead Meta */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3 flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5" /> Territory
                                            </p>
                                            <p className="text-lg font-bold text-white">{selected.state || "Not Specified"}</p>
                                        </div>
                                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3 flex items-center gap-2">
                                                <Truck className="w-3.5 h-3.5" /> Requested Service
                                            </p>
                                            <p className="text-lg font-bold text-white">{selected.service || "General Inquiry"}</p>
                                        </div>
                                    </div>

                                    {/* Message Body */}
                                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-[2rem] p-10 relative">
                                        <MessageSquare className="absolute top-8 right-10 w-20 h-20 text-white/[0.02] pointer-events-none" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10 mb-6">Original Message</p>
                                        <p className="text-white/80 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                                            {selected.message}
                                        </p>
                                    </div>

                                </div>

                                <div className="p-8 border-t border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
                                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">
                                        Received on {new Date(selected.created_at).toLocaleString("en-NG", { dateStyle: "full", timeStyle: "short" })}
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5 text-emerald-400 font-black text-[10px] uppercase tracking-widest">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Lead Captured
                                        </span>
                                    </div>
                                </div>

                            </motion.div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                                <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center mb-6 text-white/10">
                                    <Mail className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-white/40 font-mono tracking-tight">Select an inquiry to view details</h3>
                                <p className="text-white/20 text-xs mt-2 max-w-xs">Audit incoming leads and respond to business inquiries from the public portal.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}
