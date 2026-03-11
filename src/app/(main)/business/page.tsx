"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useTransition } from "react";
import { BarChart3, Shield, Layers, Cpu, Zap, Database, TrendingUp, Package, ArrowRight, Search, Bell, CheckCircle2, Building2, User, Mail, Phone, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitBusinessInquiry } from "@/app/actions/shipments";

/* ── Animated bar chart (red tones) ─────────────────────────── */
const AnimatedChart = () => {
    const bars = [42, 65, 38, 78, 55, 90, 68, 82, 71, 95, 80, 100];
    return (
        <div className="flex items-end gap-1.5 h-16">
            {bars.map((h, i) => (
                <motion.div
                    key={i} className="flex-1 bg-red-brand/15 rounded-sm relative overflow-hidden"
                    style={{ height: `${h}%` }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.05 + 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    <motion.div
                        className="absolute inset-0 bg-red-brand/35 rounded-sm"
                        animate={{ scaleY: [0, 1, 0] }}
                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                        style={{ transformOrigin: "bottom" }}
                    />
                </motion.div>
            ))}
        </div>
    );
};

/* ── KPI widget — on dark dashboard card ─────────────────────── */
const KpiWidget = ({ label, value, delta, positive = true }: { label: string; value: string; delta: string; positive?: boolean }) => {
    const [loaded, setLoaded] = useState(false);
    useEffect(() => { const t = setTimeout(() => setLoaded(true), 600 + Math.random() * 500); return () => clearTimeout(t); }, []);
    return (
        <div className="bg-white/[0.06] rounded-2xl p-4 border border-white/[0.06]">
            {!loaded ? (
                <div className="space-y-2">
                    <div className="skeleton h-3 w-3/4 rounded" />
                    <div className="skeleton h-6 w-1/2 rounded" />
                </div>
            ) : (
                <>
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] block mb-2">{label}</span>
                    <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{value}</span>
                        <span className={cn("text-xs font-bold flex items-center gap-1", positive ? "text-emerald-400" : "text-red-400")}>
                            <TrendingUp className="w-3 h-3" />{delta}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
};

/* ── Dashboard mockup — intentionally dark ─────────────────── */
const DashboardMockup = () => {
    const [tab, setTab] = useState("Shipments");
    return (
        <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 8 }} whileInView={{ opacity: 1, y: 0, rotateX: 3 }} viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
            className="relative"
        >
            <div className="rounded-[2rem] border border-white/[0.08] overflow-hidden bg-ink-900 shadow-[0_40px_80px_rgba(17,17,24,0.5)]">
                {/* Top bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-brand rounded-lg flex items-center justify-center">
                            <Package className="text-white w-4 h-4" />
                        </div>
                        <div className="flex gap-1">
                            {["Shipments", "Fleet", "Analytics"].map(t => (
                                <button key={t} onClick={() => setTab(t)}
                                    className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", tab === t ? "bg-red-brand/20 text-red-400" : "text-white/40 hover:text-white")}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Search className="w-4 h-4 text-white/30" />
                        <Bell className="w-4 h-4 text-white/30" />
                        <div className="w-7 h-7 rounded-full bg-red-brand border-2 border-white/10" />
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* KPIs */}
                    <div className="grid grid-cols-3 gap-3">
                        <KpiWidget label="Active Shipments" value="1,248" delta="+12.5%" positive />
                        <KpiWidget label="Success Rate" value="99.98%" delta="+0.1%" positive />
                        <KpiWidget label="Fleet Util." value="86.2%" delta="-2.4%" positive={false} />
                    </div>

                    {/* Chart */}
                    <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.04]">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Shipment Volume — 30 days</span>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-brand" />
                                <span className="text-[10px] text-white/30 font-semibold">Daily</span>
                            </div>
                        </div>
                        <AnimatedChart />
                    </div>

                    {/* Table */}
                    <div className="bg-white/[0.03] rounded-2xl border border-white/[0.04] overflow-hidden">
                        <div className="px-5 py-3 border-b border-white/[0.04] flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-brand animate-pulse" />
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em]">Live Stream</span>
                        </div>
                        <div className="divide-y divide-white/[0.03]">
                            {[
                                { id: "PAX-8392", dest: "New York", status: "In Transit", eta: "2h 15m", dot: "bg-red-brand" },
                                { id: "PAX-4401", dest: "Frankfurt", status: "Processing", eta: "Pending", dot: "bg-amber-400" },
                                { id: "PAX-2938", dest: "Singapore", status: "Delivered", eta: "Arrived", dot: "bg-emerald-400" },
                            ].map(r => (
                                <div key={r.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-1.5 h-1.5 rounded-full", r.dot)} />
                                        <span className="text-white font-mono text-sm font-semibold">{r.id}</span>
                                        <span className="text-white/30 text-xs">{r.dest}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-white text-xs font-semibold block">{r.status}</span>
                                        <span className="text-white/30 text-[10px] font-bold uppercase">{r.eta}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute -inset-10 bg-red-brand/10 blur-[80px] rounded-full pointer-events-none -z-10" />
        </motion.div>
    );
};

/* ── API Snippet — on dark terminal card ─────────────────────── */
const codeLines = [
    { text: "curl -X POST https://api.panafrican.express/v2/shipments \\", color: "text-white/80" },
    { text: '  -H "Authorization: Bearer YOUR_API_KEY" \\', color: "text-amber-400/80" },
    { text: '  -H "Content-Type: application/json" \\', color: "text-white/80" },
    { text: "  -d '{", color: "text-white/80" },
    { text: '    "destination": "New York, NY",', color: "text-red-400" },
    { text: '    "service": "express_international",', color: "text-red-400" },
    { text: '    "weight_kg": 3.4,', color: "text-red-400" },
    { text: '    "insure": true', color: "text-red-400" },
    { text: "  }'", color: "text-white/80" },
];

const ApiSnippet = () => (
    <div className="bg-ink-900 rounded-2xl border border-white/[0.06] overflow-hidden shadow-xl">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06] bg-black/20">
            <div className="w-2.5 h-2.5 rounded-full bg-red-brand/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
            <span className="ml-3 text-[10px] text-white/30 font-mono font-semibold">PAN African Express API v2 · Create Shipment</span>
        </div>
        <div className="p-5 font-mono text-[12px] leading-relaxed overflow-x-auto">
            {codeLines.map((l, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className={l.color}>
                    {l.text}
                </motion.div>
            ))}
        </div>
    </div>
);

export default function BusinessPage() {
    const features = [
        { icon: Cpu, title: "REST & WebSocket APIs", desc: "Real-time streaming telemetry on all active shipments — your choice of socket.io or REST polling." },
        { icon: Layers, title: "Bulk Shipment Engine", desc: "Orchestrate up to 100,000 labels per batch with automated routing and manifest generation." },
        { icon: BarChart3, title: "Financial Analytics", desc: "Cost-centre reporting, zone-level invoicing, and exportable P&L dashboards per division." },
    ];

    /* ── Inquiry form state ── */
    const [form, setForm] = useState({ company_name: "", contact_name: "", email: "", phone: "", daily_volume: "", message: "" });
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, start] = useTransition();

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        start(async () => {
            const res = await submitBusinessInquiry(form);
            if (!res.success) { setError(res.error ?? "Something went wrong."); return; }
            setSuccess(true);
        });
    };

    const inputCls = "w-full bg-surface-50 border border-surface-200 rounded-2xl px-5 py-4 text-ink-900 font-medium placeholder-ink-300 outline-none focus:border-red-brand/50 focus:bg-white focus:ring-4 focus:ring-red-brand/8 transition-all text-[15px]";
    const labelCls = "text-xs font-bold uppercase tracking-widest text-ink-400 block mb-2";

    return (
        <div className="bg-surface-0 pt-28 pb-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">

                {/* ── Hero split ── */}
                <section className="py-20 grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
                    <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                        <span className="text-red-brand text-[11px] font-bold uppercase tracking-[0.35em] block mb-5">Enterprise Command</span>
                        <h1 className="text-5xl md:text-7xl font-bold text-ink-900 tracking-tight mb-8 leading-[1.05]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            Built for<br /><span className="gradient-text-red">The Corporate.</span>
                        </h1>
                        <p className="text-ink-400 text-lg leading-relaxed mb-12 max-w-lg">
                            PAN African Express gives CTOs and logistics directors a single pane of glass to orchestrate
                            Nigeria-wide shipping operations with real-time intelligence.
                        </p>

                        <div className="space-y-7">
                            {features.map((f, i) => (
                                <motion.div key={f.title} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                    className="flex items-start gap-5 group">
                                    <div className="p-3 bg-red-brand/8 rounded-xl border border-red-brand/12 group-hover:bg-red-brand transition-colors flex-shrink-0">
                                        <f.icon className="w-5 h-5 text-red-brand group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-ink-900 mb-1">{f.title}</h4>
                                        <p className="text-ink-400 text-sm leading-relaxed">{f.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-12 flex flex-wrap gap-4">
                            <a href="#inquiry"
                                className="btn-magnetic bg-red-brand hover:bg-red-dark text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-red-brand/20 transition-colors">
                                Request Enterprise Demo <ArrowRight className="w-4 h-4" />
                            </a>
                            <button className="btn-magnetic bg-surface-100 text-ink-700 px-8 py-4 rounded-full font-bold border border-surface-200 hover:border-red-brand/30 hover:text-red-brand transition-colors">
                                API Docs
                            </button>
                        </div>
                    </motion.div>

                    <DashboardMockup />
                </section>

                {/* ── API Integration ── */}
                <section className="py-20 border-t border-surface-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                            <span className="text-red-brand text-[11px] font-bold uppercase tracking-[0.35em] block mb-5">Developer First</span>
                            <h2 className="text-4xl md:text-5xl font-bold text-ink-900 tracking-tight mb-6" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                Ship your first parcel<br />in under <span className="text-red-brand">60 seconds.</span>
                            </h2>
                            <p className="text-ink-400 leading-relaxed mb-8 max-w-md">
                                RESTful API and official SDKs (Node.js, Python, Go) make integration frictionless. Full webhook support for real-time status push.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {["Node.js SDK", "Python SDK", "Webhooks", "REST API", "GraphQL"].map(tag => (
                                    <span key={tag} className="bg-surface-100 rounded-full px-4 py-2 text-xs font-bold text-ink-500 border border-surface-200">{tag}</span>
                                ))}
                            </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
                            <ApiSnippet />
                        </motion.div>
                    </div>
                </section>

                {/* ── Why Enterprise ── */}
                <section className="py-20 border-t border-surface-200">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-6xl font-bold text-ink-900 tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Why Corporations Choose PAE</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: Zap, title: "99.99% API Uptime", desc: "Multi-region HA infrastructure. SLA-backed SLOs.", val: "99.99%" },
                            { icon: Shield, title: "Military-Grade Auth", desc: "mTLS, API key rotation, scoped OAuth 2.0 tokens.", val: "256-bit" },
                            { icon: Database, title: "Infinite Scale", desc: "Batch 500k shipments/hr. Zero throttling.", val: "∞" },
                        ].map((s, i) => (
                            <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className="card p-8">
                                <div className="text-5xl font-bold text-red-brand mb-5 tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{s.val}</div>
                                <div className="flex items-center gap-3 mb-3">
                                    <s.icon className="w-5 h-5 text-red-brand" />
                                    <h4 className="font-bold text-ink-900">{s.title}</h4>
                                </div>
                                <p className="text-ink-400 text-sm leading-relaxed">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ── Enterprise Inquiry Form ── */}
                <section id="inquiry" className="py-20 border-t border-surface-200">
                    <div className="max-w-2xl mx-auto">
                        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
                            <span className="text-red-brand text-[11px] font-bold uppercase tracking-[0.35em] block mb-4">Get In Touch</span>
                            <h2 className="text-4xl md:text-5xl font-bold text-ink-900 tracking-tight mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                Request a Demo
                            </h2>
                            <p className="text-ink-400 text-lg">Tell us about your business. Our enterprise team responds within 4 hours on business days.</p>
                        </motion.div>

                        <AnimatePresence mode="wait">
                            {success ? (
                                <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-12 card p-12">
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                        className="w-24 h-24 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                    </motion.div>
                                    <h3 className="text-3xl font-bold text-ink-900 mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Inquiry Sent!</h3>
                                    <p className="text-ink-400">Our enterprise team will reach out within 4 business hours.</p>
                                </motion.div>
                            ) : (
                                <motion.div key="form" className="card p-8">
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className={labelCls}>Company Name</label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300 pointer-events-none" />
                                                    <input type="text" placeholder="Dangote Group" value={form.company_name} onChange={set("company_name")}
                                                        className={cn(inputCls, "pl-11")} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Contact Name <span className="text-red-brand">*</span></label>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300 pointer-events-none" />
                                                    <input type="text" required placeholder="Emeka Okafor" value={form.contact_name} onChange={set("contact_name")}
                                                        className={cn(inputCls, "pl-11")} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className={labelCls}>Work Email <span className="text-red-brand">*</span></label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300 pointer-events-none" />
                                                    <input type="email" required placeholder="emeka@company.com" value={form.email} onChange={set("email")}
                                                        className={cn(inputCls, "pl-11")} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Phone Number</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300 pointer-events-none" />
                                                    <input type="tel" placeholder="+234 800 000 0000" value={form.phone} onChange={set("phone")}
                                                        className={cn(inputCls, "pl-11")} />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelCls}>Daily Shipment Volume</label>
                                            <select value={form.daily_volume} onChange={set("daily_volume")} className={inputCls}>
                                                <option value="">Select estimated volume</option>
                                                <option value="1-50">1 – 50 shipments/day</option>
                                                <option value="51-200">51 – 200 shipments/day</option>
                                                <option value="201-1000">201 – 1,000 shipments/day</option>
                                                <option value="1000+">1,000+ shipments/day</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className={labelCls}>Message</label>
                                            <div className="relative">
                                                <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-ink-300 pointer-events-none" />
                                                <textarea rows={4} placeholder="Tell us about your logistics needs..." value={form.message} onChange={set("message")}
                                                    className={cn(inputCls, "pl-11 resize-none")} />
                                            </div>
                                        </div>

                                        {error && (
                                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                                className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                                                <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-red-700 text-sm font-semibold">{error}</p>
                                            </motion.div>
                                        )}

                                        <button type="submit" disabled={isPending}
                                            className="w-full bg-red-brand hover:bg-red-dark disabled:opacity-60 text-white py-4 rounded-2xl font-bold text-[15px] transition-all shadow-lg shadow-red-brand/25 hover:shadow-red-brand/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2">
                                            {isPending
                                                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                : <><span>Send Enterprise Inquiry</span><ArrowRight className="w-4 h-4" /></>}
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

            </div>
        </div>
    );
}

