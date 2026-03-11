"use client";

import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { User, Phone, MapPin, Building2, Key, Copy, RefreshCw, CheckCircle2, Shield } from "lucide-react";
import { updateBusinessProfile } from "@/app/actions/dashboard";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { NIGERIAN_STATES } from "@/lib/pricing";

export default function SettingsPage() {
    const [form,      setForm]      = useState({ full_name: "", phone: "", state: "", company_name: "" });
    const [email,     setEmail]     = useState("");
    const [saved,     setSaved]     = useState(false);
    const [error,     setError]     = useState<string | null>(null);
    const [isPending, start]        = useTransition();
    const [apiKey,    setApiKey]    = useState("pax_live_sk_••••••••••••••••••••••••••••••••");
    const [copied,    setCopied]    = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data }) => {
            if (!data.user) return;
            setEmail(data.user.email ?? "");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: profile } = await (supabase as any)
                .from("profiles").select("*").eq("id", data.user.id).single() as {
                    data: { full_name: string | null; phone: string | null; state: string | null } | null
                };
            if (profile) {
                setForm({
                    full_name:    profile.full_name ?? "",
                    phone:        profile.phone     ?? "",
                    state:        profile.state     ?? "",
                    company_name: "",
                });
            }
        });
    }, []);

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        start(async () => {
            const res = await updateBusinessProfile(form);
            if (!res.success) { setError(res.error); return; }
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(apiKey.replace(/•/g, "x"));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRegenerate = () => {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        const key = "pax_live_sk_" + Array.from({ length: 32 }).map(() => chars[Math.floor(Math.random() * chars.length)]).join("");
        setApiKey(key);
    };

    const inputCls = "w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white font-medium placeholder-white/20 outline-none focus:border-red-brand/40 focus:bg-white/[0.07] transition-all text-sm";
    const labelCls = "text-white/35 text-xs font-bold uppercase tracking-widest block mb-2";
    const BOX      = "bg-[#16161e] border border-white/[0.08] rounded-2xl overflow-hidden";

    return (
        <div className="p-5 lg:p-6 space-y-4">

            {/* ── Header box ──────────────────────────────────────────── */}
            <div className={BOX}>
                <div className="p-5">
                    <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Settings</h1>
                    <p className="text-white/30 text-sm mt-0.5">Manage your business profile and API access</p>
                </div>
            </div>

            {/* ── Business Profile box ───────────────────────────────── */}
            <div className={BOX}>
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07]">
                    <div className="w-9 h-9 bg-blue-500/15 rounded-xl flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 rounded-full bg-blue-500" />
                        <div>
                            <p className="text-white font-bold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Business Profile</p>
                            <p className="text-white/30 text-xs">Update your contact and company details</p>
                        </div>
                    </div>
                </div>
                <div className="p-5">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                    <input type="text" placeholder="Emeka Okafor" value={form.full_name} onChange={set("full_name")} className={cn(inputCls, "pl-10")} />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Company Name</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                    <input type="text" placeholder="Dangote Retail Ltd" value={form.company_name} onChange={set("company_name")} className={cn(inputCls, "pl-10")} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                    <input type="tel" placeholder="+234 800 000 0000" value={form.phone} onChange={set("phone")} className={cn(inputCls, "pl-10")} />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>State</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                    <select value={form.state} onChange={set("state")} className={cn(inputCls, "pl-10")}>
                                        <option value="">Select state</option>
                                        {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>Email Address</label>
                            <input type="email" value={email} disabled className={cn(inputCls, "opacity-40 cursor-not-allowed")} />
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                <div className="w-3.5 h-3.5 rounded-full bg-red-500 flex-shrink-0" />
                                <p className="text-red-400 text-sm font-semibold">{error}</p>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <button type="submit" disabled={isPending}
                                className="flex items-center gap-2 bg-red-brand hover:bg-red-dark disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-brand/20">
                                {isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                                Save Changes
                            </button>
                            {saved && (
                                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                                    <CheckCircle2 className="w-4 h-4" /> Saved!
                                </motion.div>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* ── API Keys box ────────────────────────────────────────── */}
            <div className={BOX}>
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07]">
                    <div className="w-1.5 h-5 rounded-full bg-purple-500" />
                    <div className="w-8 h-8 bg-purple-500/15 rounded-xl flex items-center justify-center">
                        <Key className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>API Access</p>
                        <p className="text-white/30 text-xs">Integrate PAX shipping into your systems</p>
                    </div>
                </div>
                <div className="p-5">
                    <label className={labelCls}>Live Secret Key</label>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 font-mono text-xs text-white/50 truncate">
                            {apiKey}
                        </div>
                        <button onClick={handleCopy}
                            className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/60 hover:text-white px-4 py-3 rounded-xl text-xs font-bold transition-all flex-shrink-0">
                            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? "Copied" : "Copy"}
                        </button>
                        <button onClick={handleRegenerate}
                            className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/60 hover:text-white px-4 py-3 rounded-xl text-xs font-bold transition-all flex-shrink-0">
                            <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-white/25 text-xs">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Never share your secret key publicly. Rotate immediately if compromised.</span>
                    </div>
                </div>
            </div>

            {/* ── Danger zone box ─────────────────────────────────────── */}
            <div className="bg-red-500/5 border border-red-500/15 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-red-500/10">
                    <div className="w-1.5 h-5 rounded-full bg-red-500" />
                    <p className="text-red-400 font-bold text-sm">Danger Zone</p>
                </div>
                <div className="p-5">
                    <p className="text-white/25 text-xs mb-4">These actions are irreversible. Proceed with caution.</p>
                    <button className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors">
                        Close Business Account
                    </button>
                </div>
            </div>

        </div>
    );
}
