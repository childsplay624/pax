"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Package, CheckCircle2, Truck, MapPin, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { signIn } from "@/app/actions/auth";

const FEATURES = [
    { icon: Truck, text: "Nationwide delivery to all 36 states + FCT" },
    { icon: MapPin, text: "Real-time tracking from pickup to doorstep" },
    { icon: Shield, text: "Every parcel fully insured at no extra cost" },
    { icon: CheckCircle2, text: "98% on-time delivery rate across Nigeria" },
];

const DOTS = [
    { cx: "18%", cy: "62%", delay: 0 }, { cx: "45%", cy: "38%", delay: 0.4 },
    { cx: "48%", cy: "18%", delay: 0.8 }, { cx: "35%", cy: "68%", delay: 1.2 },
    { cx: "68%", cy: "30%", delay: 1.6 }, { cx: "25%", cy: "45%", delay: 2.0 },
    { cx: "58%", cy: "55%", delay: 2.4 }, { cx: "15%", cy: "48%", delay: 2.8 },
];

const ARCS = [
    ["18%", "62%", "45%", "38%"], ["45%", "38%", "48%", "18%"],
    ["45%", "38%", "35%", "68%"], ["45%", "38%", "68%", "30%"],
    ["18%", "62%", "25%", "45%"], ["45%", "38%", "58%", "55%"],
];

