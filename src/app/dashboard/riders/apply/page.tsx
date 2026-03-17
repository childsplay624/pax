"use client";

import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bike, Shield, FileText, Upload, CheckCircle2,
    AlertCircle, ArrowRight, ArrowLeft, Loader2,
    Truck, MapPin, User, Mail, Phone, Building2, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NIGERIAN_STATES } from "@/lib/pricing";
import { submitRiderApplication, getRiderApplication } from "@/app/actions/rider";

const STEPS = [
    { id: "personal", title: "Identity", icon: User },
    { id: "vehicle", title: "Vehicle", icon: Truck },
    { id: "kyc", title: "KYC Audit", icon: Shield },
];

export default function RiderApplyPage() {
    const [step, setStep] = useState(0);
    const [isPending, start] = useTransition();
    const [existingApp, setExistingApp] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        vehicle_type: "bike",
        vehicle_reg_number: "",
        id_type: "NIN",
        id_number: "",
        id_image_url: "",
    });

    useEffect(() => {
        getRiderApplication().then(app => {
            if (app) {
                setExistingApp(app);
                setForm(prev => ({ ...prev, ...app }));
            }
            setLoading(false);
        });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleNext = () => setStep(s => Math.min(STEPS.length - 1, s + 1));
    const handleBack = () => setStep(s => Math.max(0, s - 1));

    const handleSubmit = async () => {
        start(async () => {
            const res = await submitRiderApplication(form);
            if (res.success) {
                setExistingApp({ ...form, status: "pending" });
            } else {
                alert(res.error || "Submission failed");
            }
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-8 h-8 text-red-brand animate-spin" />
                <p className="text-white/20 text-xs font-black uppercase tracking-widest">Retrieving Status...</p>
            </div>
        );
    }

    if (existingApp?.status === "pending") {
        return (
            <div className="p-8 lg:p-12 text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                </div>
                <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Application <span className="text-amber-500">Pending</span></h2>
                <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
                    Our compliance team is currently auditing your KYC documents. We'll notify you once your rider account is activated.
                </p>
                <div className="mt-10 p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl w-full max-w-md text-left">
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Submission Details</p>
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                            <span className="text-white/30">Reference</span>
                            <span className="text-white font-mono uppercase">{existingApp.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-white/30">Vehicle</span>
                            <span className="text-white capitalize">{existingApp.vehicle_type}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-white/30">Identity</span>
                            <span className="text-white">{existingApp.id_type} — {existingApp.id_number.slice(0, 4)}••••</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (existingApp?.status === "approved") {
        return (
            <div className="p-8 lg:p-12 text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Welcome, <span className="text-emerald-500">Rider!</span></h2>
                <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed mb-8">
                    Your application has been approved. You now have access to the Rider Hub.
                </p>
                <a href="/rider" className="px-8 py-4 bg-red-brand text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-brand/20 hover:scale-105 transition-all">
                    Go to Rider Hub
                </a>
            </div>
        );
    }

    const inputCls = "w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-red-brand/40 outline-none transition-all text-sm font-medium";
    const labelCls = "block text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 px-1";

    return (
        <div className="min-h-[500px]">
            {/* Steps Header */}
            <div className="p-8 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Rider Registration</h2>
                    <p className="text-white/30 text-xs">Join our elite fleet of delivery experts</p>
                </div>
                <div className="flex gap-2">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
                            step === i ? "bg-red-brand text-white border-red-brand" :
                            step > i ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            "bg-white/[0.03] text-white/20 border-white/10"
                        )}>
                            {step > i ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-4 h-4" />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-8">
                <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        
                        {step === 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 flex items-center gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <div className="w-12 h-12 rounded-xl bg-red-brand/10 border border-red-brand/20 flex items-center justify-center">
                                        <AlertCircle className="w-6 h-6 text-red-brand" />
                                    </div>
                                    <p className="text-white/40 text-[11px] leading-relaxed">
                                        Please ensure your <span className="text-white">Full Name</span> matches your legal identity documents for a successful audit.
                                    </p>
                                </div>
                                <div>
                                    <label className={labelCls}>Full Name</label>
                                    <input type="text" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Legal Full Name" className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Phone Number</label>
                                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+234 800 000 0000" className={inputCls} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelCls}>Residential Address</label>
                                    <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="House Number, Street name" className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>City</label>
                                    <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="Ikeja" className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>State</label>
                                    <select name="state" value={form.state} onChange={handleChange} className={inputCls}>
                                        <option value="">Select State</option>
                                        {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <label className={labelCls}>Vehicle Type</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {['bike', 'van', 'truck', 'drone'].map(v => (
                                            <button key={v} onClick={() => setForm(f => ({ ...f, vehicle_type: v }))}
                                                className={cn(
                                                    "p-6 rounded-3xl border flex flex-col items-center gap-3 transition-all",
                                                    form.vehicle_type === v ? "bg-red-brand/10 border-red-brand text-red-brand shadow-lg shadow-red-brand/10" : "bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/[0.05]"
                                                )}>
                                                {v === 'bike' && <Bike className="w-6 h-6" />}
                                                {v === 'van' && <Truck className="w-6 h-6" />}
                                                {v === 'truck' && <Building2 className="w-6 h-6" />}
                                                {v === 'drone' && <Zap className="w-6 h-6" />}
                                                <span className="text-[10px] font-black uppercase tracking-widest">{v}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Vehicle Registration Number (Optional)</label>
                                    <input type="text" name="vehicle_reg_number" value={form.vehicle_reg_number} onChange={handleChange} placeholder="LAG-442-XY" className={inputCls} />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelCls}>Identity Document Type</label>
                                    <select name="id_type" value={form.id_type} onChange={handleChange} className={inputCls}>
                                        <option value="NIN">National ID (NIN)</option>
                                        <option value="DL">Driver's License</option>
                                        <option value="Passport">International Passport</option>
                                        <option value="Voters">Voter's Card</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>ID Serial Number</label>
                                    <input type="text" name="id_number" value={form.id_number} onChange={handleChange} placeholder="Enter number" className={inputCls} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelCls}>KYC Document Image</label>
                                    <div className="p-10 border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-4 bg-white/[0.01] hover:bg-white/[0.03] transition-all group cursor-pointer">
                                        <div className="w-14 h-14 rounded-2xl bg-red-brand/10 border border-red-brand/20 flex items-center justify-center text-red-brand group-hover:scale-110 transition-transform">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-white font-bold text-sm">Tap to Upload Image</p>
                                            <p className="text-white/20 text-[10px] uppercase font-black tracking-widest mt-1">Capture front of your ID card</p>
                                        </div>
                                    </div>
                                    <p className="text-white/20 text-[9px] mt-3 px-1 italic">Maximum file size: 5MB. Format: JPG, PNG.</p>
                                </div>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="mt-12 flex items-center justify-between gap-4">
                    <button onClick={handleBack} disabled={step === 0}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all",
                            step === 0 ? "opacity-0 pointer-events-none" : "text-white/40 hover:text-white"
                        )}>
                        <ArrowLeft className="w-4 h-4" /> Go Back
                    </button>

                    {step < STEPS.length - 1 ? (
                        <button onClick={handleNext}
                            className="bg-white/[0.06] hover:bg-white/[0.1] text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all">
                            Next Stage <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={isPending}
                            className="bg-red-brand hover:bg-red-dark text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-brand/20 flex items-center gap-2 transition-all">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Submit Application</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
