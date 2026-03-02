"use client";

import { useEffect, useState } from "react";
import { Search, Mail, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminContactsPage() {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = async () => {
        setLoading(true);
        const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
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
        await supabase.from("contact_messages").delete().eq("id", id);
        setRows(prev => prev.filter(r => r.id !== id));
    };

    return (
        <div className="p-6 lg:p-10 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-ink-900" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Contact Messages</h1>
                    <p className="text-ink-400 text-sm mt-1">{rows.length} messages received</p>
                </div>
                <button onClick={load} className="flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-red-brand transition-colors">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                <input type="text" placeholder="Search messages…" value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white border border-surface-200 rounded-xl pl-11 pr-4 py-3 text-sm text-ink-900 font-medium placeholder-ink-300 outline-none focus:border-red-brand/40 transition-all" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <div key={i} className="card p-6 space-y-3"><div className="skeleton h-4 w-32 rounded" /><div className="skeleton h-3 w-44 rounded" /><div className="skeleton h-12 rounded" /></div>)
                ) : filtered.length === 0 ? (
                    <div className="col-span-full card p-12 text-center">
                        <Mail className="w-10 h-10 text-ink-200 mx-auto mb-4" />
                        <p className="text-ink-400 text-sm">No messages yet.</p>
                    </div>
                ) : filtered.map(c => (
                    <div key={c.id} className="card p-6 relative group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-brand/10 border border-red-brand/20 flex items-center justify-center font-bold text-red-brand text-sm">
                                    {c.full_name?.[0]?.toUpperCase() ?? "?"}
                                </div>
                                <div>
                                    <p className="font-bold text-ink-900 text-sm">{c.full_name}</p>
                                    <p className="text-ink-400 text-xs">{c.email}</p>
                                </div>
                            </div>
                            <button onClick={() => del(c.id)} className="text-ink-200 hover:text-red-brand transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        {c.state && <p className="text-[10px] text-red-brand font-bold uppercase tracking-widest mb-3">📍 {c.state}</p>}
                        {c.service && <p className="text-[10px] text-ink-400 font-bold uppercase tracking-widest mb-2">{c.service}</p>}
                        {c.message && <p className="text-ink-500 text-sm leading-relaxed line-clamp-4">{c.message}</p>}
                        <p className="text-ink-200 text-[10px] mt-4 font-semibold">
                            {new Date(c.created_at).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
