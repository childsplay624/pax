"use client";

import { useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowRight, ArrowLeft, CheckCircle2, Package, 
    MapPin, User, Scale, Clipboard, FileUp, 
    Zap, Shield, Loader2 
} from "lucide-react";
import { createShipment } from "@/app/actions/bookings";
import { sendBookingConfirmationSMS } from "@/app/actions/notifications";
import { calculatePrice, NIGERIAN_STATES } from "@/lib/pricing";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import Link from "next/link";
import BulkUploadModal from "@/components/BulkUploadModal";
import { cn } from "@/lib/utils";

const STEPS = [
    { id: 1, label: "Route", icon: MapPin },
    { id: 2, label: "Sender", icon: User },
    { id: 3, label: "Recipient", icon: User },
    { id: 4, label: "Parcel", icon: Scale },
    { id: 5, label: "Confirm", icon: Clipboard },
];

const BOX = "bg-[#111116] border border-white/[0.06] rounded-[2rem] overflow-hidden shadow-2xl";
const inputCls = "w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white font-medium placeholder-white/20 outline-none focus:border-red-brand/40 focus:bg-white/[0.05] transition-all text-sm";
const selectCls = `${inputCls} appearance-none`;
const labelCls = "text-[10px] font-black uppercase tracking-[0.2em] text-white/30 block mb-3 pl-1";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <div><label className={labelCls}>{label}</label>{children}</div>;
}

