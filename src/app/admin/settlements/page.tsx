"use client";

import { useEffect, useState, useTransition } from "react";
import {
    CreditCard, CheckCircle2, XCircle, Clock,
    ArrowUpRight, Search, Filter, Loader2,
    ChevronRight, Wallet, Banknote, User
} from "lucide-react";
import { getSettlements, updateAdminSettlementStatus } from "@/app/actions/admin";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_CONFIG: Record<string, { label: string, color: string, bg: string, icon: any }> = {
    pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/10", icon: Clock },
    processing: { label: "Processing", color: "text-blue-400", bg: "bg-blue-500/10", icon: Loader2 },
    completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
    failed: { label: "Failed", color: "text-red-400", bg: "bg-red-500/10", icon: XCircle },
};

export default function SettlementsVault() {
    const [settlements, setSettlements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [isPending, startTransition] = useTransition();
    const [selectedSettlement, setSelectedSettlement] = useState<any>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getSettlements();
            setSettlements(data);
        } catch (err) {
            console.error("Failed to load settlements:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleUpdateStatus = async (id: string, status: "completed" | "failed" | "processing") => {
        startTransition(async () => {
            const res = await updateAdminSettlementStatus(id, status);
            if (res.success) {
                loadData();
                setSelectedSettlement(null);
            } else {
                alert(`Error: ${res.error}`);
            }
        });
    };

    const filtered = settlements.filter(s => {
        const matchesStatus = filter === "all" || s.status === filter;
        const matchesSearch =
            s.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            s.account_number?.includes(search) ||
            s.reference?.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const fmt = (n: number) => `₦${Number(n).toLocaleString("en-NG")}`;

    return (
        <div className="min-h-screen bg-[#0a0a0e] p-6 lg:p-10 space-y-8 relative overflow-hidden">
            {/* Background Aesthetics */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#eb0000]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header Area */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#eb0000]/10 flex items-center justify-center border border-[#eb0000]/20">
                            <Banknote className="w-5 h-5 text-[#eb0000]" />
                        </div>
                        <h2 className="text-[#eb0000] text-[10px] font-black uppercase tracking-[0.4em]">Finance Operations</h2>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Settlement <span className="text-white/20">Vault</span>
                    </h1>
                    <p className="text-white/40 text-sm max-w-md">Manage partner payouts, approve rider earnings, and audit the financial flow.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input
                            type="text"
                            placeholder="Search names or accounts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white text-sm focus:outline-none focus:border-[#eb0000]/40 transition-all min-w-[280px]"
                        />
                    </div>

                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1">
                        {["all", "pending", "processing", "completed"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                    filter === f ? "bg-white/10 text-white shadow-xl" : "text-white/30 hover:text-white/60"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={loadData}
                        className="p-4 rounded-2xl bg-[#eb0000]/10 border border-[#eb0000]/20 text-[#eb0000] hover:bg-[#eb0000]/20 transition-all"
                    >
                        <Loader2 className={cn("w-5 h-5", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Main Table */}
            <div className="relative z-10 bg-[#111118]/60 backdrop-blur-xl border border-white/[0.08] rounded-[2.5rem] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                                <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Partner / Rider</th>
                                <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Banking Intelligence</th>
                                <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Amount</th>
                                <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Precision Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-8"><div className="h-8 bg-white/5 rounded-2xl w-full" /></td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <CreditCard className="w-12 h-12 text-white/5 mx-auto mb-4" />
                                        <p className="text-white/20 font-black uppercase tracking-widest">No matching settlements found</p>
                                    </td>
                                </tr>
                            ) : filtered.map((s) => (
                                <tr key={s.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                                                <User className="w-6 h-6 text-white/30" />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold">{s.profiles?.full_name || "Unknown Partner"}</p>
                                                <p className="text-white/30 text-[10px] font-medium tracking-tight mt-0.5">{s.profiles?.phone || "No phone"}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white/60 text-xs font-bold">{s.bank_name}</span>
                                                <div className="w-1 h-1 rounded-full bg-white/20" />
                                                <span className="text-[#eb0000] text-xs font-black tracking-widest">{s.account_number}</span>
                                            </div>
                                            <p className="text-[10px] text-white/20 font-medium uppercase truncate max-w-[200px]">{s.account_name || "Account Name Unavailable"}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-xl font-black text-white tracking-tight">{fmt(s.amount)}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border",
                                            STATUS_CONFIG[s.status]?.bg,
                                            STATUS_CONFIG[s.status]?.color.replace("text-", "border-").replace("400", "500/20")
                                        )}>
                                            {(() => {
                                                const Icon = STATUS_CONFIG[s.status]?.icon;
                                                return Icon && <Icon className={cn("w-3.5 h-3.5", s.status === "processing" && "animate-spin")} />;
                                            })()}
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                {STATUS_CONFIG[s.status]?.label || s.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => setSelectedSettlement(s)}
                                            className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-widest hover:bg-[#eb0000] hover:text-white hover:border-[#eb0000] transition-all group/btn"
                                        >
                                            Inspect <ChevronRight className="inline-block w-3.5 h-3.5 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Inspection Sidebar Overlay */}
            <AnimatePresence>
                {selectedSettlement && (
                    <div className="fixed inset-0 z-50 flex justify-end p-4 lg:p-6 overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedSettlement(null)}
                            className="absolute inset-0 bg-[#0a0a0e]/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-xl bg-[#111118] border border-white/10 rounded-[3rem] shadow-2xl p-8 lg:p-12 flex flex-col h-full overflow-y-auto"
                        >
                            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -ml-20 -mt-20" />

                            <div className="relative z-10 space-y-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                                            <Search className="w-6 h-6 text-white/30" />
                                        </div>
                                        <div>
                                            <h2 className="text-white text-2xl font-black">Settlement Audit</h2>
                                            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">Transaction ID: {selectedSettlement.id.slice(0, 8)}...</p>
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/[0.08] w-full" />
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Requested Amount</p>
                                        <p className="text-3xl font-black text-white">{fmt(selectedSettlement.amount)}</p>
                                    </div>
                                    <div className="space-y-1.5 text-right">
                                        <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Entry Date</p>
                                        <p className="text-lg font-bold text-white/60">
                                            {new Date(selectedSettlement.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 bg-white/[0.03] border border-white/10 rounded-[2rem] space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Wallet className="w-4 h-4 text-[#eb0000]" />
                                            <p className="text-[10px] text-white font-black uppercase tracking-widest">Bank Destination</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Bank Name</p>
                                                    <p className="text-white font-bold">{selectedSettlement.bank_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Account Number</p>
                                                    <p className="text-[#eb0000] font-black tracking-[.2em]">{selectedSettlement.account_number}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Account Holder</p>
                                                <p className="text-white/60 font-bold uppercase">{selectedSettlement.account_name || "N/A"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-[2rem] space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="w-4 h-4 text-blue-400" />
                                            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Provider Profile</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-black">
                                                {selectedSettlement.profiles?.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-lg">{selectedSettlement.profiles?.full_name}</p>
                                                <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">{selectedSettlement.profiles?.phone}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-8 border-t border-white/[0.08] space-y-4">
                                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest text-center mb-4">Execute Final Action</p>

                                    {selectedSettlement.status === "pending" || selectedSettlement.status === "processing" ? (
                                        <div className="grid grid-cols-1 gap-3">
                                            {selectedSettlement.status === "pending" && (
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedSettlement.id, "processing")}
                                                    disabled={isPending}
                                                    className="w-full py-5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-black uppercase tracking-widest text-xs hover:bg-blue-500 hover:text-white transition-all"
                                                >
                                                    Mark as Processing
                                                </button>
                                            )}
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedSettlement.id, "completed")}
                                                    disabled={isPending}
                                                    className="py-5 rounded-2xl bg-[#eb0000] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-[#eb0000]/20 hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                                                >
                                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Approve Payout</>}
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedSettlement.id, "failed")}
                                                    disabled={isPending}
                                                    className="py-5 rounded-2xl bg-white/5 border border-white/10 text-white/40 font-black uppercase tracking-widest text-xs hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/20 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <XCircle className="w-4 h-4" /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={cn(
                                            "w-full py-8 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3",
                                            selectedSettlement.status === "completed" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-red-500/20 bg-red-500/5 text-red-400"
                                        )}>
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-current">
                                                {selectedSettlement.status === "completed" ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                            </div>
                                            <p className="font-black uppercase tracking-[0.2em] text-sm">Payout {selectedSettlement.status}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
