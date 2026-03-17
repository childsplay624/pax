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
import { getUserProfile } from "@/app/actions/auth";

const STEPS = [
    { id: "personal", title: "Identity", icon: User },
    { id: "vehicle", title: "Vehicle", icon: Truck },
    { id: "kyc", title: "KYC Audit", icon: Shield },
];

const BOX = "bg-white border border-surface-200 rounded-[2.5rem] shadow-xl overflow-hidden";
const ACCENT_BAR = "w-1.5 h-6 rounded-full bg-red-brand";

export default function RiderApplyPage() {
    const [step, setStep] = useState(0);
    const [isPending, start] = useTransition();
    const [existingApp, setExistingApp] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isMerchant, setIsMerchant] = useState(false);

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
        Promise.all([
            getRiderApplication(),
            getUserProfile()
        ]).then(([app, userWithProfile]) => {
            if (app) {
                setExistingApp(app);
                setForm(prev => ({ ...prev, ...app }));
            }
            if (userWithProfile?.profile?.account_type === "business") {
                setIsMerchant(true);
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
                setExistingApp({ ...form, status: "pending", id: "NEW" });
            } else {
                alert(res.error || "Submission failed");
            }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-50 pt-40 pb-20 flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-12 h-12 text-red-brand animate-spin" />
                <p className="text-ink-400 text-sm font-bold uppercase tracking-widest animate-pulse">Retrieving Status...</p>
            </div>
        );
    }

    const inputCls = "w-full bg-surface-50 border border-surface-200 rounded-2xl px-5 py-4 text-ink-900 font-medium placeholder-ink-300 outline-none focus:border-red-brand/50 focus:bg-white focus:ring-4 focus:ring-red-brand/8 transition-all text-[15px]";
    const labelCls = "block text-[11px] font-black text-ink-400 uppercase tracking-[0.15em] mb-2.5 px-1";

    if (isMerchant) {
        return (
            <div className="bg-surface-50 min-h-screen pt-40 pb-24 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(220,38,38,0.05),transparent)] pointer-events-none" />
                <div className="relative z-10 max-w-2xl mx-auto px-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn(BOX, "p-12 lg:p-20 text-center flex flex-col items-center")}>
                        <div className="w-24 h-24 rounded-[2rem] bg-red-brand/10 border-2 border-red-brand/20 flex items-center justify-center mb-8">
                            <Building2 className="w-10 h-10 text-red-brand" />
                        </div>
                        <h2 className="text-4xl font-black text-ink-900 mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            Merchant <span className="text-red-brand">Restriction</span>
                        </h2>
                        <p className="text-ink-400 text-lg leading-relaxed mb-10 font-medium">
                            Rider accounts are exclusive to <b>Personal Account</b> holders. Business accounts cannot be converted to rider accounts.
                        </p>
                        <p className="text-ink-300 text-sm mb-12">
                            To become a rider, please create a new personal account or contact support for assistance.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href="/account" className="px-8 py-4 bg-ink-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:-translate-y-1 transition-all">
                                Back to Account
                            </a>
                            <a href="/contact" className="px-8 py-4 bg-white border border-surface-200 text-ink-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-surface-50 transition-all">
                                Contact Support
                            </a>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface-50 min-h-screen pt-40 pb-24 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(220,38,38,0.05),transparent)] pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto px-6">
                
                {existingApp?.status === "pending" ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn(BOX, "p-12 lg:p-20 text-center flex flex-col items-center")}>
                        <div className="w-24 h-24 rounded-[2rem] bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center mb-8">
                            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-ink-900 mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            Application <span className="text-amber-500">Pending</span>
                        </h2>
                        <p className="text-ink-400 text-lg max-w-md mx-auto leading-relaxed mb-12 font-medium">
                            Our compliance team is currently auditing your KYC documents. We'll notify you via SMS once your rider account is activated.
                        </p>
                        
                        <div className="w-full max-w-md text-left bg-surface-50 border border-surface-200 rounded-3xl p-8">
                            <p className="text-ink-900/20 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Submission Ledger</p>
                            <div className="space-y-4">
                                {[
                                    { label: "Reference", val: existingApp.id?.slice(0, 8), mono: true },
                                    { label: "Vehicle Type", val: existingApp.vehicle_type, cap: true },
                                    { label: "ID Verification", val: `${existingApp.id_type} — ${existingApp.id_number?.slice(0, 4)}••••` },
                                ].map(row => (
                                    <div key={row.label} className="flex justify-between items-center border-b border-surface-200/50 pb-4 last:border-0 last:pb-0">
                                        <span className="text-ink-400 text-xs font-bold uppercase tracking-wider">{row.label}</span>
                                        <span className={cn("text-ink-900 font-bold text-sm", row.mono && "font-mono", row.cap && "capitalize")}>{row.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : existingApp?.status === "approved" ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn(BOX, "p-12 lg:p-20 text-center flex flex-col items-center")}>
                         <div className="w-24 h-24 rounded-[2rem] bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center mb-8">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-ink-900 mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            Welcome, <span className="text-emerald-500">Rider!</span>
                        </h2>
                        <p className="text-ink-400 text-lg max-w-md mx-auto leading-relaxed mb-10 font-medium">
                            Your application has been successfully verified. You are now part of Nigeria's most advanced delivery fleet.
                        </p>
                        <a href="/rider" className="px-10 py-5 bg-red-brand text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-red-brand/30 hover:-translate-y-1 transition-all">
                            Enter Rider Hub
                        </a>
                    </motion.div>
                ) : (
                    <div className={BOX}>
                        {/* Steps Header */}
                        <div className="p-10 lg:p-12 border-b border-surface-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 bg-surface-50/50">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={ACCENT_BAR} />
                                    <span className="text-red-brand text-[10px] font-black uppercase tracking-[0.3em]">Phase {step + 1} of 3</span>
                                </div>
                                <h2 className="text-3xl lg:text-4xl font-black text-ink-900 tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                    Rider Registration
                                </h2>
                                <p className="text-ink-400 text-sm font-medium mt-1">Join the elite PAX delivery fleet today.</p>
                            </div>
                            <div className="flex gap-4">
                                {STEPS.map((s, i) => (
                                    <div key={s.id} className="relative group">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all shadow-sm",
                                            step === i ? "bg-red-brand text-white border-red-brand shadow-red-brand/20 scale-110" :
                                            step > i ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                            "bg-white text-ink-200 border-surface-200"
                                        )}>
                                            {step > i ? <CheckCircle2 className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
                                        </div>
                                        <p className={cn("absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap", step === i ? "text-red-brand" : "text-ink-300")}>
                                            {s.title}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-10 lg:p-16">
                            <AnimatePresence mode="wait">
                                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                    
                                    {step === 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="md:col-span-2 flex items-start gap-4 p-6 rounded-3xl bg-blue-50 border border-blue-100">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                                                    <AlertCircle className="w-5 h-5" />
                                                </div>
                                                <p className="text-blue-800 text-xs font-semibold leading-relaxed">
                                                    PAX requires valid government identification for all riders. Please ensure your legal name matches your <span className="underline">NIN, Voter's Card, or Passport.</span>
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className={labelCls}>Legal Full Name</label>
                                                <div className="relative">
                                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                                                    <input type="text" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Firstname Lastname" className={cn(inputCls, "pl-12")} />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className={labelCls}>Secure Phone Number</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                                                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="0800 000 0000" className={cn(inputCls, "pl-12")} />
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 space-y-1">
                                                <label className={labelCls}>Residential Physical Address</label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                                                    <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="Street name and Number" className={cn(inputCls, "pl-12")} />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className={labelCls}>City / Town</label>
                                                <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="e.g. Ikeja" className={inputCls} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={labelCls}>Primary State</label>
                                                <select name="state" value={form.state} onChange={handleChange} className={inputCls}>
                                                    <option value="">Select Location</option>
                                                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {step === 1 && (
                                        <div className="space-y-10">
                                            <div>
                                                <label className={labelCls}>Select Fleet Category</label>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                                                    {[
                                                        { id: 'bike', icon: Bike, label: 'Motorbike' },
                                                        { id: 'van', icon: Truck, label: 'Van / Car' },
                                                        { id: 'truck', icon: Building2, label: 'Heavy Truck' },
                                                        { id: 'drone', icon: Zap, label: 'Drone Hub' },
                                                    ].map(v => (
                                                        <button key={v.id} onClick={() => setForm(f => ({ ...f, vehicle_type: v.id }))}
                                                            className={cn(
                                                                "p-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all group hover:scale-[1.02]",
                                                                form.vehicle_type === v.id 
                                                                    ? "bg-red-brand/5 border-red-brand text-red-brand shadow-xl shadow-red-brand/10" 
                                                                    : "bg-white border-surface-200 text-ink-300 hover:border-red-brand/30 hover:bg-surface-50"
                                                            )}>
                                                            <v.icon className={cn("w-8 h-8 transition-transform group-hover:scale-110", form.vehicle_type === v.id ? "text-red-brand" : "text-ink-200")} />
                                                            <span className="text-[11px] font-black uppercase tracking-widest">{v.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className={labelCls}>Vehicle Registration Number (If applicable)</label>
                                                <input type="text" name="vehicle_reg_number" value={form.vehicle_reg_number} onChange={handleChange} placeholder="e.g. ABC-123-XY" className={inputCls} />
                                            </div>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-1">
                                                <label className={labelCls}>Identity Verification Type</label>
                                                <select name="id_type" value={form.id_type} onChange={handleChange} className={inputCls}>
                                                    <option value="NIN">National ID (NIN)</option>
                                                    <option value="DL">Driver's License</option>
                                                    <option value="Passport">International Passport</option>
                                                    <option value="Voters">Voter's Card</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className={labelCls}>Identification Serial Number</label>
                                                <input type="text" name="id_number" value={form.id_number} onChange={handleChange} placeholder="Enter ID digits" className={inputCls} />
                                            </div>
                                            <div className="md:col-span-2 space-y-1">
                                                <label className={labelCls}>Digital KYC Image Audit</label>
                                                <div className="p-16 border-2 border-dashed border-surface-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 bg-surface-50/50 hover:bg-white hover:border-red-brand/30 transition-all group cursor-pointer shadow-inner">
                                                    <div className="w-20 h-20 rounded-[1.5rem] bg-white border border-surface-200 flex items-center justify-center text-ink-300 group-hover:bg-red-brand group-hover:text-white group-hover:border-red-brand group-hover:scale-110 transition-all shadow-sm">
                                                        <Upload className="w-8 h-8" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-ink-900 font-black text-lg" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Click or Drag Document</p>
                                                        <p className="text-ink-400 text-xs font-bold uppercase tracking-widest mt-2">Clear photograph of ID Front required</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-4 px-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-brand" />
                                                    <p className="text-ink-300 text-[10px] font-bold uppercase tracking-[0.1em]">Formats: JPG, PNG · Max Size: 5MB</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </motion.div>
                            </AnimatePresence>

                            {/* Navigation Buttons */}
                            <div className="mt-20 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-surface-100 pt-10">
                                <button onClick={handleBack} disabled={step === 0}
                                    className={cn(
                                        "flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all",
                                        step === 0 ? "opacity-0 pointer-events-none" : "text-ink-300 hover:text-ink-900 hover:bg-surface-100"
                                    )}>
                                    <ArrowLeft className="w-4 h-4" /> Go Back
                                </button>

                                <div className="flex gap-4 w-full sm:w-auto">
                                    {step < STEPS.length - 1 ? (
                                        <button onClick={handleNext}
                                            className="w-full sm:w-auto bg-ink-900 hover:bg-black text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all shadow-xl shadow-ink-900/10 hover:-translate-y-1">
                                            Next Stage <ArrowRight className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button onClick={handleSubmit} disabled={isPending}
                                            className="w-full sm:w-auto bg-red-brand hover:bg-red-dark text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-red-brand/30 flex items-center justify-center gap-3 transition-all hover:-translate-y-1">
                                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Submit Audit</>}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
