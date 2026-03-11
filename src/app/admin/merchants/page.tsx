"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Users, ShieldCheck, ShieldAlert,
    Shield, CheckCircle2, XCircle, MoreHorizontal,
    Eye, MapPin, Building2, Phone, Mail,
    ArrowRight, Loader2, Filter, Download, Clock, Package, RefreshCw
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { updateMerchantKYC } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

const KYC_COLORS: Record<string, string> = {
    verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/5",
};
const BOX = "bg-[#111116]/80 backdrop-blur-xl border border-white/[0.06] rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:border-white/10";

interface Merchant {
    id: string;
    full_name: string;
    company_name: string;
    phone: string;
    state: string;
    kyc_status: "verified" | "rejected" | "pending";
    created_at: string;
    // Calculated fields
    shipment_count?: number;
    wallet_balance?: number;
}

export default function AdminMerchantsPage() {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [selected, setSelected] = useState<Merchant | null>(null);
    const [isPending, start] = useTransition();

    const load = async () => {
        setLoading(true);
        // Fetch profiles + count shipments for each
        const { data: profiles } = await (supabase as any)
            .from("profiles")
            .select("*, shipments:shipments(count)")
            .eq("account_type", "business")
            .order("created_at", { ascending: false });

        const formatted = (profiles || []).map((p: any) => ({
            ...p,
            shipment_count: p.shipments?.[0]?.count || 0,
        }));

        setMerchants(formatted);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleVerify = (id: string, status: "verified" | "rejected") => {
        start(async () => {
            const res = await updateMerchantKYC(id, status);
            if (res.success) {
                setMerchants(prev => prev.map(m => m.id === id ? { ...m, kyc_status: status } : m));
                if (selected?.id === id) setSelected(s => s ? { ...s, kyc_status: status } : s);
            }
        });
    };

    const filtered = merchants.filter(m => {
        const matchesSearch = !search ||
            m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            m.company_name?.toLowerCase().includes(search.toLowerCase()) ||
            m.phone?.includes(search);

        const matchesFilter = filter === "all" || m.kyc_status === filter;
        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: merchants.length,
        verified: merchants.filter(m => m.kyc_status === "verified").length,
        pending: merchants.filter(m => m.kyc_status === "pending").length,
    };

    const BOX = "bg-[#111116] border border-white/[0.06] rounded-[2rem] overflow-hidden";

    return (
        <div className="p-6 lg:p-10 space-y-8 min-h-screen bg-[#0c0c10]">

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-4 bg-red-brand rounded-full" />
                        <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">Governance Layer Active</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Merchant <span className="text-red-brand">Node Center</span>
                    </h1>
                    <p className="text-white/20 text-[11px] font-bold uppercase tracking-[0.2em] mt-3">Synchronizing {merchants.length} Corporate Identities</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
                        <Download className="w-4 h-4" /> Export Leads
                    </button>
                    <button onClick={load}
                        className={cn("w-14 h-14 flex items-center justify-center rounded-2xl bg-red-brand text-white shadow-2xl shadow-red-brand/40 hover:scale-105 active:scale-95 transition-all", loading && "opacity-50 pointer-events-none")}>
                        <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Tactical Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Partner Density", val: stats.total, icon: Building2, col: "text-blue-400", glow: "shadow-blue-500/20" },
                    { label: "Verified Nodes", val: stats.verified, icon: ShieldCheck, col: "text-emerald-400", glow: "shadow-emerald-500/20" },
                    { label: "Audit Backlog", val: stats.pending, icon: Clock, col: "text-amber-400", glow: "shadow-amber-500/20" },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className={cn(BOX, "p-10 group hover:-translate-y-1 transition-all duration-500 relative overflow-hidden")}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] -rotate-45 translate-x-16 -translate-y-16 group-hover:bg-white/[0.03] transition-colors" />
                        <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 transition-all group-hover:scale-110 bg-white/[0.03] shadow-inner", s.col, s.glow)}>
                            <s.icon className="w-8 h-8" />
                        </div>
                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{s.label}</p>
                        <h3 className="text-4xl font-black text-white tracking-tighter">{loading ? "—" : s.val}</h3>
                    </motion.div>
                ))}
            </div>

            {/* Search & Intelligence Filters */}
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-red-brand transition-colors" />
                    <input
                        type="text"
                        placeholder="Scan Registry (Name, Company, Serial)..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl pl-16 pr-8 py-5 text-sm text-white placeholder-white/20 outline-none focus:border-red-brand/40 focus:bg-white/[0.05] transition-all font-black uppercase tracking-widest"
                    />
                </div>
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-1.5 flex flex-wrap gap-1">
                    {["all", "pending", "verified", "rejected"].map(s => (
                        <button key={s} onClick={() => setFilter(s)}
                            className={cn("px-8 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all",
                                filter === s ? "bg-red-brand text-white shadow-[0_10px_30px_rgba(235,0,0,0.3)]" : "text-white/30 hover:text-white hover:bg-white/5")}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Merchant Identity Registry */}
            <div className={BOX}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.01] border-b border-white/[0.06]">
                                {["Node Entity", "Sector Location", "Operations Hub", "Audit Protocol", "Link Date", ""].map(h => (
                                    <th key={h} className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/10 first:pl-12">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i}><td colSpan={6} className="px-12 py-12 animate-pulse"><div className="h-6 bg-white/[0.03] rounded-2xl w-full" /></td></tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="px-12 py-32 text-center opacity-20">
                                    <div className="inline-flex flex-col items-center gap-6">
                                        <Building2 className="w-16 h-16" />
                                        <p className="font-black uppercase tracking-[0.4em] text-xs">Registry Empty — All Nodes Disconnected</p>
                                    </div>
                                </td></tr>
                            ) : filtered.map((m, idx) => (
                                <motion.tr
                                    key={m.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="px-12 py-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-white/10 to-transparent border border-white/10 flex items-center justify-center text-white/40 group-hover:text-red-brand group-hover:scale-110 transition-all shadow-lg">
                                                <span className="font-black text-lg">{m.company_name?.[0] || m.full_name?.[0]}</span>
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-white tracking-tight">{m.company_name || m.full_name}</p>
                                                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                                    <Phone className="w-3 h-3" /> {m.phone || 'NODE_NULL'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-lg">
                                            <MapPin className="w-3 h-3 text-red-brand/40" />
                                            <span className="text-[11px] font-bold text-white/60 uppercase">{m.state}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-white/80 tabular-nums">{m.shipment_count}</p>
                                            <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">Active Operations</p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className={cn("inline-flex px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] border shadow-sm transition-all", KYC_COLORS[m.kyc_status] || KYC_COLORS.pending)}>
                                            {m.kyc_status}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <p className="text-xs font-black text-white/30 tabular-nums">
                                            {new Date(m.created_at).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                                        </p>
                                    </td>
                                    <td className="px-12 py-8 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <button onClick={() => setSelected(m)}
                                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all shadow-xl">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Neural Identity Audit Drawer */}
            <AnimatePresence>
                {selected && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[110]" onClick={() => setSelected(null)} />

                        <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                            className="fixed top-0 right-0 bottom-0 z-[120] w-full max-w-xl bg-[#0c0c10] border-l border-white/[0.08] flex flex-col shadow-[-40px_0_80px_rgba(0,0,0,0.5)]">

                            {/* Panel Header */}
                            <div className="p-12 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-red-brand/10 blur-[100px] pointer-events-none" />
                                <div className="flex items-center justify-between relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Shield className="w-4 h-4 text-red-brand" />
                                            <span className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">Corporate Registry Sync</span>
                                        </div>
                                        <h2 className="text-3xl font-black text-white tracking-tighter leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                            {selected.company_name || selected.full_name}
                                        </h2>
                                        <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-2">{selected.id}</p>
                                    </div>
                                    <button onClick={() => setSelected(null)} className="w-14 h-14 flex items-center justify-center rounded-[1.5rem] bg-white/[0.04] border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all shadow-xl">
                                        <XCircle className="w-8 h-8" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-12 space-y-12 relative">
                                {/* Neural Connectivity Stats */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white/[0.02] border border-white/[0.08] rounded-[2.5rem] p-8 group hover:border-red-brand/20 transition-all">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4">Operations Cluster</p>
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-red-brand/10 text-red-brand">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <span className="text-lg font-black text-white tracking-tight">{selected.state} Node</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/[0.08] rounded-[2.5rem] p-8 group hover:border-red-brand/20 transition-all">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4">Logistical Density</p>
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <span className="text-lg font-black text-white tracking-tight tabular-nums">{selected.shipment_count} Payloads</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Link Details */}
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10 px-2">Entity Telemetry</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            { icon: Building2, label: "Entity Designation", val: selected.company_name || "Nexus Private Node" },
                                            { icon: Phone, label: "Relay Protocol", val: selected.phone || "NODE_TEL_MISSING" },
                                            { icon: Clock, label: "Registry Date", val: new Date(selected.created_at).toLocaleString() },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-6 bg-white/[0.01] border border-white/[0.04] rounded-[2rem] px-8 py-5 hover:bg-white/[0.03] transition-all group">
                                                <div className="p-3 rounded-xl bg-white/[0.03] text-white/20 group-hover:text-red-brand transition-colors">
                                                    <item.icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/10">{item.label}</p>
                                                    <p className="text-sm font-black text-white/80 tracking-tight">{item.val}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Security Clearance Level */}
                                <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 space-y-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <ShieldCheck className="w-20 h-20 text-white" />
                                    </div>
                                    <div className="flex items-center justify-between relative z-10">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10">Compliance Protocol status</h4>
                                        <div className={cn("px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] border", KYC_COLORS[selected.kyc_status] || KYC_COLORS.pending)}>
                                            {selected.kyc_status}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 relative z-10">
                                        {["Identity Matrix", "Vector Tax ID"].map(doc => (
                                            <div key={doc} className="aspect-[1.4/1] rounded-[2rem] bg-black/40 border border-white/5 flex flex-col items-center justify-center group cursor-pointer hover:border-red-brand/40 transition-all">
                                                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center text-white/10 group-hover:bg-red-brand/10 group-hover:text-red-brand transition-all">
                                                    <Eye className="w-6 h-6" />
                                                </div>
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-4">{doc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Protocol Authorization */}
                                <div className="pt-12 border-t border-white/[0.08] flex flex-col gap-4">
                                    {selected.kyc_status !== "verified" && (
                                        <button onClick={() => handleVerify(selected.id, "verified")} disabled={isPending}
                                            className="w-full py-6 rounded-[2.5rem] bg-emerald-500 text-black font-black uppercase tracking-[0.4em] text-[11px] shadow-[0_20px_40px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-6 h-6" /> Authorize Node</>}
                                        </button>
                                    )}
                                    {selected.kyc_status !== "rejected" && (
                                        <button onClick={() => handleVerify(selected.id, "rejected")} disabled={isPending}
                                            className="w-full py-6 rounded-[2.5rem] bg-white/[0.03] border border-white/10 text-white/40 hover:text-white hover:bg-red-brand/10 hover:border-red-brand/40 font-black uppercase tracking-[0.4em] text-[11px] transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldAlert className="w-6 h-6" /> Revoke Protocol</>}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-12 border-t border-white/[0.06] bg-white/[0.01]">
                                <p className="text-[10px] text-white/10 font-mono text-center uppercase tracking-[0.4em] leading-loose">
                                    Identity Hash: Synchronized<br />
                                    Compliance Level: Level 3 Restricted
                                </p>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
}
