"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2, MapPin, Phone, FileText, CheckCircle2,
    ArrowRight, ArrowLeft, Package, Loader2, Shield,
    Zap, Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { NIGERIAN_STATES } from "@/lib/pricing";
import { updateBusinessProfile } from "@/app/actions/dashboard";

/* ─── Types ─────────────────────────────────────────────────── */
interface KYCData {
    company_name:    string;
    contact_name:    string;
    phone:           string;
    state:           string;
    address:         string;
    business_type:   string;
    daily_volume:    string;
    cac_number:      string;
}

const BUSINESS_TYPES = [
    "E-commerce / Online Store",
    "Retail / Physical Store",
    "Manufacturer / Producer",
    "Importer / Exporter",
    "Logistics Aggregator",
    "Other",
];

const DAILY_VOLUMES = [
    "1–10 parcels/day",
    "11–50 parcels/day",
    "51–200 parcels/day",
    "200+ parcels/day",
];

const STEPS = [
    { id: 1, label: "Company Info",  icon: Building2 },
    { id: 2, label: "Location",      icon: MapPin },
    { id: 3, label: "Verification",  icon: Shield },
];

/* ─── Input Component ────────────────────────────────────────── */
const Field = ({ label, children, note }: { label: string; children: React.ReactNode; note?: string }) => (
    <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">{label}</label>
        {children}
        {note && <p className="text-[10px] text-white/20">{note}</p>}
    </div>
);

const inputCls = "w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white font-medium placeholder-white/20 outline-none focus:border-red-brand/40 focus:bg-white/[0.07] transition-all text-sm";
const selectCls = inputCls + " cursor-pointer";