function BookingContent() {
    const params = useSearchParams();

    const [step, setStep] = useState(1);
    const [isPending, start] = useTransition();
    const [trackingId, setTrackingId] = useState<string | null>(null);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [bulkCount, setBulkCount] = useState<number | null>(null);

    const handleBulkSuccess = (count: number) => {
        setBulkCount(count);
    };

    const [form, setForm] = useState({
        origin_city: params.get("from") ?? "Lagos",
        destination_city: params.get("to") ?? "Abuja (FCT)",
        sender_state: params.get("from") ?? "Lagos",
        recipient_state: params.get("to") ?? "Abuja (FCT)",
        service_type: (params.get("service") ?? "standard") as "standard" | "express" | "same_day",
        sender_name: "", sender_phone: "", sender_address: "",
        recipient_name: "", recipient_phone: "", recipient_address: "",
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

            if (tracking_id && form.sender_phone) {
                const price = calculatePrice(form.sender_state, form.recipient_state, Number(form.weight_kg), form.service_type);
                sendBookingConfirmationSMS({
                    senderPhone:  form.sender_phone,
                    senderName:   form.sender_name || "Customer",
                    trackingId:   tracking_id,
                    origin:       form.origin_city,
                    destination:  form.destination_city,
                    eta:          price.eta,
                }).catch(() => {});
            }
        });
    };

    /* ── Success state ── */
    if (trackingId || bulkCount) return (
        <div className="flex items-center justify-center py-20 px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={cn(BOX, "max-w-lg w-full p-12 text-center relative")}>
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-brand to-transparent" />
                <div className="w-24 h-24 bg-red-brand/10 border border-red-brand/20 rounded-full flex items-center justify-center mx-auto mb-8">
                    <CheckCircle2 className="w-12 h-12 text-red-brand" />
                </div>
                <h2 className="text-4xl font-black text-white mb-4 tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    {bulkCount ? "Bulk Registered!" : "Shipment Booked!"}
                </h2>
                <p className="text-white/40 text-sm mb-10 leading-relaxed font-medium">
                    {bulkCount 
                        ? `${bulkCount} parcels have been successfully registered in the PAX Cloud network.`
                        : "Your shipment sequence has been initiated. Save your tracking telemetry ID:"
                    }
                </p>
                
                {!bulkCount && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl px-8 py-8 mb-10">
                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mb-3">Telemetry tracking ID</p>
                        <p className="text-4xl font-black text-white font-mono tracking-tighter">{trackingId}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Link href="/dashboard/shipments"
                        className="bg-white text-black py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-center transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5">
                        Pulse Monitor
                    </Link>
                    <button onClick={() => { setTrackingId(null); setBulkCount(null); setStep(1); }}
                        className="bg-white/[0.05] border border-white/10 text-white/60 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-white/[0.08]">
                        New Payload
                    </button>
                </div>
            </motion.div>
        </div>
    );

    return (
        <div className="p-8 lg:p-12 space-y-12">
            
            <BulkUploadModal 
                isOpen={isBulkOpen} 
                onClose={() => setIsBulkOpen(false)} 
                onSuccess={handleBulkSuccess} 
                dark
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-brand/10 border border-red-brand/20 rounded-full">
                            <Zap className="w-3 h-3 text-red-brand" />
                            <span className="text-red-brand text-[9px] font-black uppercase tracking-widest">High-Priority Hub</span>
                        </div>
                        <button onClick={() => setIsBulkOpen(true)}
                            className="bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white/40 transition-all flex items-center gap-2">
                            <FileUp className="w-3.5 h-3.5" /> Bulk Command (CSV)
                        </button>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Initiate <span className="text-red-brand">Shipment</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/20">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                        <Shield className="w-3 h-3 text-emerald-500" />
                        <span>Insured Payload</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl">
                {/* Step indicator */}
                <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-4 no-scrollbar">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-4 flex-shrink-0">
                            <div className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                step === s.id ? "bg-red-brand text-white shadow-xl shadow-red-brand/20 scale-105" :
                                step > s.id ? "bg-red-brand/10 text-red-brand border border-red-brand/20" : "bg-white/[0.03] text-white/20 border border-white/5"
                            )}>
                                {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                                <span>{s.label}</span>
                            </div>
                            {i < STEPS.length - 1 && <div className={cn("w-8 h-px", step > s.id ? "bg-red-brand/30" : "bg-white/5")} />}
                        </div>
                    ))}
                </div>

                {/* Main Card */}
                <div className={cn(BOX, "p-10 md:p-16 relative")}>
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-brand to-transparent" />

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <div>
                                    <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Route Telemetry</h2>
                                    <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Select spatial origin and final destination.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Field label="Origin State">
                                        <select value={form.sender_state} onChange={e => { set("sender_state", e.target.value); set("origin_city", e.target.value); }} className={selectCls}>
                                            {NIGERIAN_STATES.sort().map(s => <option key={s} value={s} className="bg-[#111116]">{s}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Destination State">
                                        <select value={form.recipient_state} onChange={e => { set("recipient_state", e.target.value); set("destination_city", e.target.value); }} className={selectCls}>
                                            {NIGERIAN_STATES.sort().map(s => <option key={s} value={s} className="bg-[#111116]">{s}</option>)}
                                        </select>
                                    </Field>
                                </div>
                                <Field label="Logistic Service Tier">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {(["standard", "express", "same_day"] as const).map(s => (
                                            <button key={s} type="button" onClick={() => set("service_type", s)}
                                                className={cn(
                                                    "py-5 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest group",
                                                    form.service_type === s ? "border-red-brand bg-red-brand/10 text-red-brand" : "border-white/5 bg-white/[0.02] text-white/30 hover:border-white/10 hover:text-white"
                                                )}>
                                                {s === "same_day" ? "Same Day Dispatch" : s.charAt(0).toUpperCase() + s.slice(1) + " Priority"}
                                            </button>
                                        ))}
                                    </div>
                                </Field>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <h2 className="text-2xl font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Sender Intelligence</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Field label="Contact Identifier"><input value={form.sender_name} onChange={e => set("sender_name", e.target.value)} placeholder="Full Name" className={inputCls} /></Field>
                                    <Field label="Communication Line"><input value={form.sender_phone} onChange={e => set("sender_phone", e.target.value)} placeholder="+234..." className={inputCls} /></Field>
                                </div>
                                <Field label="Spatial Pickup Coordinate">
                                    <AddressAutocomplete
                                        value={form.sender_address}
                                        onChange={v => set("sender_address", v)}
                                        placeholder="Detailed Address..."
                                        dark
                                    />
                                </Field>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <h2 className="text-2xl font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Recipient Profile</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Field label="Full Identity Name"><input value={form.recipient_name} onChange={e => set("recipient_name", e.target.value)} placeholder="Recipient Name" className={inputCls} /></Field>
                                    <Field label="Mobile Connectivity"><input value={form.recipient_phone} onChange={e => set("recipient_phone", e.target.value)} placeholder="+234..." className={inputCls} /></Field>
                                </div>
                                <Field label="Target Delivery Coordinate">
                                    <AddressAutocomplete
                                        value={form.recipient_address}
                                        onChange={v => set("recipient_address", v)}
                                        placeholder="Drop-off point..."
                                        dark
                                    />
                                </Field>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div key="4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <h2 className="text-2xl font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Payload Specifics</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Field label="Mass Density (KG)">
                                        <input type="number" min={0.1} max={50} step={0.1} value={form.weight_kg} onChange={e => set("weight_kg", e.target.value)} className={inputCls} />
                                    </Field>
                                    <Field label="Declared Multiplier (₦)">
                                        <input type="number" min={0} value={form.declared_value} onChange={e => set("declared_value", e.target.value)} placeholder="Market Value" className={inputCls} />
                                    </Field>
                                </div>
                                <Field label="Operational Notes">
                                    <textarea value={form.special_instructions} onChange={e => set("special_instructions", e.target.value)}
                                        placeholder="Specific instructions for our ground units..." rows={4} className={`${inputCls} resize-none`} />
                                </Field>
                            </motion.div>
                        )}

                        {step === 5 && (
                            <motion.div key="5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <h2 className="text-2xl font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Pre-Flight Check</h2>
                                <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-10 space-y-6">
                                    {[
                                        ["Spatial Route", `${form.sender_state} ➜ ${form.recipient_state}`],
                                        ["Logistics Tier", form.service_type === "same_day" ? "Same Day" : form.service_type.charAt(0).toUpperCase() + form.service_type.slice(1)],
                                        ["Sender Node", `${form.sender_name} | ${form.sender_phone}`],
                                        ["Recipient Node", `${form.recipient_name} | ${form.recipient_phone}`],
                                        ["Pickup Coordinate", form.sender_address],
                                        ["Drop-off Target", form.recipient_address],
                                        ["Mass Property", `${form.weight_kg} kg`],
                                        ["Declared Value", form.declared_value ? `₦${Number(form.declared_value).toLocaleString()}` : "Not declared"],
                                    ].map(([k, v]) => (
                                        <div key={k} className="flex justify-between items-start gap-10">
                                            <span className="text-white/20 text-[10px] font-black uppercase tracking-widest pt-0.5">{k}:</span>
                                            <span className="text-white text-sm font-bold text-right">{v}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6 bg-red-brand/5 border border-red-brand/10 rounded-2xl flex items-center gap-4">
                                    <Shield className="w-5 h-5 text-red-brand" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-brand/80">Payload will be auto-debited from your secure wallet upon confirmation.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Final Navigation Buttons */}
                    <div className="flex gap-4 mt-12 pt-8 border-t border-white/5">
                        {step > 1 && (
                            <button onClick={back} className="flex items-center gap-2 px-8 py-5 rounded-2xl border border-white/10 font-black text-[10px] uppercase tracking-widest text-white/40 hover:bg-white/[0.03] hover:text-white transition-all">
                                <ArrowLeft className="w-4 h-4" /> Previous
                            </button>
                        )}
                        {step < 5 ? (
                            <button onClick={next} className="flex-1 bg-white text-black py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:scale-[1.01] active:scale-[0.98] shadow-xl shadow-white/5 flex items-center justify-center gap-2">
                                Continue <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={isPending}
                                className="flex-1 bg-red-brand hover:bg-red-dark disabled:opacity-40 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:scale-[1.01] active:scale-[0.98] shadow-xl shadow-red-brand/30 flex items-center justify-center gap-3">
                                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Launch Sequence</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BookShipmentPage() {
    return (
        <Suspense fallback={<div className="p-20 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-red-brand" /></div>}>
            <BookingContent />
        </Suspense>
    );
}
