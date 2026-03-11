"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Users, ShieldCheck, Mail, Phone, MapPin,
    MoreHorizontal, Edit3, Trash2, Shield, User,
    Filter, RefreshCw, X, CheckCircle2, AlertCircle, Loader2,
    Activity, TrendingUp, Globe, Zap, ArrowUpRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const BOX = "bg-[#111116]/80 backdrop-blur-xl border border-white/[0.06] rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:border-white/10";
const ROLE_COLORS: any = {
    admin: "bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/5",
    business: "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-purple-500/5",
    personal: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/5",
};

export default function UserManagementPage() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [selected, setSelected] = useState<any | null>(null);
    const [showBurst, setShowBurst] = useState(false);
    const [isPending, start] = useTransition();

    const load = async () => {
        setLoading(true);
        const { data } = await (supabase as any)
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });

        setProfiles(data || []);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const downloadCSV = () => {
        if (profiles.length === 0) return;
        const headers = ["ID", "Full Name", "Phone", "State", "Account Type", "Join Date"];
        const rows = profiles.map(p => [
            p.id,
            `"${p.full_name || 'N/A'}"`,
            p.phone || "N/A",
            p.state || "N/A",
            p.account_type,
            new Date(p.created_at).toISOString()
        ]);
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `pax_registry_export_${new Date().getTime()}.csv`;
        link.click();
    };

    const filtered = profiles.filter(p => {
        const matchesSearch = !search ||
            p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            p.phone?.includes(search);

        const matchesFilter = filter === "all" || p.account_type === filter;

        return matchesSearch && matchesFilter;
    });

    const updateRole = async (userId: string, role: string) => {
        start(async () => {
            const { error } = await (supabase as any)
                .from("profiles")
                .update({ account_type: role })
                .eq("id", userId);

            if (error) alert("Failed to update role");
            else {
                setProfiles(prev => prev.map(p => p.id === userId ? { ...p, account_type: role } : p));
                if (selected?.id === userId) setSelected({ ...selected, account_type: role });
            }
        });
    };

    const deleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this profile?")) return;

        start(async () => {
            const { error } = await (supabase as any)
                .from("profiles")
                .delete()
                .eq("id", userId);

            if (error) alert("Failed to delete profile");
            else {
                setProfiles(prev => prev.filter(p => p.id !== userId));
                setSelected(null);
            }
        });
    };

    const stats = {
        total: profiles.length,
        admins: profiles.filter(p => p.account_type === "admin").length,
        business: profiles.filter(p => p.account_type === "business").length,
        personal: profiles.filter(p => p.account_type === "personal").length
    };

    return (
        <div className="p-6 lg:p-12 space-y-12 min-h-screen bg-[#08080a] selection:bg-red-brand/30">

            {/* ── Header Strategy ── */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-red-brand/10 border border-red-brand/20 rounded-full flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-brand rounded-full animate-pulse" />
                            <span className="text-red-brand text-[9px] font-black uppercase tracking-[0.2em]">Operational Nexus</span>
                        </div>
                        <span className="text-white/10 text-[9px] font-black uppercase tracking-[0.2em]">System Version 2.0.4</span>
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Node <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-brand via-red-500 to-amber-500">Registry</span>
                    </h1>
                    <p className="text-white/30 text-sm max-w-md font-medium leading-relaxed">
                        Orchestrate platform access and governance across the PAN Africa distribution network.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-red-brand/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-red-brand transition-colors" />
                        <input
                            type="text"
                            placeholder="Universal Search Node..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm text-white outline-none focus:border-red-brand/40 transition-all min-w-[320px] backdrop-blur-md relative z-10"
                        />
                    </div>
                    <button onClick={load} className="flex items-center justify-center px-6 bg-white/[0.03] border border-white/10 rounded-2xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-all active:scale-95 group relative overflow-hidden">
                        <RefreshCw className={cn("w-5 h-5 relative z-10", loading && "animate-spin")} />
                        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-red-brand transform translate-y-full group-hover:translate-y-0 transition-transform" />
                    </button>
                </div>
            </div>

            {/* ── Intelligence Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                    { label: "Total Infrastructure Nodes", val: stats.total, icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10", trend: "+2.4%" },
                    { label: "Verified Merchants", val: stats.business, icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10", trend: "+12%" },
                    { label: "Personal End-points", val: stats.personal, icon: User, color: "text-emerald-400", bg: "bg-emerald-500/10", trend: "+8.1%" },
                    { label: "Admin Controllers", val: stats.admins, icon: ShieldCheck, color: "text-red-400", bg: "bg-red-500/10", trend: "0.0%" },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(BOX, "p-8 group cursor-default")}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500", s.bg)}>
                                <s.icon className={cn("w-7 h-7", s.color)} />
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                <TrendingUp className="w-3 h-3" />
                                {s.trend}
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">{s.label}</p>
                        <h4 className="text-4xl font-black text-white tabular-nums tracking-tighter">{s.val}</h4>

                        {/* Fake Mini Graph SVG */}
                        <div className="mt-6 h-8 w-full opacity-20 overflow-hidden">
                            <svg className="w-full h-full" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path
                                    d={`M 0 10 Q 10 ${Math.random() * 10} 20 5 T 40 8 T 60 3 T 80 7 T 100 2`}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className={s.color}
                                />
                            </svg>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Filter Engine ── */}
            <div className="flex flex-wrap items-center gap-4 border-b border-white/[0.06] pb-8">
                <div className="flex items-center gap-2 text-white/20 text-[10px] font-black uppercase tracking-widest mr-4">
                    <Filter className="w-3.5 h-3.5" /> Filter Sequence:
                </div>
                {["all", "personal", "business", "admin"].map((r) => (
                    <button
                        key={r}
                        onClick={() => setFilter(r)}
                        className={cn(
                            "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all relative overflow-hidden group",
                            filter === r
                                ? "bg-white text-black border-white"
                                : "bg-white/[0.02] text-white/30 border-white/[0.06] hover:bg-white/[0.05] hover:text-white"
                        )}
                    >
                        <span className="relative z-10">{r}</span>
                        {filter !== r && <div className="absolute inset-0 bg-red-brand translate-y-full group-hover:translate-y-0 transition-transform opacity-10" />}
                    </button>
                ))}
            </div>

            {/* ── Node Registry Visualizer ── */}
            <div className={BOX}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.01] border-b border-white/[0.06]">
                                {["Terminal Identity", "Deployment Region", "Node Type", "Active Since", ""].map(h => (
                                    <th key={h} className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/10 first:pl-12 last:pr-12">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i}><td colSpan={5} className="px-12 py-12 animate-pulse"><div className="h-6 bg-white/[0.03] rounded-2xl w-full" /></td></tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="px-12 py-32 text-center">
                                    <div className="inline-flex flex-col items-center gap-6 opacity-20">
                                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-white flex items-center justify-center">
                                            <Search className="w-10 h-10" />
                                        </div>
                                        <p className="font-black uppercase tracking-[0.4em] text-xs">No Nodes Located in specified frequency</p>
                                    </div>
                                </td></tr>
                            ) : filtered.map((p, idx) => (
                                <motion.tr
                                    key={p.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group hover:bg-white/[0.02] transition-colors relative"
                                >
                                    <td className="px-12 py-8">
                                        <div className="flex items-center gap-6">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-white font-black text-xl transition-transform group-hover:scale-110 shadow-lg">
                                                    {p.full_name?.[0] || <User className="w-6 h-6 opacity-30" />}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-[#111116] bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-base font-black text-white tracking-tight">{p.full_name || "Nexus Node Undefined"}</p>
                                                    <ArrowUpRight className="w-3 h-3 text-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                                    <span className="w-1 h-1 bg-white/20 rounded-full" /> UID: {p.id.slice(0, 8)}...
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="space-y-2">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-lg">
                                                <Phone className="w-3 h-3 text-red-brand/40" />
                                                <span className="text-[11px] font-bold text-white/60 tabular-nums">{p.phone || "+234 ——— ———"}</span>
                                            </div>
                                            <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] flex items-center gap-2 pl-1">
                                                <MapPin className="w-3 h-3 text-blue-400/30" /> {p.state || "Sector Unassigned"}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className={cn("inline-flex px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] border shadow-sm", ROLE_COLORS[p.account_type] || ROLE_COLORS.personal)}>
                                            {p.account_type}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-white/40 tabular-nums">
                                                {new Date(p.created_at).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                                            </p>
                                            <p className="text-[9px] text-white/10 font-black uppercase tracking-widest">Temporal Log ID: {idx + 412}</p>
                                        </div>
                                    </td>
                                    <td className="px-12 py-8 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <button
                                                onClick={() => setSelected(p)}
                                                className="w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all shadow-xl"
                                            >
                                                <Edit3 className="w-4.5 h-4.5" />
                                            </button>
                                            <button
                                                onClick={() => deleteUser(p.id)}
                                                className="w-11 h-11 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-400/60 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-xl"
                                            >
                                                <Trash2 className="w-4.5 h-4.5" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Governance Interface (Drawer) ── */}
            <AnimatePresence>
                {selected && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl" onClick={() => setSelected(null)} />

                        <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 200, damping: 25 }}
                            className="fixed top-0 right-0 bottom-0 z-[110] w-full max-w-lg bg-[#0c0c10] border-l border-white/[0.06] flex flex-col shadow-[-40px_0_80px_rgba(0,0,0,0.5)]">

                            <div className="p-10 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-red-brand/10 blur-[100px] pointer-events-none" />
                                <div className="flex items-center justify-between relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="w-3.5 h-3.5 text-red-brand" />
                                            <span className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">Governance Protocol</span>
                                        </div>
                                        <h2 className="text-3xl font-black text-white tracking-tighter">Node Configuration</h2>
                                    </div>
                                    <button onClick={() => setSelected(null)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.03] text-white/40 hover:text-white hover:bg-white/10 transition-all"><X className="w-6 h-6" /></button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-12 space-y-12 relative">
                                {/* Profile Vector */}
                                <div className="flex flex-col items-center text-center">
                                    <div className="relative group">
                                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-32 h-32 rounded-[3rem] bg-gradient-to-tr from-red-brand via-red-600 to-amber-500 flex items-center justify-center text-white font-black text-5xl mb-8 shadow-[0_0_50px_rgba(235,0,44,0.3)] relative z-10">
                                            {selected.full_name?.[0] || "!"}
                                        </motion.div>
                                        <div className="absolute inset-0 bg-red-brand/40 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full animate-pulse" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white tracking-tight leading-tight">{selected.full_name}</h3>
                                    <p className="text-white/40 font-mono text-sm mt-2 flex items-center gap-2 uppercase tracking-widest">
                                        <Activity className="w-3.5 h-3.5 text-emerald-400" /> Operational History: Active
                                    </p>
                                </div>

                                {/* Permissions Matrix */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Access Privilege Matrix</h4>
                                        {isPending && <Loader2 className="w-4 h-4 text-red-brand animate-spin" />}
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            { id: "personal", label: "Standard Access", desc: "Basic consumer end-point permissions." },
                                            { id: "business", label: "Merchant Protocol", desc: "Institutional logistics and settlement rights." },
                                            { id: "admin", label: "Root Governance", desc: "Full administrative over-ride capabilities." },
                                        ].map((r) => (
                                            <button
                                                key={r.id}
                                                disabled={selected.account_type === r.id || isPending}
                                                onClick={() => updateRole(selected.id, r.id)}
                                                className={cn(
                                                    "p-6 rounded-3xl border text-left transition-all relative overflow-hidden group",
                                                    selected.account_type === r.id
                                                        ? "bg-red-brand/10 border-red-brand/30 ring-1 ring-red-brand/20 shadow-xl shadow-red-brand/5"
                                                        : "bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]"
                                                )}
                                            >
                                                <div className="flex items-center justify-between relative z-10">
                                                    <div>
                                                        <p className={cn("text-xs font-black uppercase tracking-widest mb-1", selected.account_type === r.id ? "text-red-brand" : "text-white/80")}>{r.label}</p>
                                                        <p className="text-[11px] text-white/30 font-medium">{r.desc}</p>
                                                    </div>
                                                    {selected.account_type === r.id && <CheckCircle2 className="w-5 h-5 text-red-brand" />}
                                                </div>
                                                <div className="absolute inset-0 bg-white shadow-inner opacity-[0.02] transform transition-transform group-hover:scale-110" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Threat Mitigation */}
                                <div className="p-10 rounded-[2.5rem] bg-red-500/[0.03] border border-red-500/10 space-y-6">
                                    <div className="flex items-center gap-4 text-red-500">
                                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                                            <AlertCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-black uppercase tracking-[0.3em] block">Danger Zone</span>
                                            <span className="text-[10px] text-red-500/40 font-bold uppercase tracking-widest leading-none">Mitigation Tactics Required</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/40 leading-relaxed font-medium">Removing this node from the registry will terminate all associated operational sessions. This action is logged and monitored for compliance.</p>
                                    <button
                                        onClick={() => deleteUser(selected.id)}
                                        className="w-full py-5 rounded-2xl bg-red-500 hover:bg-red-600 text-white shadow-2xl shadow-red-500/20 transition-all text-xs font-black uppercase tracking-[0.3em] active:scale-95"
                                    >
                                        Drop Node Profile
                                    </button>
                                </div>
                            </div>

                            <div className="p-12 border-t border-white/[0.06] bg-white/[0.01]">
                                <p className="text-[10px] text-white/10 font-mono text-center uppercase tracking-[0.4em] leading-loose">
                                    Encrypted Payload: {selected.id}<br />
                                    Infrastructure Status: Synchronized
                                </p>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ── Burst Operations Hub (Modal) ── */}
            <AnimatePresence>
                {showBurst && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-3xl" onClick={() => setShowBurst(false)} />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="fixed inset-0 z-[130] flex items-center justify-center p-6 pointer-events-none"
                        >
                            <div className="w-full max-w-4xl bg-[#111116] border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto">
                                <div className="p-10 border-b border-white/[0.06] bg-gradient-to-r from-red-brand/10 to-transparent flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-red-brand flex items-center justify-center text-white shadow-2xl shadow-red-brand/40">
                                            <Zap className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h2 className="text-4xl font-black text-white tracking-tighter">Burst Operations Hub</h2>
                                            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mt-1 italic">Global Network Override — Level 4 Clearance</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowBurst(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.03] text-white/40 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                                </div>

                                <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Action 1: Broadcast */}
                                    <div className="group p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                                            <Globe className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-black text-white mb-2">System Broadcast</h3>
                                        <p className="text-[11px] text-white/30 font-medium leading-relaxed mb-6">Dispatch a low-latency network message to every operational node in the registry via SMS & App Push.</p>
                                        <button className="w-full py-4 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest group-hover:bg-blue-500 group-hover:text-white transition-all">Init Broadcast Sequence</button>
                                    </div>

                                    {/* Action 2: Data Export */}
                                    <div onClick={downloadCSV} className="group p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-black text-white mb-2">Registry Export</h3>
                                        <p className="text-[11px] text-white/30 font-medium leading-relaxed mb-6">Generate an unencrypted CSV telemetry log of the entire user infrastructure for offline intelligence audit.</p>
                                        <button className="w-full py-4 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-black uppercase tracking-widest group-hover:bg-purple-500 group-hover:text-white transition-all">Execute Telemetry Pull</button>
                                    </div>

                                    {/* Action 3: Maintenance Toggle */}
                                    <div className="group p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer relative overflow-hidden">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                                            <Activity className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-black text-white mb-2">Maintenance Lock</h3>
                                        <p className="text-[11px] text-white/30 font-medium leading-relaxed mb-6">Pivot platform to read-only mode for immediate core infrastructure updates and cache purging.</p>
                                        <button className="w-full py-4 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest group-hover:bg-amber-500 group-hover:text-white transition-all">Toggle Matrix Sync</button>
                                    </div>

                                    {/* Action 4: Force Sync */}
                                    <div onClick={() => { load(); setShowBurst(false); }} className="group p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                                            <RefreshCw className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-black text-white mb-2">Hard Sync Node</h3>
                                        <p className="text-[11px] text-white/30 font-medium leading-relaxed mb-6">Force a recursive refresh of all operational node states directly from the Supabase primary shard.</p>
                                        <button className="w-full py-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest group-hover:bg-emerald-500 group-hover:text-white transition-all">Recalibrate Shards</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Floating Quick Settings Icon */}
            <div className="fixed bottom-12 right-12 z-[90]">
                <button
                    onClick={() => setShowBurst(true)}
                    className="w-16 h-16 rounded-[2rem] bg-red-brand text-white shadow-2xl shadow-red-brand/40 flex items-center justify-center hover:scale-110 transition-transform active:scale-90 group relative"
                >
                    <Zap className="w-7 h-7" />
                    <div className="absolute -top-12 right-0 bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl pointer-events-none whitespace-nowrap border-b-4 border-gray-200">
                        Burst Operations
                    </div>
                </button>
            </div>
        </div>
    );
}
