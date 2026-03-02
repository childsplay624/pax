"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MapPin, ChevronRight, MessageSquare, Headphones, Building, Phone, CheckCircle2, AlertCircle } from "lucide-react";
import { submitContactMessage } from "@/app/actions/shipments";
import { NIGERIAN_STATES } from "@/lib/pricing";


export default function ContactPage() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [state, setState] = useState("Lagos");
    const [service, setService] = useState("Interstate Delivery");
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, start] = useTransition();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        start(async () => {
            const res = await submitContactMessage({ full_name: fullName, email, state, service, message });
            if (res.error) { setError(res.error); return; }
            setSuccess(true);
            setFullName(""); setEmail(""); setMessage("");
        });
    };

    const offices = [
        { city: "Lagos", description: "Head Office · Victoria Island", address: "Plot 14, Adeola Odeku Street, Victoria Island, Lagos", phone: "+234 (0) 1 700 5000" },
        { city: "Abuja", description: "FCT Hub · Wuse II", address: "Block C, Aminu Kano Crescent, Wuse II, Abuja", phone: "+234 (0) 9 876 4200" },
        { city: "Kano", description: "Northern Hub · Nassarawa", address: "15 Ibrahim Taiwo Road, Nassarawa GRA, Kano", phone: "+234 (0) 64 312 900" },
        { city: "Port Harcourt", description: "South-South Hub · GRA Phase II", address: "22 Aba Road, GRA Phase II, Port Harcourt, Rivers", phone: "+234 (0) 84 461 800" },
    ];

    const contacts = [
        { label: "Customer Support", value: "+234 (0) 1 700 5000", icon: Headphones, },
        { label: "General Inquiries", value: "hello@panafrican.express", icon: Mail, },
        { label: "Business Partnerships", value: "biz@panafrican.express", icon: MessageSquare, },
    ];

    return (
        <div className="bg-surface-0 pt-32 pb-24 overflow-hidden">
            <div className="radial-red-center absolute inset-0 pointer-events-none top-0" />

            <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                <section className="py-20 grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">

                    {/* ── Left ── */}
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                        <span className="text-red-brand font-bold uppercase tracking-[0.3em] text-[11px] mb-4 block">Get In Touch</span>
                        <h1 className="text-5xl md:text-8xl font-bold text-ink-900 tracking-tight mb-8 leading-[1.05]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            We're Here<br />
                            <span className="gradient-text-red">Wherever You Are.</span>
                        </h1>
                        <p className="max-w-lg text-lg text-ink-400 leading-relaxed mb-12">
                            Whether you're a small business owner in Aba or an enterprise team in Lagos — our team is ready to help you ship smarter across Nigeria.
                        </p>

                        <div className="space-y-5">
                            {contacts.map((c, i) => (
                                <div key={i} className="flex items-center gap-5 group cursor-pointer p-4 rounded-2xl hover:bg-surface-50 border border-transparent hover:border-surface-200 transition-all">
                                    <div className="p-4 rounded-2xl bg-red-brand/8 text-red-brand group-hover:bg-red-brand group-hover:text-white transition-all flex-shrink-0">
                                        <c.icon className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <span className="block text-ink-300 text-xs font-bold uppercase tracking-widest mb-1">{c.label}</span>
                                        <span className="text-xl font-bold text-ink-900 group-hover:text-red-brand transition-colors">{c.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* ── Right: form ── */}
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1 }} className="card p-8 md:p-12 relative">
                        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-3xl bg-gradient-to-r from-transparent via-red-brand to-transparent" />
                        <h3 className="text-3xl font-bold text-ink-900 mb-8" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Send a Message</h3>

                        <AnimatePresence mode="wait">
                            {success ? (
                                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                                    <div className="w-20 h-20 bg-red-brand/10 border border-red-brand/20 rounded-full flex items-center justify-center mx-auto mb-5">
                                        <CheckCircle2 className="w-10 h-10 text-red-brand" />
                                    </div>
                                    <h4 className="text-2xl font-bold text-ink-900 mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Message Sent!</h4>
                                    <p className="text-ink-400 mb-6">Our team will get back to you within 24 hours.</p>
                                    <button onClick={() => setSuccess(false)} className="text-red-brand font-bold text-sm hover:text-red-dark transition-colors">Send another message →</button>
                                </motion.div>
                            ) : (
                                <motion.form key="form" onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-ink-400">Full Name</label>
                                            <input type="text" required placeholder="e.g. Chidi Okafor" value={fullName} onChange={e => setFullName(e.target.value)}
                                                className="w-full bg-surface-50 border border-surface-200 rounded-xl px-5 py-4 text-ink-900 font-medium placeholder-ink-300 outline-none focus:border-red-brand/40 focus:ring-2 focus:ring-red-brand/8 transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-ink-400">Work Email</label>
                                            <input type="email" required placeholder="hello@yourbiz.com" value={email} onChange={e => setEmail(e.target.value)}
                                                className="w-full bg-surface-50 border border-surface-200 rounded-xl px-5 py-4 text-ink-900 font-medium placeholder-ink-300 outline-none focus:border-red-brand/40 focus:ring-2 focus:ring-red-brand/8 transition-all" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-ink-400">Your State</label>
                                        <select value={state} onChange={e => setState(e.target.value)}
                                            className="w-full bg-surface-50 border border-surface-200 rounded-xl px-5 py-4 text-ink-500 font-medium outline-none focus:border-red-brand/40 transition-all appearance-none">
                                            {NIGERIAN_STATES.sort().map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-ink-400">Service Needed</label>
                                        <select value={service} onChange={e => setService(e.target.value)}
                                            className="w-full bg-surface-50 border border-surface-200 rounded-xl px-5 py-4 text-ink-500 font-medium outline-none focus:border-red-brand/40 transition-all appearance-none">
                                            <option>Interstate Delivery</option>
                                            <option>Same-Day City Delivery</option>
                                            <option>E-commerce Fulfilment</option>
                                            <option>Corporate / Bulk Shipping</option>
                                            <option>General Enquiry</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-ink-400">Your Message</label>
                                        <textarea placeholder="Tell us about your shipping needs..." rows={4} value={message} onChange={e => setMessage(e.target.value)}
                                            className="w-full bg-surface-50 border border-surface-200 rounded-xl px-5 py-4 text-ink-900 font-medium placeholder-ink-300 outline-none focus:border-red-brand/40 transition-all resize-none" />
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-3 bg-red-brand/6 border border-red-brand/15 rounded-xl px-4 py-3">
                                            <AlertCircle className="w-4 h-4 text-red-brand flex-shrink-0" />
                                            <p className="text-red-brand text-sm font-semibold">{error}</p>
                                        </div>
                                    )}

                                    <button type="submit" disabled={isPending}
                                        className="btn-magnetic w-full bg-red-brand hover:bg-red-dark disabled:opacity-60 text-white py-5 rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-red-brand/20 flex items-center justify-center gap-3 group active:scale-[0.98]">
                                        {isPending
                                            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            : <><span>Send Message</span><ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </section>

                {/* ── Our Hubs ── */}
                <section className="py-24 border-t border-surface-200">
                    <div className="text-center mb-20">
                        <span className="text-red-brand font-bold uppercase tracking-[0.3em] text-[11px] mb-4 block">Nigeria Network</span>
                        <h2 className="text-4xl md:text-6xl font-bold text-ink-900 tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Our Hubs</h2>
                        <p className="text-ink-400 mt-4 max-w-xl mx-auto">Principal collection and sorting depots across Nigeria's key commercial cities.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
                        {offices.map((o, i) => (
                            <motion.div key={o.city} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className="card p-8 group">
                                <div className="w-12 h-12 rounded-2xl bg-red-brand/8 border border-red-brand/12 flex items-center justify-center mb-6 group-hover:bg-red-brand transition-colors">
                                    <Building className="w-6 h-6 text-red-brand group-hover:text-white transition-colors" />
                                </div>
                                <h4 className="text-2xl font-bold text-ink-900 mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{o.city}</h4>
                                <p className="text-ink-400 text-xs font-bold uppercase tracking-widest mb-4">{o.description}</p>
                                <p className="text-sm text-ink-400 mb-4 leading-relaxed">{o.address}</p>
                                <div className="flex items-center gap-2 text-red-brand font-bold text-sm">
                                    <Phone className="w-4 h-4" />
                                    <span>{o.phone}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Map placeholder — Nigeria themed */}
                    <div className="relative h-[380px] rounded-[2.5rem] overflow-hidden border border-surface-200 bg-ink-900">
                        <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 opacity-[0.06]">
                            {Array.from({ length: 72 }).map((_, i) => <div key={i} className="border-r border-b border-white/10" />)}
                        </div>
                        {/* Pulsing Nigerian city dots — approximate positions */}
                        <div className="absolute top-[45%] left-[14%]  w-5 h-5 bg-red-brand rounded-full animate-ping opacity-60" title="Lagos" />
                        <div className="absolute top-[35%] left-[42%]  w-4 h-4 bg-red-brand rounded-full animate-ping opacity-50" style={{ animationDelay: "0.3s" }} title="Abuja" />
                        <div className="absolute top-[15%] left-[46%]  w-4 h-4 bg-red-brand rounded-full animate-ping opacity-40" style={{ animationDelay: "0.7s" }} title="Kano" />
                        <div className="absolute top-[62%] left-[34%]  w-4 h-4 bg-red-brand rounded-full animate-ping opacity-50" style={{ animationDelay: "1.0s" }} title="Port Harcourt" />

                        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-12">
                            <MapPin className="w-14 h-14 text-red-brand mb-6 animate-bounce opacity-80" />
                            <h3 className="text-4xl font-bold text-white tracking-tight mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Nationwide Coverage</h3>
                            <p className="max-w-sm text-white/40 text-base leading-relaxed">
                                All 36 states and the FCT — with same-day tracking from pickup to doorstep.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