/* ─── Main Page ──────────────────────────────────────────────── */
export default function OnboardingPage() {
    const router  = useRouter();
    const [step,  setStep]    = useState(1);
    const [data,  setData]    = useState<KYCData>({
        company_name: "", contact_name: "", phone: "",
        state: "", address: "", business_type: "",
        daily_volume: "", cac_number: "",
    });
    const [done,  setDone]    = useState(false);
    const [saving, startSave] = useTransition();
    const [error,  setError]  = useState<string | null>(null);

    const set = (k: keyof KYCData, v: string) => setData(d => ({ ...d, [k]: v }));

    const canNext = () => {
        if (step === 1) return data.company_name.trim() && data.contact_name.trim() && data.business_type;
        if (step === 2) return data.state && data.phone.trim() && data.address.trim();
        return true; // step 3 optional fields
    };

    const handleFinish = () => {
        setError(null);
        startSave(async () => {
            const res = await updateBusinessProfile({
                full_name:    data.contact_name,
                phone:        data.phone,
                state:        data.state,
                company_name: data.company_name,
            });
            if (!res.success) { setError(res.error ?? "Update failed"); return; }
            setDone(true);
            setTimeout(() => router.push("/dashboard"), 2800);
        });
    };

    /* ── Success Screen ── */
    if (done) {
        return (
            <div className="min-h-screen bg-[#0c0c10] flex items-center justify-center px-6">
                <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-sm">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="w-24 h-24 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        You&apos;re all set!
                    </h2>
                    <p className="text-white/40 text-sm mb-2">
                        {data.company_name} is now registered on PAN African Express.
                    </p>
                    <p className="text-white/20 text-xs">Taking you to your dashboard…</p>
                    <div className="mt-6 h-1 bg-white/5 rounded-full overflow-hidden max-w-[200px] mx-auto">
                        <motion.div className="h-full bg-red-brand rounded-full"
                            initial={{ width: 0 }} animate={{ width: "100%" }}
                            transition={{ duration: 2.8, ease: "linear" }} />
                    </div>
                </motion.div>
            </div>
        );
    }

    /* ── Wizard ── */
    return (
        <div className="min-h-screen bg-[#0c0c10] flex flex-col items-center justify-center px-5 py-12">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10">
                <div className="w-12 h-12 bg-red-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-brand/30">
                    <Package className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    Set Up Your Business Account
                </h1>
                <p className="text-white/30 text-sm mt-2">
                    Complete your profile to unlock bulk rates, wallet, and API access
                </p>
            </motion.div>

            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-10">
                {STEPS.map((s, i) => {
                    const state = step > s.id ? "done" : step === s.id ? "active" : "upcoming";
                    return (
                        <div key={s.id} className="flex items-center gap-3">
                            <div className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-xs font-bold",
                                state === "active"   && "bg-red-brand text-white shadow-lg shadow-red-brand/30",
                                state === "done"     && "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
                                state === "upcoming" && "bg-white/[0.04] text-white/25 border border-white/[0.06]",
                            )}>
                                {state === "done"
                                    ? <CheckCircle2 className="w-3.5 h-3.5" />
                                    : <s.icon className="w-3.5 h-3.5" />
                                }
                                <span className="hidden sm:block">{s.label}</span>
                            </div>
                            {i < STEPS.length - 1 && <div className="w-8 h-px bg-white/[0.08]" />}
                        </div>
                    );
                })}
            </div>

            {/* Card */}
            <div className="w-full max-w-lg bg-[#111118] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl shadow-black/60">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="p-8 space-y-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-red-brand/15 rounded-xl flex items-center justify-center">
                                    <Building2 className="w-4 h-4 text-red-brand" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Company Information</h2>
                                    <p className="text-white/25 text-xs">Tell us about your business</p>
                                </div>
                            </div>

                            <Field label="Registered Company Name">
                                <input value={data.company_name} onChange={e => set("company_name", e.target.value)}
                                    placeholder="Emeka Ventures Ltd" className={inputCls} />
                            </Field>

                            <Field label="Contact Person's Full Name">
                                <input value={data.contact_name} onChange={e => set("contact_name", e.target.value)}
                                    placeholder="Emeka Okafor" className={inputCls} />
                            </Field>

                            <Field label="Business Type">
                                <select value={data.business_type} onChange={e => set("business_type", e.target.value)} className={selectCls}>
                                    <option value="" disabled>Select your business type…</option>
                                    {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </Field>

                            <Field label="Average Daily Shipping Volume">
                                <div className="grid grid-cols-2 gap-2">
                                    {DAILY_VOLUMES.map(v => (
                                        <button key={v} type="button" onClick={() => set("daily_volume", v)}
                                            className={cn(
                                                "py-2.5 px-3 rounded-xl border text-[11px] font-bold text-left transition-all",
                                                data.daily_volume === v
                                                    ? "bg-red-brand/15 border-red-brand/40 text-red-400"
                                                    : "bg-white/[0.03] border-white/[0.08] text-white/30 hover:text-white/60 hover:border-white/20"
                                            )}>
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </Field>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="p-8 space-y-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-blue-500/15 rounded-xl flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Business Location</h2>
                                    <p className="text-white/25 text-xs">Where are your operations based?</p>
                                </div>
                            </div>

                            <Field label="Primary Business State">
                                <select value={data.state} onChange={e => set("state", e.target.value)} className={selectCls}>
                                    <option value="" disabled>Select state…</option>
                                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </Field>

                            <Field label="Business Address">
                                <textarea value={data.address} onChange={e => set("address", e.target.value)}
                                    rows={3} placeholder="14 Adeola Odeku St, Victoria Island, Lagos"
                                    className={inputCls + " resize-none"} />
                            </Field>

                            <Field label="Business Phone Number" note="We'll send shipment alerts to this number via SMS">
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                    <input value={data.phone} onChange={e => set("phone", e.target.value)}
                                        placeholder="+234 800 000 0000" className={inputCls + " pl-11"} />
                                </div>
                            </Field>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="p-8 space-y-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-purple-500/15 rounded-xl flex items-center justify-center">
                                    <Shield className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Business Verification</h2>
                                    <p className="text-white/25 text-xs">Optional — speeds up high-volume approvals</p>
                                </div>
                            </div>

                            <Field label="CAC Registration Number" note="e.g. RC-1234567 — Leave blank to skip for now">
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                    <input value={data.cac_number} onChange={e => set("cac_number", e.target.value)}
                                        placeholder="RC-1234567 (optional)" className={inputCls + " pl-11"} />
                                </div>
                            </Field>

                            {/* What you unlock */}
                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 space-y-3 mt-2">
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">What you unlock after setup</p>
                                {[
                                    { icon: Zap,      label: "Instant Wallet Top-up via Paystack" },
                                    { icon: Package,  label: "Bulk shipping at discounted rates" },
                                    { icon: Users,    label: "Analytics dashboard & shipment reports" },
                                    { icon: FileText, label: "API keys for direct integration" },
                                ].map(f => (
                                    <div key={f.label} className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-red-brand/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <f.icon className="w-3.5 h-3.5 text-red-brand" />
                                        </div>
                                        <span className="text-white/50 text-xs font-medium">{f.label}</span>
                                    </div>
                                ))}
                            </div>

                            {error && (
                                <p className="text-red-400 text-xs font-semibold text-center">{error}</p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer nav */}
                <div className="px-8 pb-8 flex items-center justify-between">
                    {step > 1 ? (
                        <button onClick={() => setStep(s => s - 1)}
                            className="flex items-center gap-2 text-white/30 hover:text-white text-sm font-bold transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    ) : <div />}

                    {step < 3 ? (
                        <button
                            disabled={!canNext()}
                            onClick={() => setStep(s => s + 1)}
                            className="flex items-center gap-2 bg-red-brand hover:bg-red-dark disabled:opacity-30 disabled:cursor-not-allowed text-white px-8 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-brand/25">
                            Continue <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            disabled={saving}
                            onClick={handleFinish}
                            className="flex items-center gap-2 bg-red-brand hover:bg-red-dark disabled:opacity-50 text-white px-8 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-brand/25">
                            {saving
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                                : <><CheckCircle2 className="w-4 h-4" /> Complete Setup</>
                            }
                        </button>
                    )}
                </div>
            </div>

            {/* Skip link */}
            <button onClick={() => router.push("/dashboard")}
                className="mt-6 text-white/15 hover:text-white/35 text-xs font-semibold transition-colors">
                Skip for now — I&apos;ll complete this later
            </button>
        </div>
    );
}
