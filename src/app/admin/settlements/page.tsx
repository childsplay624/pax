"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2, XCircle, Search, Filter,
    ArrowUpRight, Landmark, ExternalLink,
    Clock, AlertCircle, ShieldCheck, Loader2
} from "lucide-react";
import { getSettlements, updateAdminSettlementStatus } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

const BOX = "bg-[#111116] border border-white/[0.06] rounded-[2rem] overflow-hidden";

export default function AdminSettlementsPage() {
    const [settlements, setSettlements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");
    const [search, setSearch] = useState("");
    const [processing, startProcess] = useTransition();

    const loadSettlements = async () => {
        setLoading(true);
        const data = await getSettlements(filter);
        setSettlements(data ?? []);
        setLoading(false);
    };

    useEffect(() => { loadSettlements(); }, [filter]);

    const updateStatus = async (id: string, status: string) => {
        startProcess(async () => {
            const res = await updateAdminSettlementStatus(id, status);
            if (res.success) loadSettlements();
        });
    };

    const fmt = (n: number) => `₦${Number(n).toLocaleString()}`;

    return (
        <div className="p-8 lg:p-12 space-y-10 min-h-screen bg-[#0c0c10]">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                        <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">Payout Governance</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Merchant <span className="text-emerald-500">Settlements</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white/[0.03] border border-white/10 rounded-2xl p-1">
                        {["pending", "completed", "failed", "all"].map(s => (
                            <button key={s} onClick={() => setFilter(s)}
                                className={cn("px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    filter === s ? "bg-emerald-500 text-white shadow-lg" : "text-white/30 hover:text-white")}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Pending Payouts", val: settlements.filter(s => s.status === "pending").length, icon: Clock, col: "text-amber-400" },
                    { label: "Total Volume", val: fmt(settlements.reduce((acc, s) => acc + Number(s.amount), 0)), icon: Landmark, col: "text-emerald-400" },
                    { label: "Success Rate", val: "98.2%", icon: ShieldCheck, col: "text-blue-400" },
                ].map(s => (
                    <div key={s.label} className={cn(BOX, "p-6 flex items-center gap-5")}>
                        <div className={cn("p-3 rounded-2xl bg-white/[0.03]", s.col)}>
                            <s.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-white/20 text-[9px] font-black uppercase tracking-widest group-hover:text-white/40 transition-colors">{s.label}</p>
                            <p className="text-2xl font-black text-white tracking-tight">{s.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* List */}
            <div className={BOX}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                                {["Merchant", "Banking Details", "Amount", "Reference", "Status", "Actions"].map(h => (
                                    <th key={h} className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/20">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}><td colSpan={6} className="px-8 py-8 animate-pulse"><div className="h-4 bg-white/[0.05] rounded w-full" /></td></tr>
                                ))
                            ) : settlements.length === 0 ? (
                                <tr><td colSpan={6} className="px-8 py-20 text-center text-white/20 font-black uppercase tracking-widest text-xs">No payout requests found</td></tr>
                            ) : settlements.map((s) => (
                                <tr key={s.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-8">
                                        <p className="text-sm font-black text-white">{s.profiles?.company_name || s.profiles?.full_name}</p>
                                        <p className="text-[10px] text-white/30 font-bold mt-1">{s.profiles?.phone}</p>
                                    </td>
                                    <td className="px-8 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-white/40">
                                                <Landmark className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-white/80 uppercase tracking-tight">{s.bank_name}</p>
                                                <p className="text-[11px] font-mono text-white/40 mt-1">{s.account_number} · {s.account_name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8">
                                        <p className="text-lg font-black text-white tracking-tighter">{fmt(s.amount)}</p>
                                    </td>
                                    <td className="px-8 py-8">
                                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{s.reference}</span>
                                    </td>
                                    <td className="px-8 py-8">
                                        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                            s.status === "pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                s.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                    "bg-red-500/10 text-red-400 border-red-500/20"
                                        )}>
                                            {s.status === "pending" ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-8">
                                        {s.status === "pending" && (
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => updateStatus(s.id, "completed")}
                                                    className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-emerald-500/10">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => updateStatus(s.id, "failed")}
                                                    className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-red-500/10">
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
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
