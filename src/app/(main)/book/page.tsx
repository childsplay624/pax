"use client";

import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2, Package, MapPin, User, Scale, Clipboard } from "lucide-react";
import { createShipment } from "@/app/actions/bookings";
import { NIGERIAN_STATES } from "@/lib/pricing";

import Link from "next/link";

const STEPS = [
    { id: 1, label: "Route", icon: MapPin },
    { id: 2, label: "Sender", icon: User },
    { id: 3, label: "Recipient", icon: User },
    { id: 4, label: "Parcel", icon: Scale },
    { id: 5, label: "Confirm", icon: Clipboard },
];

const inputCls = "w-full bg-surface-50 border border-surface-200 rounded-xl px-5 py-4 text-ink-900 font-medium placeholder-ink-300 outline-none focus:border-red-brand/40 focus:ring-2 focus:ring-red-brand/8 transition-all";
const selectCls = `${inputCls} appearance-none`;
const labelCls = "text-xs font-bold uppercase tracking-widest text-ink-400 block mb-2";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <div><label className={labelCls}>{label}</label>{children}</div>;
}

function BookingContent() {
    const params = useSearchParams();
    const nav = useRouter();

    const [step, setStep] = useState(1);
    const [isPending, start] = useTransition();
    const [trackingId, setTrackingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        // Route
        origin_city: params.get("from") ?? "Lagos",
        destination_city: params.get("to") ?? "Abuja (FCT)",
        sender_state: params.get("from") ?? "Lagos",
        recipient_state: params.get("to") ?? "Abuja (FCT)",
        service_type: (params.get("service") ?? "standard") as "standard" | "express" | "same_day",
        // Sender
        sender_name: "", sender_phone: "", sender_address: "",
        // Recipient
        recipient_name: "", recipient_phone: "", recipient_address: "",
        // Parcel
        weight_kg: Number(params.get("weight") ?? 1),
        declared_value: 0,
        special_instructions: "",
    });

    const set = (key: string, val: string | number) =>
        setForm(prev => ({ ...prev, [key]: val }));

    const next = () => setStep(s => Math.min(s + 1, 5));
    const back = () => setStep(s => Math.max(s - 1, 1));

    const handleSubmit = () => {
        start(async () => {
            const { tracking_id, error } = await createShipment({
                ...form,
                weight_kg: Number(form.weight_kg),
                declared_value: Number(form.declared_value),
            });
            if (error) { alert(error); return; }
            setTrackingId(tracking_id);
        });
    };

    /* ── Success state ── */
    if (trackingId) return (
        <div className="min-h-screen bg-surface-50 pt-32 pb-24 flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg w-full card p-12 text-center relative">
                <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-3xl bg-gradient-to-r from-transparent via-red-brand to-transparent" />
                <div className="w-24 h-24 bg-red-brand/10 border border-red-brand/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-red-brand" />
                </div>
                <h2 className="text-4xl font-bold text-ink-900 mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Booked!</h2>
                <p className="text-ink-400 mb-6">Your shipment has been confirmed. Save your tracking ID:</p>
                <div className="bg-ink-900 rounded-2xl px-8 py-5 mb-8">
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Tracking ID</p>
                    <p className="text-3xl font-bold text-white font-mono tracking-wider">{trackingId}</p>
                </div>
                <div className="flex gap-3">
                    <Link href={`/tracking?id=${trackingId}`}
                        className="flex-1 bg-red-brand hover:bg-red-dark text-white py-4 rounded-2xl font-bold text-center transition-colors">
                        Track Shipment
                    </Link>
                    <button onClick={() => { setTrackingId(null); setStep(1); setForm(f => ({ ...f, sender_name: "", sender_phone: "", sender_address: "", recipient_name: "", recipient_phone: "", recipient_address: "", declared_value: 0, special_instructions: "" })); }}
                        className="flex-1 bg-surface-50 border border-surface-200 text-ink-700 py-4 rounded-2xl font-bold hover:bg-surface-100 transition-colors">
                        Book Another
                    </button>
                </div>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-surface-50 pt-32 pb-24">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(220,38,38,0.05),transparent)] pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto px-6 lg:px-12">

                {/* Header */}
                <div className="text-center mb-12">
                    <span className="text-red-brand text-[11px] font-bold uppercase tracking-[0.35em] block mb-4">Ship Now</span>
                    <h1 className="text-5xl md:text-7xl font-bold text-ink-900 tracking-tight mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Book a <span className="gradient-text-red">Shipment</span>
                    </h1>
                    <p className="text-ink-400">Fill in the details and we'll handle everything.</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-10">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-2">
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                ${step === s.id ? "bg-red-brand text-white shadow-md shadow-red-brand/30" :
                                    step > s.id ? "bg-red-brand/15 text-red-brand" : "bg-surface-200 text-ink-400"}`}>
                                {step > s.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                                <span className="hidden sm:block">{s.label}</span>
                            </div>
                            {i < STEPS.length - 1 && <div className={`h-px w-4 lg:w-8 ${step > s.id ? "bg-red-brand/40" : "bg-surface-200"}`} />}
                        </div>
                    ))}
                </div>

                {/* Card */}
                <div className="card p-8 md:p-10 relative">
                    <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-3xl bg-gradient-to-r from-transparent via-red-brand to-transparent" />

                    <AnimatePresence mode="wait">
                        {/* ── Step 1: Route ── */}
                        {step === 1 && (
                            <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                <h2 className="text-2xl font-bold text-ink-900 mb-6" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Route Details</h2>
                                <div className="grid grid-cols-2 gap-5">
                                    <Field label="Origin State">
                                        <select value={form.sender_state} onChange={e => { set("sender_state", e.target.value); set("origin_city", e.target.value); }} className={selectCls}>
                                            {NIGERIAN_STATES.sort().map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Destination State">
                                        <select value={form.recipient_state} onChange={e => { set("recipient_state", e.target.value); set("destination_city", e.target.value); }} className={selectCls}>
                                            {NIGERIAN_STATES.sort().map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </Field>
                                </div>
                                <Field label="Service Type">
                                    <div className="grid grid-cols-3 gap-3">
                                        {(["standard", "express", "same_day"] as const).map(s => (
                                            <button key={s} type="button" onClick={() => set("service_type", s)}
                                                className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${form.service_type === s ? "border-red-brand bg-red-brand/5 text-red-brand" : "border-surface-200 text-ink-500 hover:border-red-brand/30"}`}>
                                                {s === "same_day" ? "Same Day" : s.charAt(0).toUpperCase() + s.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </Field>
                            </motion.div>
                        )}

                        {/* ── Step 2: Sender ── */}
                        {step === 2 && (
                            <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                <h2 className="text-2xl font-bold text-ink-900 mb-6" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Sender Details</h2>
                                <Field label="Full Name"><input value={form.sender_name} onChange={e => set("sender_name", e.target.value)} placeholder="Emeka Okafor" className={inputCls} /></Field>
                                <Field label="Phone Number"><input value={form.sender_phone} onChange={e => set("sender_phone", e.target.value)} placeholder="+234 800 000 0000" className={inputCls} /></Field>
                                <Field label="Pickup Address"><input value={form.sender_address} onChange={e => set("sender_address", e.target.value)} placeholder="14 Adeola Odeku St, Victoria Island" className={inputCls} /></Field>
                            </motion.div>
                        )}

                        {/* ── Step 3: Recipient ── */}
                        {step === 3 && (
                            <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                <h2 className="text-2xl font-bold text-ink-900 mb-6" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Recipient Details</h2>
                                <Field label="Full Name"><input value={form.recipient_name} onChange={e => set("recipient_name", e.target.value)} placeholder="Amaka Williams" className={inputCls} /></Field>
                                <Field label="Phone Number"><input value={form.recipient_phone} onChange={e => set("recipient_phone", e.target.value)} placeholder="+234 800 000 0000" className={inputCls} /></Field>
                                <Field label="Delivery Address"><input value={form.recipient_address} onChange={e => set("recipient_address", e.target.value)} placeholder="22 Maitama Close, Garki, Abuja" className={inputCls} /></Field>
                            </motion.div>
                        )}

                        {/* ── Step 4: Parcel ── */}
                        {step === 4 && (
                            <motion.div key="4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                <h2 className="text-2xl font-bold text-ink-900 mb-6" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Parcel Information</h2>
                                <div className="grid grid-cols-2 gap-5">
                                    <Field label="Weight (kg)">
                                        <input type="number" min={0.1} max={50} step={0.1} value={form.weight_kg} onChange={e => set("weight_kg", e.target.value)} className={inputCls} />
                                    </Field>
                                    <Field label="Declared Value (₦)">
                                        <input type="number" min={0} value={form.declared_value} onChange={e => set("declared_value", e.target.value)} placeholder="e.g. 25000" className={inputCls} />
                                    </Field>
                                </div>
                                <Field label="Special Instructions (optional)">
                                    <textarea value={form.special_instructions} onChange={e => set("special_instructions", e.target.value)}
                                        placeholder="Fragile, handle with care…" rows={3} className={`${inputCls} resize-none`} />
                                </Field>
                                <div className="bg-red-brand/5 border border-red-brand/15 rounded-2xl px-5 py-4 flex items-center gap-3">
                                    <Package className="w-5 h-5 text-red-brand flex-shrink-0" />
                                    <p className="text-ink-600 text-sm">All shipments are <strong>fully insured</strong> to declared value at no extra charge.</p>
                                </div>
                            </motion.div>
                        )}

                        {/* ── Step 5: Confirm ── */}
                        {step === 5 && (
                            <motion.div key="5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                <h2 className="text-2xl font-bold text-ink-900 mb-6" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Review & Confirm</h2>
                                <div className="bg-ink-900 rounded-2xl p-6 space-y-4">
                                    {[
                                        ["Route", `${form.sender_state} → ${form.recipient_state}`],
                                        ["Service", form.service_type === "same_day" ? "Same Day" : form.service_type.charAt(0).toUpperCase() + form.service_type.slice(1)],
                                        ["Sender", `${form.sender_name} · ${form.sender_phone}`],
                                        ["Recipient", `${form.recipient_name} · ${form.recipient_phone}`],
                                        ["Pickup", form.sender_address],
                                        ["Drop-off", form.recipient_address],
                                        ["Weight", `${form.weight_kg} kg`],
                                        ["Value", form.declared_value ? `₦${Number(form.declared_value).toLocaleString()}` : "Not declared"],
                                    ].map(([k, v]) => (
                                        <div key={k} className="flex justify-between gap-4">
                                            <span className="text-white/40 text-sm flex-shrink-0">{k}</span>
                                            <span className="text-white text-sm font-semibold text-right">{v}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-ink-400 text-xs text-center">By booking you agree to our Terms of Service and Shipping Policy.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex gap-3 mt-8">
                        {step > 1 && (
                            <button onClick={back} className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-surface-200 font-bold text-ink-600 hover:bg-surface-50 transition-colors">
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                        )}
                        {step < 5 ? (
                            <button onClick={next} className="flex-1 btn-magnetic bg-red-brand hover:bg-red-dark text-white py-4 rounded-2xl font-bold transition-colors shadow-md shadow-red-brand/20 flex items-center justify-center gap-2">
                                Continue <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={isPending}
                                className="flex-1 btn-magnetic bg-red-brand hover:bg-red-dark disabled:opacity-60 text-white py-4 rounded-2xl font-bold transition-colors shadow-md shadow-red-brand/20 flex items-center justify-center gap-2">
                                {isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Confirm Booking</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BookPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-surface-50 flex items-center justify-center"><div className="w-6 h-6 border-2 border-red-brand border-t-transparent rounded-full animate-spin" /></div>}>
            <BookingContent />
        </Suspense>
    );
}
