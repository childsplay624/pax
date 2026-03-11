"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    Shield, ShieldCheck, ShieldAlert,
    Search, Filter, CheckCircle2, XCircle,
    Eye, MapPin, Building2, Phone, Calendar,
    Loader2, ArrowLeft, MoreHorizontal, FileText,
    AlertCircle, Check
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { updateMerchantKYC } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

interface Merchant {
    id: string;
    full_name: string;
    company_name: string;
    phone: string;
    state: string;
    kyc_status: "verified" | "rejected" | "pending";
    created_at: string;
}

function VerifyPageContent() {
    const searchParams = useSearchParams();
    const initialId = searchParams.get("id");

    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"pending" | "all" | "verified">("pending");
    const [selected, setSelected] = useState<Merchant | null>(null);
    const [isPending, start] = useTransition();

    const load = async () => {
        setLoading(true);
        const { data } = await (supabase as any)
            .from("profiles")
            .select("*")
            .eq("account_type", "business")
            .order("created_at", { ascending: false });

        setMerchants(data || []);

        if (initialId && data) {
            const found = data.find((m: any) => m.id === initialId);
            if (found) setSelected(found);
        }

        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleAudit = (id: string, status: "verified" | "rejected") => {
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
            (m.company_name?.toLowerCase().includes(search.toLowerCase())) ||
            (m.full_name?.toLowerCase().includes(search.toLowerCase())) ||
            (m.phone?.includes(search));

        const matchesFilter = filter === "all" || m.kyc_status === filter;
        return matchesSearch && matchesFilter;
    });

    const stats = {
        pending: merchants.filter(m => m.kyc_status === "pending").length,
        verified: merchants.filter(m => m.kyc_status === "verified").length,
    };

    const BOX = "bg-[#111116] border border-white/[0.06] rounded-[2rem] overflow-hidden shadow-2xl";

    return (
        <div className="p-6 lg:p-10 space-y-8 min-h-screen bg-[#0c0c10]">

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/admin" className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <span className="text-red-brand text-[10px] font-black uppercase tracking-[0.4em]">Operations Audit</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Credential <span className="text-red-brand">Verification</span>
                    </h1>
                </div>

                <div className="flex bg-white/[0.03] border border-white/10 rounded-2xl p-1">
                    {[
                        { id: "pending", label: "Pending", count: stats.pending },
                        { id: "verified", label: "Verified", count: stats.verified },
                        { id: "all", label: "All Records", count: merchants.length }
                    ].map(f => (
                        <button key={f.id} onClick={() => setFilter(f.id as any)}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                filter === f.id ? "bg-red-brand text-white shadow-lg shadow-red-brand/20" : "text-white/30 hover:text-white"
                            )}>
                            {f.label}
                            <span className={cn("px-1.5 py-0.5 rounded-md text-[8px]", filter === f.id ? "bg-white/20 text-white" : "bg-white/5 text-white/40")}>
                                {f.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={cn(BOX, "p-8 md:col-span-3 flex flex-col md:flex-row md:items-center justify-between gap-8")}>
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-red-brand/10 border border-red-brand/20 flex items-center justify-center">
                            <Shield className="w-8 h-8 text-red-brand" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg mb-1">Compliance Overview</h3>
                            <p className="text-white/30 text-xs">Verify business identities to maintain platform integrity.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-10">
                        <div>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Response Time</p>
                            <p className="text-xl font-bold text-white">1.2 Hours</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Review Quality</p>
                            <p className="text-xl font-bold text-emerald-400">99.8%</p>
                        </div>
                    </div>
                </div>
                <div className={cn(BOX, "p-8 bg-gradient-to-br from-red-brand to-red-dark border-none flex flex-col justify-between")}>
                    <AlertCircle className="w-6 h-6 text-white/40" />
                    <div>
                        <h4 className="text-white font-black text-2xl tracking-tight leading-tight">Priority<br />Queue</h4>
                        <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-2">{stats.pending} cases awaiting audit</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                {/* Audit Queue */}
                <div className={cn(BOX, "xl:col-span-8 overflow-hidden")}>
                    <div className="p-8 border-b border-white/[0.06] flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Audit Queue</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                            <input type="text" placeholder="Search businesses..."
                                value={search} onChange={e => setSearch(e.target.value)}
                                className="bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-red-brand/40 min-w-[240px]" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/[0.02]">
                                    {["Merchant", "Operational Base", "Documents", "Status", "Actions"].map(h => (
                                        <th key={h} className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}><td colSpan={5} className="px-8 py-8"><div className="h-4 bg-white/5 rounded-full animate-pulse" /></td></tr>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={5} className="px-8 py-20 text-center text-white/20 font-bold uppercase tracking-widest text-xs">Queue Cleared</td></tr>
                                ) : filtered.map(m => (
                                    <tr key={m.id} onClick={() => setSelected(m)} className={cn("group cursor-pointer transition-all", selected?.id === m.id ? "bg-white/[0.04]" : "hover:bg-white/[0.02]")}>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-brand/20 to-red-brand/10 border border-red-brand/20 flex items-center justify-center text-red-brand font-black text-sm">
                                                    {m.company_name?.[0] || m.full_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white leading-tight">{m.company_name || m.full_name}</p>
                                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Reg: {new Date(m.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-xs font-bold text-white/60">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="w-3 h-3 text-red-brand" /> {m.state}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex -space-x-2">
                                                {[1, 2].map(i => (
                                                    <div key={i} className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center">
                                                        <FileText className="w-3 h-3 text-white/30" />
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                                                m.kyc_status === "verified" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                    m.kyc_status === "rejected" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                        "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                            )}>
                                                {m.kyc_status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/20 group-hover:text-white transition-all">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Audit Panel */}
                <div className="xl:col-span-4">
                    <AnimatePresence mode="wait">
                        {!selected ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className={cn(BOX, "p-10 h-full flex flex-col items-center justify-center text-center text-white/20 border-dashed")}>
                                <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-6">
                                    <ShieldCheck className="w-10 h-10 opacity-20" />
                                </div>
                                <p className="text-sm font-bold uppercase tracking-widest">Select a Case<br />to start Audit</p>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                className={cn(BOX, "flex flex-col h-full")}>

                                <div className="p-8 border-b border-white/[0.06] bg-white/[0.02]">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[9px] font-black text-red-brand uppercase tracking-[0.3em]">Case Integrity Check</span>
                                        <button onClick={() => setSelected(null)} className="text-white/20 hover:text-white transition-colors">
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <h3 className="text-2xl font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                        {selected.company_name || selected.full_name}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
                                            <Building2 className="w-3 h-3 text-white/30" />
                                            <span className="text-[9px] font-bold text-white/60 uppercase">Business Tier</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
                                            <Phone className="w-3 h-3 text-white/30" />
                                            <span className="text-[9px] font-bold text-white/60 uppercase">{selected.phone}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 space-y-8 flex-1 overflow-y-auto">

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-1">Submitted Intelligence</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {[
                                                { label: "Entity Name", val: selected.company_name, icon: Building2 },
                                                { label: "Principal", val: selected.full_name, icon: Calendar },
                                                { label: "Jurisdiction", val: selected.state, icon: MapPin },
                                            ].map((item, i) => (
                                                <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <item.icon className="w-4 h-4 text-white/20 group-hover:text-red-brand transition-colors" />
                                                        <div>
                                                            <p className="text-[8px] font-black text-white/10 uppercase tracking-widest">{item.label}</p>
                                                            <p className="text-sm font-bold text-white/80">{item.val || "—"}</p>
                                                        </div>
                                                    </div>
                                                    <Check className="w-4 h-4 text-emerald-400/20 group-hover:text-emerald-400 transition-colors" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Compliance Checkpoint</h4>
                                            <span className="text-[9px] font-bold text-amber-500 uppercase">Documents Pending</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {["Incorporation", "Tax ID"].map(doc => (
                                                <div key={doc} className="aspect-square rounded-[1.5rem] bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center group cursor-pointer hover:bg-white/[0.05] transition-all">
                                                    <FileText className="w-6 h-6 text-white/10 group-hover:text-red-brand transition-all" />
                                                    <p className="text-[9px] font-black text-white/20 uppercase mt-4 tracking-widest">{doc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>

                                <div className="p-8 border-t border-white/[0.06] bg-white/[0.01] space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => handleAudit(selected.id, "verified")} disabled={isPending}
                                            className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2">
                                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Approve</>}
                                        </button>
                                        <button onClick={() => handleAudit(selected.id, "rejected")} disabled={isPending}
                                            className="h-14 rounded-2xl bg-white/[0.04] border border-white/10 text-white hover:bg-red-brand hover:border-red-brand font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2">
                                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" /> Reject</>}
                                        </button>
                                    </div>
                                    <button className="w-full h-12 rounded-xl text-[9px] font-black text-white/20 uppercase tracking-[0.2em] hover:text-white/40 transition-colors flex items-center justify-center gap-2">
                                        <MoreHorizontal className="w-3.5 h-3.5" /> Additional Actions
                                    </button>
                                </div>

                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>

        </div>
    );
}

export default function AdminVerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0c0c10] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-red-brand animate-spin" />
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Loading Intelligence Audit...</p>
                </div>
            </div>
        }>
            <VerifyPageContent />
        </Suspense>
    );
}
