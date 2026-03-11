"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Eye, EyeOff, ArrowRight, Package, CheckCircle2,
    Truck, MapPin, Shield, User, Mail, Lock,
    Building2, UserCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { signUp } from "@/app/actions/auth";

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

function StrengthBar({ password }: { password: string }) {
    const s = !password ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
    const colors = ["", "bg-red-400", "bg-amber-400", "bg-emerald-500"];
    const labels = ["", "Weak", "Good", "Strong"];
    if (!password) return null;
    return (
        <div className="flex items-center gap-3 mt-2">
            <div className="flex gap-1 flex-1">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= s ? colors[s] : "bg-surface-200"}`} />
                ))}
            </div>
            <span className={`text-[11px] font-bold ${s === 1 ? "text-red-500" : s === 2 ? "text-amber-500" : "text-emerald-600"}`}>{labels[s]}</span>
        </div>
    );
}

type AccountType = "personal" | "business";

const ACCOUNT_TYPES: { type: AccountType; label: string; sub: string; icon: typeof User; perks: string[] }[] = [
    {
        type: "personal",
        label: "Personal",
        sub: "For individuals & families",
        icon: UserCircle2,
        perks: ["Send parcels door-to-door", "Real-time tracking", "Insured deliveries"],
    },
    {
        type: "business",
        label: "Business",
        sub: "For companies & merchants",
        icon: Building2,
        perks: ["Bulk shipping rates", "Business dashboard & analytics", "API access & integrations"],
    },
];

export default function RegisterPage() {
    const nav = useRouter();
    const [accountType, setAccountType] = useState<AccountType>("personal");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isPending, start] = useTransition();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
        start(async () => {
            const res = await signUp({ email, password, full_name: fullName, account_type: accountType });
            if (res.error) { setError(res.error); return; }
            setSuccess(true);
            setTimeout(() => nav.push("/login"), 4500);
        });
    };

    const inputCls = "w-full bg-surface-50 border border-surface-200 rounded-2xl pl-11 pr-5 py-4 text-ink-900 font-medium placeholder-ink-300 outline-none focus:border-red-brand/50 focus:bg-white focus:ring-4 focus:ring-red-brand/8 transition-all text-[15px]";
    const labelCls = "text-xs font-bold uppercase tracking-widest text-ink-400";

    return (
        <div className="min-h-screen flex">

            {/* ══ LEFT — Brand Panel ══════════════════════════════════════════ */}
            <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] bg-ink-900 relative overflow-hidden flex-col justify-between p-12 xl:p-16">
                <div className="absolute inset-0 opacity-[0.035]"
                    style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
                <div className="absolute -top-40 -right-20 w-[550px] h-[550px] bg-red-brand/15 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-40 -left-20 w-[500px] h-[500px] bg-red-brand/10 rounded-full blur-[120px] pointer-events-none" />

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

                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                    className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-brand rounded-xl flex items-center justify-center shadow-lg shadow-red-brand/40">
                        <Package className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-bold text-xl" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        PAN <span className="text-red-brand">African Express</span>
                    </span>
                </motion.div>

                <div className="relative z-10">
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
                        <p className="text-red-brand text-[11px] font-bold uppercase tracking-[0.35em] mb-5">Join 10,000+ Nigerians</p>
                        <h2 className="text-5xl xl:text-6xl font-bold text-white leading-[1.08] tracking-tight mb-6"
                            style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            One account.<br /><span className="text-red-brand">All of Nigeria.</span>
                        </h2>
                        <p className="text-white/40 text-lg leading-relaxed max-w-md mb-10">
                            Create your free account and start shipping to any state in minutes. No setup fees, no contracts.
                        </p>
                    </motion.div>
                    <div className="space-y-4">
                        {FEATURES.map((f, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 + i * 0.09 }}
                                className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-red-brand/15 border border-red-brand/20 flex items-center justify-center flex-shrink-0">
                                    <f.icon className="w-3.5 h-3.5 text-red-brand" />
                                </div>
                                <span className="text-white/55 text-sm font-medium">{f.text}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                    className="relative z-10 flex gap-8 pt-8 border-t border-white/[0.07]">
                    {[["Free", "Account setup"], ["₦0", "Monthly fee"], ["24/7", "Customer care"]].map(([val, label]) => (
                        <div key={label}>
                            <p className="text-2xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{val}</p>
                            <p className="text-white/35 text-xs font-semibold mt-0.5">{label}</p>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* ══ RIGHT — Form Panel ════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-white overflow-y-auto">
                <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
                    className="w-full max-w-md mx-auto py-12">

                    {/* Mobile logo */}
                    <div className="flex items-center gap-2.5 mb-10 lg:hidden">
                        <div className="w-9 h-9 bg-red-brand rounded-xl flex items-center justify-center shadow-lg shadow-red-brand/30">
                            <Package className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-lg text-ink-900" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            PAN <span className="text-red-brand">African Express</span>
                        </span>
                    </div>

                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                    className="w-24 h-24 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                </motion.div>
                                <h2 className="text-3xl font-bold text-ink-900 mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                    Account Created!
                                </h2>
                                <p className="text-ink-400 mb-1">Welcome to PAN African Express.</p>
                                <p className="text-ink-300 text-sm mb-6">Check your inbox to verify your email, then sign in.</p>
                                <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                                    <motion.div className="h-full bg-red-brand rounded-full"
                                        initial={{ width: 0 }} animate={{ width: "100%" }}
                                        transition={{ duration: 4.5, ease: "linear" }} />
                                </div>
                                <p className="text-ink-300 text-xs mt-3">Redirecting to sign in…</p>
                            </motion.div>
                        ) : (
                            <motion.div key="form">
                                <div className="mb-8">
                                    <h1 className="text-4xl font-bold text-ink-900 mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                        Create account
                                    </h1>
                                    <p className="text-ink-400">Start shipping across Nigeria today — it&apos;s free</p>
                                </div>

                                {/* ── Account Type Selector ── */}
                                <div className="mb-6">
                                    <p className={labelCls + " mb-3"}>Account Type</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {ACCOUNT_TYPES.map(({ type, label, sub, icon: Icon, perks }) => {
                                            const active = accountType === type;
                                            return (
                                                <button key={type} type="button" onClick={() => setAccountType(type)}
                                                    className={`relative text-left rounded-2xl border-2 p-4 transition-all duration-200 ${active
                                                            ? "border-red-brand bg-red-brand/5 shadow-lg shadow-red-brand/10"
                                                            : "border-surface-200 bg-surface-50 hover:border-red-brand/30 hover:bg-red-brand/[0.02]"
                                                        }`}>
                                                    {/* Active indicator */}
                                                    {active && (
                                                        <motion.div layoutId="account-type-indicator"
                                                            className="absolute top-3 right-3 w-4 h-4 bg-red-brand rounded-full flex items-center justify-center">
                                                            <div className="w-2 h-2 bg-white rounded-full" />
                                                        </motion.div>
                                                    )}
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${active ? "bg-red-brand text-white" : "bg-surface-200 text-ink-400"
                                                        }`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <p className={`font-bold text-sm ${active ? "text-red-brand" : "text-ink-700"}`}>{label}</p>
                                                    <p className="text-ink-400 text-[11px] mt-0.5 mb-3 leading-relaxed">{sub}</p>
                                                    <ul className="space-y-1">
                                                        {perks.map(p => (
                                                            <li key={p} className="flex items-start gap-1.5">
                                                                <CheckCircle2 className={`w-3 h-3 mt-0.5 flex-shrink-0 ${active ? "text-red-brand" : "text-ink-300"}`} />
                                                                <span className="text-[10px] text-ink-400 leading-relaxed">{p}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {accountType === "business" && (
                                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                                            className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            <Building2 className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                            <p className="text-amber-700 text-[11px] font-medium">
                                                Business accounts get access to the merchant dashboard, bulk rate and API keys after signup.
                                            </p>
                                        </motion.div>
                                    )}
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">

                                    {/* Full Name */}
                                    <div className="space-y-2">
                                        <label className={labelCls}>
                                            {accountType === "business" ? "Contact Name" : "Full Name"}
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300 pointer-events-none" />
                                            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                                                placeholder={accountType === "business" ? "Emeka Okafor (Contact Person)" : "Emeka Okafor"}
                                                className={inputCls} />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label className={labelCls}>
                                            {accountType === "business" ? "Business Email" : "Email Address"}
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300 pointer-events-none" />
                                            <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                                                placeholder={accountType === "business" ? "you@company.com" : "you@example.com"}
                                                className={inputCls} />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-2">
                                        <label className={labelCls}>Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300 pointer-events-none" />
                                            <input type={show ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                                                placeholder="Min. 6 characters"
                                                className={inputCls.replace("pr-5", "pr-14")} />
                                            <button type="button" onClick={() => setShow(s => !s)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-ink-300 hover:text-ink-600 rounded-lg hover:bg-surface-100 transition-all">
                                                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <StrengthBar password={password} />
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                            className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                                            <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-red-700 text-sm font-semibold">{error}</p>
                                        </motion.div>
                                    )}

                                    <button type="submit" disabled={isPending}
                                        className="w-full bg-red-brand hover:bg-red-dark disabled:opacity-60 text-white py-4 rounded-2xl font-bold text-[15px] transition-all shadow-lg shadow-red-brand/25 hover:shadow-red-brand/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-2">
                                        {isPending
                                            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            : <><span>Create {accountType === "business" ? "Business" : ""} Account</span><ArrowRight className="w-4 h-4" /></>}
                                    </button>
                                </form>

                                <div className="flex items-center gap-4 my-8">
                                    <div className="flex-1 h-px bg-surface-200" />
                                    <span className="text-ink-300 text-xs font-semibold">OR</span>
                                    <div className="flex-1 h-px bg-surface-200" />
                                </div>

                                <p className="text-ink-400 text-sm text-center mb-4">Already have an account?</p>
                                <Link href="/login"
                                    className="w-full flex items-center justify-center gap-2 border-2 border-surface-200 hover:border-red-brand/30 hover:bg-red-brand/5 text-ink-700 hover:text-red-brand py-4 rounded-2xl font-bold text-[15px] transition-all">
                                    Sign In Instead <ArrowRight className="w-4 h-4" />
                                </Link>

                                <p className="text-center text-ink-300 text-xs mt-8 leading-relaxed">
                                    By registering you agree to our{" "}
                                    <span className="text-ink-500 cursor-pointer hover:text-red-brand transition-colors">Terms</span>{" "}
                                    and{" "}
                                    <span className="text-ink-500 cursor-pointer hover:text-red-brand transition-colors">Privacy Policy</span>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
