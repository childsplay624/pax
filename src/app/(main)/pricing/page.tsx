"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Calculator, Truck, Zap, Clock, CheckCircle2, Package } from "lucide-react";
import Link from "next/link";
import { NIGERIAN_STATES, calculatePrice } from "@/lib/pricing";
import { supabase } from "@/lib/supabase";


const SERVICE_TYPES = [
    { id: "standard" as const, label: "Standard", icon: Truck, desc: "2–4 business days", color: "border-surface-200 hover:border-red-brand/30" },
    { id: "express" as const, label: "Express", icon: Zap, desc: "Next business day", color: "border-surface-200 hover:border-red-brand/30" },
    { id: "same_day" as const, label: "Same Day", icon: Clock, desc: "Intrastate only", color: "border-surface-200 hover:border-red-brand/30" },
];

function fmt(n: number) { return "₦" + n.toLocaleString("en-NG"); }

export default function PricingPage() {
    const [origin, setOrigin] = useState("Lagos");
    const [dest, setDest] = useState("Abuja (FCT)");
    const [weight, setWeight] = useState(1);
    const [service, setService] = useState<"standard" | "express" | "same_day">("standard");
    const [calc, setCalc] = useState(false);
    const [accountType, setAccountType] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setAccountType(data.user?.user_metadata?.account_type ?? null);
        });
    }, []);

    const price = useMemo(() =>
        calc ? calculatePrice(origin, dest, weight, service) : null,
        [calc, origin, dest, weight, service]
    );

    const handleCalc = () => setCalc(true);
    const handleChange = () => setCalc(false);

    return (
        <div className="bg-surface-0 pt-32 pb-24 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(220,38,38,0.05),transparent)] pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">

                {/* ── Header ── */}
                <div className="text-center mb-20">
                    <span className="text-red-brand text-[11px] font-bold uppercase tracking-[0.35em] block mb-4">Transparent Pricing</span>
                    <h1 className="text-5xl md:text-8xl font-bold text-ink-900 tracking-tight mb-6 leading-none" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Know Your Cost<br /><span className="gradient-text-red">Before You Ship.</span>
                    </h1>
                    <p className="text-ink-400 text-xl max-w-2xl mx-auto">No hidden fees. No surprises. Just clear, state-based pricing across Nigeria.</p>
                </div>

                {/* ── Calculator card ── */}
                <div className="max-w-3xl mx-auto">
                    <div className="card p-10 relative">
                        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-3xl bg-gradient-to-r from-transparent via-red-brand to-transparent" />

                        <div className="flex items-center gap-3 mb-10">
                            <div className="p-3 bg-red-brand/8 rounded-2xl"><Calculator className="w-6 h-6 text-red-brand" /></div>
                            <div>
                                <h2 className="font-bold text-ink-900 text-xl" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Rate Calculator</h2>
                                <p className="text-ink-400 text-sm">Instant quote for any Nigeria route</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Origin & Destination */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {[
                                    { label: "Origin State", val: origin, set: (v: string) => { setOrigin(v); handleChange(); } },
                                    { label: "Destination State", val: dest, set: (v: string) => { setDest(v); handleChange(); } },
                                ].map(({ label, val, set }) => (
                                    <div key={label} className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-ink-400">{label}</label>
                                        <select value={val} onChange={e => set(e.target.value)}
                                            className="w-full bg-surface-50 border border-surface-200 rounded-xl px-5 py-4 text-ink-900 font-semibold outline-none focus:border-red-brand/40 transition-all appearance-none">
                                            {NIGERIAN_STATES.sort().map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            {/* Weight slider */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <label className="text-xs font-bold uppercase tracking-widest text-ink-400">Parcel Weight</label>
                                    <span className="text-red-brand font-bold text-sm">{weight} kg</span>
                                </div>
                                <input type="range" min={0.5} max={30} step={0.5} value={weight}
                                    onChange={e => { setWeight(Number(e.target.value)); handleChange(); }}
                                    className="w-full accent-red-brand h-2 rounded-full cursor-pointer" />
                                <div className="flex justify-between text-[10px] text-ink-300 font-semibold">
                                    <span>0.5 kg</span><span>30 kg</span>
                                </div>
                            </div>

                            {/* Service type */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-ink-400">Service Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {SERVICE_TYPES.map(s => (
                                        <button key={s.id} type="button"
                                            onClick={() => { setService(s.id); handleChange(); }}
                                            className={`p-4 rounded-2xl border-2 text-center transition-all ${service === s.id ? "border-red-brand bg-red-brand/5 shadow-md shadow-red-brand/10" : s.color}`}>
                                            <s.icon className={`w-5 h-5 mx-auto mb-2 ${service === s.id ? "text-red-brand" : "text-ink-400"}`} />
                                            <p className={`font-bold text-sm ${service === s.id ? "text-red-brand" : "text-ink-700"}`}>{s.label}</p>
                                            <p className="text-[10px] text-ink-400 mt-0.5">{s.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={handleCalc}
                                className="w-full btn-magnetic bg-red-brand hover:bg-red-dark text-white py-5 rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-red-brand/20 flex items-center justify-center gap-2">
                                <Calculator className="w-5 h-5" /> Calculate Price
                            </button>
                        </div>

                        {/* ── Result ── */}
                        <AnimatePresence>
                            {price && (
                                <motion.div initial={{ opacity: 0, y: 16, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
                                    exit={{ opacity: 0, y: -8, height: 0 }} transition={{ duration: 0.45 }}
                                    className="mt-8 pt-8 border-t border-surface-200 space-y-5">

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-ink-400 text-sm mb-1">{origin} → {dest}</p>
                                            <p className="text-5xl font-bold text-ink-900" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                                {fmt(price.total)}
                                            </p>
                                            <p className="text-ink-400 text-sm mt-1">ETA: <span className="font-bold text-ink-700">{price.eta}</span></p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            <span className="text-emerald-700 text-sm font-bold">Fully Insured</span>
                                        </div>
                                    </div>

                                    <div className="bg-surface-50 border border-surface-200 rounded-2xl p-5 space-y-3">
                                        <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-4">Price Breakdown</p>
                                        {[
                                            { label: "Base rate (1st kg)", val: fmt(price.base) },
                                            { label: `Extra weight (${Math.max(0, weight - 1).toFixed(1)} kg × ₦500)`, val: fmt(price.weight) },
                                            { label: `${service === "express" ? "Express" : service === "same_day" ? "Same-Day" : "Standard"} service fee`, val: fmt(price.service) },
                                        ].map(row => (
                                            <div key={row.label} className="flex justify-between text-sm">
                                                <span className="text-ink-500">{row.label}</span>
                                                <span className="font-semibold text-ink-900">{row.val}</span>
                                            </div>
                                        ))}
                                        <div className="border-t border-surface-200 pt-3 flex justify-between font-bold">
                                            <span className="text-ink-900">Total</span>
                                            <span className="text-red-brand text-lg">{fmt(price.total)}</span>
                                        </div>
                                    </div>

                                    <Link href={`${accountType === "business" ? "/dashboard/book" : "/book"}?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(dest)}&service=${service}&weight=${weight}`}
                                        className="w-full btn-magnetic bg-ink-900 hover:bg-ink-800 text-white py-4 rounded-2xl font-bold text-base transition-colors flex items-center justify-center gap-2">
                                        Book This Shipment <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── Zone guide ── */}
                <div className="mt-24">
                    <h2 className="text-center text-3xl font-bold text-ink-900 mb-12" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Base Rate Guide</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { label: "Same State", price: "From ₦1,200", desc: "Intrastate delivery", icon: "🏙️" },
                            { label: "Same Zone", price: "From ₦2,500", desc: "Southwest, Southeast, Northcentral, etc.", icon: "🗺️" },
                            { label: "Adjacent Zone", price: "From ₦3,500", desc: "Cross-zone e.g. Lagos (SW) → PH (SS)", icon: "🔄" },
                            { label: "2 Zones Apart", price: "From ₦4,500", desc: "E.g. Lagos (SW) → Abuja (NC)", icon: "📦" },
                            { label: "3 Zones Apart", price: "From ₦5,500", desc: "E.g. Lagos (SW) → Maiduguri (NE)", icon: "🚚" },
                            { label: "Weight Surcharge", price: "₦500 / kg", desc: "Per extra kg above the first kilogram", icon: "⚖️" },
                        ].map((r, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                                className="card p-6">
                                <span className="text-3xl mb-4 block">{r.icon}</span>
                                <h4 className="font-bold text-ink-900 mb-1">{r.label}</h4>
                                <p className="text-red-brand font-bold text-xl mb-2">{r.price}</p>
                                <p className="text-ink-400 text-sm">{r.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
