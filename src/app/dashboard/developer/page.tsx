"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Code2, Key, Terminal, Globe, Plus, Trash2,
    Copy, Check, Eye, EyeOff, BookOpen, Cpu,
    ChevronRight, Zap, Shield, AlertCircle
} from "lucide-react";
import { getApiKeys, createApiKey, deleteApiKey, getWebhooks, createWebhook } from "@/app/actions/developer";
import { cn } from "@/lib/utils";

const BOX = "bg-[#111116] border border-white/[0.06] rounded-[2rem] overflow-hidden";
const CODE_BG = "bg-black/40 border border-white/[0.05] rounded-xl p-4 font-mono text-[11px] text-blue-400 group overflow-x-auto";

export default function DeveloperPage() {
    const [keys, setKeys] = useState<any[]>([]);
    const [webhooks, setWebhooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // UI States
    const [revealId, setRevealId] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [isGenerating, startGenerate] = useTransition();
    const [newSecret, setNewSecret] = useState<{ key: string; name: string } | null>(null);

    // Webhook Form
    const [webhookUrl, setWebhookUrl] = useState("");

    const loadData = async () => {
        setLoading(true);
        const [k, w] = await Promise.all([getApiKeys(), getWebhooks()]);
        setKeys(k);
        setWebhooks(w);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleCopy = (txt: string, id: string) => {
        navigator.clipboard.writeText(txt);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleGenerate = () => {
        const name = prompt("Enter a name for this API key:");
        if (!name) return;
        startGenerate(async () => {
            const res = await createApiKey(name);
            if (res.secret) {
                setNewSecret({ key: res.secret, name });
                loadData();
            }
        });
    };

    return (
        <div className="p-8 lg:p-12 space-y-12 min-h-screen bg-[#0c0c10]">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">API Version 1.0 Live</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Developer <span className="text-blue-500">Infrastructure</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white/60 hover:text-white text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Documentation
                    </button>
                    <button onClick={handleGenerate}
                        className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2">
                        {isGenerating ? "Generating..." : <><Plus className="w-4 h-4" /> Generate API Key</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

                {/* API Keys Column */}
                <div className="xl:col-span-2 space-y-8">
                    <div className={BOX}>
                        <div className="px-8 py-6 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
                            <div className="flex items-center gap-4">
                                <Key className="w-5 h-5 text-blue-400" />
                                <h2 className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Secret API Keys</h2>
                            </div>
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Active Keys: {keys.length}</span>
                        </div>

                        <div className="p-2 divide-y divide-white/[0.04]">
                            {loading ? (
                                <div className="p-10 text-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                            ) : keys.length === 0 ? (
                                <div className="p-20 text-center">
                                    <Shield className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                    <p className="text-white/30 text-xs font-black uppercase tracking-widest">No API Keys Generated</p>
                                </div>
                            ) : keys.map((k) => (
                                <div key={k.id} className="p-6 group hover:bg-white/[0.02] transition-colors rounded-2xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <p className="text-sm font-black text-white">{k.key_name}</p>
                                            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest">Live</span>
                                        </div>
                                        <button onClick={async () => { if (confirm("Delete this key?")) { await deleteApiKey(k.id); loadData(); } }}
                                            className="text-white/20 hover:text-red-400 transition-colors p-2">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="relative group/key">
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1.5 px-1">Public Key</p>
                                            <div className="bg-black/40 border border-white/[0.05] rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                                                <code className="text-[11px] text-blue-400 font-mono truncate">{k.public_key}</code>
                                                <button onClick={() => handleCopy(k.public_key, k.id + '_pub')} className="text-white/30 hover:text-white shrink-0">
                                                    {copied === k.id + '_pub' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Webhooks Section */}
                    <div className={BOX}>
                        <div className="px-8 py-6 border-b border-white/[0.06] bg-white/[0.01]">
                            <div className="flex items-center gap-4">
                                <Globe className="w-5 h-5 text-emerald-400" />
                                <h2 className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Webhook Endpoints</h2>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex gap-4">
                                <input type="text" placeholder="https://your-api.com/webhooks/pax" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
                                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-emerald-500/40 transition-all font-mono" />
                                <button onClick={async () => { await createWebhook(webhookUrl); setWebhookUrl(""); loadData(); }}
                                    className="px-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all">Add Endpoint</button>
                            </div>
                            <div className="space-y-4 pt-4">
                                {webhooks.map(w => (
                                    <div key={w.id} className="p-5 rounded-2xl border border-white/[0.05] bg-white/[0.02] flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <code className="text-xs text-white/80 font-mono">{w.url}</code>
                                        </div>
                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Active</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Documentation & Quickstart */}
                <div className="space-y-8">
                    <div className={cn(BOX, "p-8 bg-gradient-to-br from-[#111116] to-[#1a1a2e]")}>
                        <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Quickstart Guide
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3">1. Track Shipment</p>
                                <div className={CODE_BG}>
                                    curl https://api.pax.africa/v1/track \ <br />
                                    -H "Authorization: Bearer YOUR_SK" \ <br />
                                    -d "id=PAX-738291"
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3">2. Create Booking</p>
                                <div className={CODE_BG}>
                                    curl -X POST https://api.pax.africa/v1/bookings \ <br />
                                    -H "Content-Type: application/json" \ <br />
                                    {`-d '{"recipient": "John Doe", ...}'`}
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-white/[0.06]">
                            <button className="w-full flex items-center justify-between text-blue-400 hover:text-blue-300 transition-colors group">
                                <span className="text-[10px] font-black uppercase tracking-widest">Full API Reference</span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <div className={cn(BOX, "p-8 border-blue-500/20 bg-blue-500/5")}>
                        <div className="flex items-center gap-3 mb-4">
                            <Zap className="w-5 h-5 text-blue-400" />
                            <h4 className="text-white font-bold text-sm tracking-tight">E-commerce Plugins</h4>
                        </div>
                        <p className="text-xs text-white/40 leading-relaxed mb-6 font-medium">Ready to deploy. Download our official SDKs and plugins for rapid integration.</p>
                        <div className="grid grid-cols-2 gap-3">
                            {["Shopify", "WooCommerce", "Magento", "PrestaShop"].map(p => (
                                <div key={p} className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[10px] font-black text-white/60 text-center uppercase tracking-widest">
                                    {p}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Secret Key reveal Modal */}
            <AnimatePresence>
                {newSecret && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl" onClick={() => setNewSecret(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none">
                            <div className="bg-[#111116] border border-blue-500/30 rounded-[2.5rem] p-12 w-full max-w-xl pointer-events-auto shadow-2xl relative">
                                <div className="text-center mb-10">
                                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                                        <Key className="w-10 h-10 text-blue-500" />
                                    </div>
                                    <h2 className="text-3xl font-black text-white tracking-tight mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Save your Secret Key</h2>
                                    <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">This key will only be shown once. If you lose it, you will need to regenerate a new one.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="group/secret relative">
                                        <div className="bg-black/80 border border-blue-500/40 rounded-3xl p-6 flex items-center justify-between gap-6 group">
                                            <code className="text-lg text-blue-400 font-mono tracking-tighter truncate">{newSecret.key}</code>
                                            <button onClick={() => handleCopy(newSecret.key, 'new_secret')} className="shrink-0 p-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/20">
                                                {copied === 'new_secret' ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6 mt-10 flex gap-4">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-[11px] text-red-200/50 leading-relaxed font-medium">Never share your secret key or commit it to version control. PAX Cloud will never ask for your secret key.</p>
                                </div>

                                <button onClick={() => setNewSecret(null)} className="w-full mt-10 py-5 rounded-[2rem] bg-white text-black font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-3 active:scale-95">
                                    I've Saved My Key
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
}
