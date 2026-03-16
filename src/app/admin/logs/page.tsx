"use client";

import { useEffect, useState } from "react";
import {
    Activity, Terminal, AlertCircle, Info, Flame, ShieldAlert,
    Search, Filter, ChevronRight, ChevronLeft, Trash2, Clock, Eye,
    Cpu, RefreshCcw, Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSystemLogs } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

const LEVEL_CONFIG: Record<string, { icon: any, color: string, bg: string, glow: string }> = {
    info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", glow: "shadow-blue-500/20" },
    warn: { icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-500/10", glow: "shadow-amber-500/20" },
    error: { icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10", glow: "shadow-red-500/20" },
    fatal: { icon: Flame, color: "text-red-600", bg: "bg-red-600/20", glow: "shadow-red-600/40" },
};

export default function LogsVault() {
    const [logs, setLogs] = useState<any[]>([]);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<any | null>(null);
    const [search, setSearch] = useState("");
    const [levelFilter, setLevelFilter] = useState("all");

    const limit = 50;

    async function loadLogs() {
        setLoading(true);
        try {
            const result = await getSystemLogs(limit, page);
            setLogs(result.data);
            setCount(result.count);
        } catch (error) {
            console.error("Failed to load logs:", error);
        }
        setLoading(false);
    }

    useEffect(() => {
        loadLogs();
    }, [page]);

    const filteredLogs = logs.filter(l => {
        const matchesLevel = levelFilter === "all" || l.level === levelFilter;
        const matchesSearch = l.message.toLowerCase().includes(search.toLowerCase()) ||
            l.source.toLowerCase().includes(search.toLowerCase());
        return matchesLevel && matchesSearch;
    });

    const BOX = "bg-[#111116]/80 backdrop-blur-xl border border-white/[0.06] rounded-[2rem] overflow-hidden transition-all duration-300";

    return (
        <div className="p-6 lg:p-10 space-y-10 min-h-screen bg-[#0c0c10] text-white">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Terminal className="w-4 h-4 text-red-brand" />
                        <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">Neural Audit Vault</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Engine <span className="text-red-brand">Audit</span>
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => loadLogs()} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
                        <RefreshCcw className={cn("w-5 h-5 text-white/40", loading && "animate-spin")} />
                    </button>
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-1.5 flex items-center gap-1">
                        {["all", "info", "warn", "error", "fatal"].map(l => (
                            <button key={l}
                                onClick={() => setLevelFilter(l)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all",
                                    levelFilter === l ? "bg-red-brand text-white shadow-lg" : "text-white/30 hover:text-white"
                                )}>
                                {l}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Logs List Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className={cn(BOX, "border-white/10")}>
                        {/* Search & Meta */}
                        <div className="p-6 border-b border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="relative w-full md:w-96 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-red-brand transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search Engine Protocols..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/[0.1] rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-red-brand/40 transition-all font-medium"
                                />
                            </div>
                            <div className="flex items-center gap-3 text-white/20 text-xs font-black uppercase tracking-widest">
                                <Clock className="w-4 h-4" />
                                <span>Recent 30 Days Activity</span>
                            </div>
                        </div>

                        {/* Logs Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 bg-white/[0.01]">
                                    <tr>
                                        <th className="px-6 py-4">Level</th>
                                        <th className="px-6 py-4">Protocol Event</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Source Node</th>
                                        <th className="px-6 py-4">Timestamp</th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {loading ? (
                                        Array(10).fill(0).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={5} className="px-6 py-4">
                                                    <div className="h-4 bg-white/5 rounded-lg w-full" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <Database className="w-12 h-12 text-white/5 mx-auto mb-4" />
                                                <p className="text-white/20 font-black uppercase tracking-widest text-xs">No matching neural logs found</p>
                                            </td>
                                        </tr>
                                    ) : filteredLogs.map((log) => {
                                        const config = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.info;
                                        return (
                                            <tr key={log.id}
                                                onClick={() => setSelectedLog(log)}
                                                className={cn(
                                                    "group cursor-pointer transition-colors relative",
                                                    selectedLog?.id === log.id ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"
                                                )}>
                                                <td className="px-6 py-5">
                                                    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border", config.bg, config.color, "border-current/10")}>
                                                        <config.icon className="w-3 h-3" />
                                                        {log.level}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-[13px] font-bold text-white/70 line-clamp-1 group-hover:text-white transition-colors">{log.message}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-brand/40" />
                                                        {log.source}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-[11px] font-medium text-white/20 whitespace-nowrap">
                                                        {new Date(log.created_at).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <ChevronRight className={cn("w-4 h-4 transition-all", selectedLog?.id === log.id ? "text-red-brand translate-x-1" : "text-white/10 group-hover:text-white/40")} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-6 border-t border-white/[0.06] flex items-center justify-between">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                                Processing <span className="text-white/60">{logs.length}</span> of {count} events
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 0}
                                    onClick={() => setPage(p => p - 1)}
                                    className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed rounded-lg border border-white/5 transition-all">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    disabled={(page + 1) * limit >= count}
                                    onClick={() => setPage(p => p + 1)}
                                    className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed rounded-lg border border-white/5 transition-all">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inspect Drawer */}
                <div className="space-y-6 lg:sticky lg:top-10">
                    <AnimatePresence mode="wait">
                        {selectedLog ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                className={cn(BOX, "p-8 border-red-brand/20 bg-[#111116]")}
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-red-brand/10 rounded-xl">
                                            <Eye className="w-5 h-5 text-red-brand" />
                                        </div>
                                        <h3 className="text-lg font-black tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Trace Logic</h3>
                                    </div>
                                    <button onClick={() => setSelectedLog(null)} className="text-white/20 hover:text-white transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3">Neural Path</p>
                                        <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl font-mono text-xs text-red-400">
                                            {selectedLog.source}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3">Memory Content</p>
                                        <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[13px] leading-relaxed text-white/60 font-medium">
                                            {selectedLog.message}
                                        </div>
                                    </div>

                                    {selectedLog.context && Object.keys(selectedLog.context).length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3">Context Metadata</p>
                                            <pre className="p-5 bg-[#08080a] border border-white/[0.06] rounded-xl font-mono text-[10px] text-emerald-400 overflow-auto max-h-96 custom-scrollbar">
                                                {JSON.stringify(selectedLog.context, null, 2)}
                                            </pre>
                                        </div>
                                    )}

                                    <div className="pt-6 border-t border-white/[0.06]">
                                        <div className="flex items-center justify-between">
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Impact Level</p>
                                                <p className={cn("text-xs font-black uppercase tracking-widest", LEVEL_CONFIG[selectedLog.level]?.color)}>
                                                    {selectedLog.level}
                                                </p>
                                            </div>
                                            <div className="h-8 w-px bg-white/[0.06]" />
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Neural ID</p>
                                                <p className="text-[10px] font-mono text-white/40">
                                                    {selectedLog.id.slice(0, 8)}...
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className={cn(BOX, "p-20 text-center border-dashed border-white/10 bg-transparent flex flex-col items-center")}>
                                <div className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-3xl mb-6 group-hover:scale-110 transition-all">
                                    <Cpu className="w-10 h-10 text-white/10" />
                                </div>
                                <h4 className="text-white/20 text-xs font-black uppercase tracking-[0.3em] leading-relaxed">
                                    Select event <br /> for forensic <br /> inspection
                                </h4>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}
