"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Wallet, ArrowUpRight, ArrowDownLeft, Plus, X, 
    CreditCard, Shield, Zap, Loader2, TrendingUp, 
    History, Landmark, CheckCircle2, AlertCircle, Info,
    BarChart3, PieChart, ShieldCheck
} from "lucide-react";
import { getWalletData, requestSettlement } from "@/app/actions/dashboard";
import { initializeWalletTopup } from "@/app/actions/payments";
import { cn } from "@/lib/utils";

type WalletData = Awaited<ReturnType<typeof getWalletData>>;
const AMOUNTS = [5000, 10000, 25000, 50000, 100000, 250000];

export default function WalletPage() {
    const [data, setData] = useState<WalletData | null>(null);
    const [activeTab, setActiveTab] = useState<"history" | "settlements">("history");
    
    // Top-up Modal
    const [fundModal, setFundModal] = useState(false);
    const [amount, setAmount] = useState("");
    const [custom, setCustom] = useState(false);
    const [paying, startPay] = useTransition();
    const [payError, setPayError] = useState<string | null>(null);

    // Settlement Modal
    const [settleModal, setSettleModal] = useState(false);
    const [settlePending, startSettle] = useTransition();
    const [settleForm, setSettleForm] = useState({ amount: "", bank: "", accNum: "", accName: "" });
    const [settleError, setSettleError] = useState<string | null>(null);
    const [settleSuccess, setSettleSuccess] = useState(false);

    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        const d = await getWalletData();
        setData(d as any);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const fmt = (n: number) => `₦${Number(n).toLocaleString("en-NG")}`;
    const BOX = "bg-[#111116] border border-white/[0.06] rounded-[2rem] overflow-hidden";

    return (
        <div className="p-6 lg:p-10 space-y-10 min-h-screen bg-[#0c0c10]">

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">Financial Core Active</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Financial <span className="text-red-brand">Intelligence</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setSettleModal(true)}
                        className="px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white/60 hover:text-white text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2">
                        <Landmark className="w-4 h-4" /> Request Settlement
                    </button>
                    <button onClick={() => setFundModal(true)}
                        className="px-6 py-3 rounded-2xl bg-red-brand hover:bg-red-dark text-white text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-red-brand/20 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Fund Wallet
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Main Wallet Card */}
                <div className={cn(BOX, "relative p-10 flex flex-col justify-between min-h-[400px] overflow-hidden group")}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-brand/10 rounded-full blur-[100px] -mr-32 -mt-32 transition-all group-hover:bg-red-brand/20" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-16 h-16 bg-red-brand/10 border border-red-brand/20 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                                <Wallet className="w-8 h-8 text-red-brand" />
                            </div>
                            <div>
                                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Available Liquidity</p>
                                <p className="text-white/10 text-[9px] font-bold uppercase mt-0.5 tracking-[0.2em]">PAX Merchant ID: {data?.balance ? "ACTIVE" : "PENDING"}</p>
                            </div>
                        </div>
                        <h2 className="text-6xl font-black text-white tracking-tighter mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            {loading ? <span className="opacity-20">₦ ——</span> : fmt(data?.balance ?? 0)}
                        </h2>
                        <div className="flex items-center gap-2 text-emerald-400/60 text-[10px] font-black uppercase tracking-widest">
                            <Shield className="w-3.5 h-3.5" /> 100% Secured by PAX Escrow
                        </div>
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-4 mt-12 pt-10 border-t border-white/[0.06]">
                        <div>
                            <p className="text-white/20 text-[9px] font-black uppercase tracking-widest mb-2">Total Funded</p>
                            <p className="text-xl font-bold text-white/80">{fmt(data?.stats.totalFunded ?? 0)}</p>
                        </div>
                        <div>
                            <p className="text-white/20 text-[9px] font-black uppercase tracking-widest mb-2">Total Logistics Spend</p>
                            <p className="text-xl font-bold text-white/80">{fmt(data?.stats.totalSpent ?? 0)}</p>
                        </div>
                    </div>
                </div>

                {/* Financial Health Mini-Charts */}
                <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className={cn(BOX, "p-8 space-y-6")}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-white/60">Spending Analytics</h3>
                            </div>
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Last 30 Days</span>
                        </div>
                        <div className="pt-4 flex items-end gap-2 h-32">
                            {Array.from({ length: 12 }).map((_, i) => {
                                const h = 10 + Math.random() * 90;
                                return (
                                    <div key={i} className="flex-1 bg-white/[0.03] rounded-t-lg relative group overflow-hidden">
                                        <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05 }}
                                            className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-blue-500/10 to-blue-400/40 group-hover:from-blue-500/40 group-hover:to-blue-400 transition-all" />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex items-center justify-between pt-4">
                            <p className="text-2xl font-black text-white">{fmt(data?.stats.monthlySpent ?? 0)}</p>
                            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                <TrendingUp className="w-3.5 h-3.5" /> 8.4%
                            </div>
                        </div>
                    </div>

                    <div className={cn(BOX, "p-8 bg-gradient-to-br from-[#111116] to-[#1a1a25]")}>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                                <PieChart className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-white/60">Revenue Breakdown</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: "Logistics Cost", val: 85, color: "bg-red-brand" },
                                { label: "VAT (7.5%)", val: 7.5, color: "bg-emerald-500" },
                                { label: "Cargo Insurance", val: 7.5, color: "bg-blue-500" },
                            ].map(item => (
                                <div key={item.label}>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                                        <span className="text-white/40">{item.label}</span>
                                        <span className="text-white">{item.val}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.val}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Section */}
            <div className={BOX}>
                <div className="px-10 py-8 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                        <History className="w-5 h-5 text-white/20" />
                        <h2 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Audit Trail</h2>
                    </div>
                    <div className="flex bg-white/[0.03] border border-white/10 rounded-[1.25rem] p-1">
                        <button onClick={() => setActiveTab("history")} className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === "history" ? "bg-red-brand text-white shadow-lg" : "text-white/30 hover:text-white")}>History</button>
                        <button onClick={() => setActiveTab("settlements")} className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === "settlements" ? "bg-red-brand text-white shadow-lg" : "text-white/30 hover:text-white")}>Settlements</button>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/[0.04]">
                                {["Transaction ID", "Category", "Amount", "Telemetry", "Timestamp", "Audit Status"].map(h => (
                                    <th key={h} className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}><td colSpan={6} className="px-10 py-6 animate-pulse"><div className="h-4 bg-white/[0.05] rounded w-full" /></td></tr>
                                ))
                            ) : data?.transactions.length === 0 ? (
                                <tr><td colSpan={6} className="px-10 py-20 text-center text-white/20 font-bold uppercase tracking-widest text-xs">No transactions recorded</td></tr>
                            ) : data?.transactions.map((tx, i) => (
                                <tr key={tx.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-10 py-6">
                                        <span className="font-mono text-[11px] font-black text-white">{tx.ref}</span>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", tx.type === "credit" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                                                {tx.type === "credit" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                            </div>
                                            <p className="text-xs font-bold text-white/80">{tx.description}</p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <p className={cn("text-sm font-black tracking-tight", tx.type === "credit" ? "text-emerald-400" : "text-white")}>
                                            {tx.type === "credit" ? "+" : "-"}{fmt(tx.amount)}
                                        </p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{tx.type === "credit" ? "Paystack Auth" : "PAX Internal"}</span>
                                    </td>
                                    <td className="px-10 py-6 text-[11px] text-white/30 font-bold">{tx.date}</td>
                                    <td className="px-10 py-6">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                                            <CheckCircle2 className="w-3 h-3" /> {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Fund Modal */}
            <AnimatePresence>
                {fundModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md" onClick={() => setFundModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none">
                            <div className="bg-[#111116] border border-white/[0.1] rounded-[2.5rem] p-10 w-full max-w-md pointer-events-auto shadow-2xl relative">
                                <button onClick={() => setFundModal(false)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                                <div className="mb-10">
                                    <h2 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Capital Infusion</h2>
                                    <p className="text-white/30 text-xs mt-1 uppercase font-bold tracking-widest">Replenish your operating balance</p>
                                </div>
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    {AMOUNTS.map(a => (
                                        <button key={a} onClick={() => { setAmount(String(a)); setCustom(false); }}
                                            className={cn("py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                                amount === String(a) && !custom ? "bg-red-brand border-red-brand text-white shadow-xl shadow-red-brand/20 scale-105" : "bg-white/[0.03] border-white/5 text-white/30 hover:text-white")}>
                                            {fmt(a)}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setCustom(!custom)} className="text-red-brand hover:text-red-light text-[10px] font-black uppercase tracking-widest mb-6 block mx-auto">{custom ? "Use Pre-sets" : "Enter Custom Capital"}</button>
                                {custom && (
                                    <div className="relative mb-6">
                                        <input type="number" min="1000" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-lg outline-none focus:border-red-brand/40 transition-all" />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 font-black">NGN</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-10">
                                    <Shield className="w-5 h-5 text-emerald-400/60" />
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">Payments are verified via <span className="text-white">Paystack PLC</span> Secure Gateway.</p>
                                </div>
                                <button disabled={!amount || Number(amount) < 1000 || paying} onClick={() => startPay(async () => {
                                    const res = await initializeWalletTopup(Number(amount));
                                    if (res.error || !res.authorization_url) setPayError(res.error ?? "Payment Initialization Failed");
                                    else window.location.href = res.authorization_url;
                                })} className="w-full py-5 rounded-[2rem] bg-red-brand hover:bg-red-dark disabled:opacity-30 text-white font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-red-brand/20 flex items-center justify-center gap-3">
                                    {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CreditCard className="w-5 h-5" /> Proceed to Gateway</>}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Settlement Modal */}
            <AnimatePresence>
                {settleModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md" onClick={() => setSettleModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none">
                            <div className="bg-[#111116] border border-white/[0.1] rounded-[2.5rem] p-10 w-full max-w-lg pointer-events-auto shadow-2xl relative">
                                <button onClick={() => setSettleModal(false)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                                
                                {settleSuccess ? (
                                    <div className="py-20 text-center animate-in fade-in zoom-in duration-500">
                                        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
                                            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white tracking-tight mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Settlement Initiated</h2>
                                        <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">Your request for {fmt(Number(settleForm.amount))} has been queued. Funds will arrive in your bank account within 24 hours.</p>
                                        <button onClick={() => { setSettleModal(false); setSettleSuccess(false); loadData(); }} className="mt-10 px-8 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/[0.06] transition-all">Close Console</button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-10">
                                            <h2 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Capital Payout</h2>
                                            <p className="text-white/30 text-[10px] mt-1 font-black uppercase tracking-[0.2em]">Request a withdrawal to your corporate bank account</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/20 px-2">Payout Amount</label>
                                                    <input type="number" placeholder="0.00" value={settleForm.amount} onChange={e => setSettleForm(f => ({ ...f, amount: e.target.value }))}
                                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-brand/40" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/20 px-2">Bank Name</label>
                                                    <input type="text" placeholder="e.g. Zenith Bank" value={settleForm.bank} onChange={e => setSettleForm(f => ({ ...f, bank: e.target.value }))}
                                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-brand/40" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/20 px-2">Account Number</label>
                                                    <input type="text" placeholder="10 Digits" maxLength={10} value={settleForm.accNum} onChange={e => setSettleForm(f => ({ ...f, accNum: e.target.value }))}
                                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-brand/40" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/20 px-2">Awaiting Verification</label>
                                                    <input type="text" placeholder="Account Name" value={settleForm.accName} onChange={e => setSettleForm(f => ({ ...f, accName: e.target.value }))}
                                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-brand/40" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 mt-8 mb-10 flex gap-4">
                                            <Info className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Notice</p>
                                                <p className="text-[11px] text-amber-200/50 leading-relaxed font-medium">Settlement requests are processed daily. Ensure your bank details are accurate as transactions are non-reversible once authorized.</p>
                                            </div>
                                        </div>

                                        <button disabled={!settleForm.amount || !settleForm.accNum || settlePending}
                                            onClick={() => {
                                                setSettleError(null);
                                                startSettle(async () => {
                                                    const res = await requestSettlement({
                                                        amount: Number(settleForm.amount),
                                                        bank_name: settleForm.bank,
                                                        account_number: settleForm.accNum,
                                                        account_name: settleForm.accName
                                                    });
                                                    if (res.success) setSettleSuccess(true);
                                                    else setSettleError(res.error);
                                                });
                                            }}
                                            className="w-full py-5 rounded-[2rem] bg-white text-black font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-20">
                                            {settlePending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Authorize Settlement</>}
                                        </button>
                                        {settleError && <p className="mt-4 text-center text-red-400 text-[10px] font-black uppercase tracking-widest">{settleError}</p>}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
}