function LoginForm() {
    const searchParams = useSearchParams();
    const nav = useRouter();
    // If middleware set an explicit redirect (e.g. user tried to access /dashboard), respect it
    const explicitRedirect = searchParams.get("redirect");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, start] = useTransition();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        start(async () => {
            const res = await signIn({ email, password });
            if (res.error) { setError(res.error); return; }

            let target = explicitRedirect;

            if (res.account_type === "rider") {
                target = "/rider";
            } else if (res.account_type === "admin") {
                target = "/admin";
            } else if (res.account_type === "business") {
                // If no redirect or trying to go to public pages, send to dashboard
                if (!target || target === "/account") target = "/dashboard";
                // If they wanted to book, send to dashboard version
                if (target === "/book") target = "/dashboard/book";
            } else {
                // Personal accounts: default to /account
                if (!target || target === "/dashboard") target = "/account";
            }

            nav.push(target!);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-ink-400">Email Address</label>
                <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-5 py-4 text-ink-900 font-medium placeholder-ink-300 outline-none focus:border-red-brand/50 focus:bg-white focus:ring-4 focus:ring-red-brand/8 transition-all text-[15px]" />
            </div>

            {/* Password */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-ink-400">Password</label>
                    <span className="text-xs font-bold text-red-brand hover:text-red-dark transition-colors cursor-pointer">Forgot password?</span>
                </div>
                <div className="relative">
                    <input type={show ? "text" : "password"} required autoComplete="current-password"
                        value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-5 py-4 pr-14 text-ink-900 font-medium placeholder-ink-300 outline-none focus:border-red-brand/50 focus:bg-white focus:ring-4 focus:ring-red-brand/8 transition-all text-[15px]" />
                    <button type="button" onClick={() => setShow(s => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-ink-300 hover:text-ink-600 rounded-lg hover:bg-surface-100 transition-all">
                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                    <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm font-semibold">{error}</p>
                </motion.div>
            )}

            {/* Submit */}
            <button type="submit" disabled={isPending}
                className="w-full bg-red-brand hover:bg-red-dark disabled:opacity-60 text-white py-4 rounded-2xl font-bold text-[15px] transition-all shadow-lg shadow-red-brand/25 hover:shadow-red-brand/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-2">
                {isPending
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
            </button>
        </form>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex">

            {/* ══ LEFT — Brand Panel ══════════════════════════════════════ */}
            <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] bg-ink-900 relative overflow-hidden flex-col justify-between p-12 xl:p-16">
                {/* Grid */}
                <div className="absolute inset-0 opacity-[0.035]"
                    style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
                {/* Glows */}
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-red-brand/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-60 right-0 w-[500px] h-[500px] bg-red-brand/10 rounded-full blur-[120px] pointer-events-none" />

                {/* Network SVG */}
                <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                        {ARCS.map(([x1, y1, x2, y2], i) => (
                            <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                                stroke="rgba(220,38,38,0.2)" strokeWidth="0.3" strokeDasharray="1 1"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                transition={{ duration: 1.2, delay: i * 0.18 }} />
                        ))}
                        {DOTS.map((d, i) => (
                            <g key={i}>
                                <motion.circle cx={d.cx} cy={d.cy} r="1.2" fill="rgba(220,38,38,0.6)"
                                    initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: d.delay, duration: 0.4 }} />
                                <motion.circle cx={d.cx} cy={d.cy} r="2.5"
                                    fill="transparent" stroke="rgba(220,38,38,0.2)" strokeWidth="0.4"
                                    animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ delay: d.delay, duration: 2.5, repeat: Infinity }} />
                            </g>
                        ))}
                    </svg>
                </div>

                {/* Logo */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                    className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-brand rounded-xl flex items-center justify-center shadow-lg shadow-red-brand/40">
                        <Package className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-bold text-xl" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        PAN <span className="text-red-brand">African Express</span>
                    </span>
                </motion.div>

                {/* Hero copy */}
                <div className="relative z-10">
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}>
                        <p className="text-red-brand text-[11px] font-bold uppercase tracking-[0.35em] mb-5">Nigeria&apos;s Premier Courier</p>
                        <h2 className="text-5xl xl:text-6xl font-bold text-white leading-[1.08] tracking-tight mb-6"
                            style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            Ship anywhere.<br /><span className="text-red-brand">Track everything.</span>
                        </h2>
                        <p className="text-white/40 text-lg leading-relaxed max-w-md mb-10">
                            From Lagos to Maiduguri, Abuja to Calabar — one platform for every delivery in Nigeria.
                        </p>
                    </motion.div>
                    <div className="space-y-4">
                        {FEATURES.map((f, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                                className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-red-brand/15 border border-red-brand/20 flex items-center justify-center flex-shrink-0">
                                    <f.icon className="w-3.5 h-3.5 text-red-brand" />
                                </div>
                                <span className="text-white/55 text-sm font-medium">{f.text}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Stat strip */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                    className="relative z-10 flex gap-8 pt-8 border-t border-white/[0.07]">
                    {[["37", "States & FCT"], ["1K+", "Parcels/day"], ["98%", "On-time"]].map(([val, label]) => (
                        <div key={label}>
                            <p className="text-2xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{val}</p>
                            <p className="text-white/35 text-xs font-semibold mt-0.5">{label}</p>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* ══ RIGHT — Form Panel ════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-white overflow-y-auto">
                <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
                    className="w-full max-w-md mx-auto py-16">

                    {/* Mobile logo */}
                    <div className="flex items-center gap-2.5 mb-10 lg:hidden">
                        <div className="w-9 h-9 bg-red-brand rounded-xl flex items-center justify-center shadow-lg shadow-red-brand/30">
                            <Package className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-lg text-ink-900" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            PAN <span className="text-red-brand">African Express</span>
                        </span>
                    </div>

                    <div className="mb-10">
                        <h1 className="text-4xl font-bold text-ink-900 mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            Welcome back
                        </h1>
                        <p className="text-ink-400">Sign in to your shipping account</p>
                    </div>

                    <Suspense fallback={<div className="space-y-5"><div className="skeleton h-14 rounded-2xl" /><div className="skeleton h-14 rounded-2xl" /><div className="skeleton h-14 rounded-2xl" /></div>}>
                        <LoginForm />
                    </Suspense>

                    <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px bg-surface-200" />
                        <span className="text-ink-300 text-xs font-semibold">OR</span>
                        <div className="flex-1 h-px bg-surface-200" />
                    </div>

                    <p className="text-ink-400 text-sm text-center mb-4">Don&apos;t have an account yet?</p>
                    <Link href="/register"
                        className="w-full flex items-center justify-center gap-2 border-2 border-surface-200 hover:border-red-brand/30 hover:bg-red-brand/5 text-ink-700 hover:text-red-brand py-4 rounded-2xl font-bold text-[15px] transition-all">
                        Create a Free Account <ArrowRight className="w-4 h-4" />
                    </Link>

                    <p className="text-center text-ink-300 text-xs mt-8 leading-relaxed">
                        By continuing you agree to our <span className="text-ink-500 cursor-pointer hover:text-red-brand transition-colors">Terms</span> and <span className="text-ink-500 cursor-pointer hover:text-red-brand transition-colors">Privacy Policy</span>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
