"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Package, MapPin, Shield, ArrowRight } from "lucide-react";
import TrackingInput from "./TrackingInput";

/* ── Animated flight paths (Nigeria-scale) ───────────────────── */
const FlightPaths = () => (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
            <linearGradient id="fp-r1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(220,38,38,0)" />
                <stop offset="50%" stopColor="rgba(220,38,38,0.55)" />
                <stop offset="100%" stopColor="rgba(220,38,38,0)" />
            </linearGradient>
            <linearGradient id="fp-r2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(248,113,113,0)" />
                <stop offset="50%" stopColor="rgba(248,113,113,0.35)" />
                <stop offset="100%" stopColor="rgba(248,113,113,0)" />
            </linearGradient>
            <filter id="glow-r"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <path d="M -50,650 C 350,300 700,200 950,350 C 1100,440 1300,350 1500,180"
            fill="none" stroke="url(#fp-r1)" strokeWidth="1.5" strokeDasharray="1200" filter="url(#glow-r)"
            style={{ animation: "flight-path 6s linear 0.5s infinite" }} />
        <path d="M 100,200 C 400,120 750,520 1050,320 C 1220,230 1380,410 1500,550"
            fill="none" stroke="url(#fp-r2)" strokeWidth="1" strokeDasharray="1100"
            style={{ animation: "flight-path 9s linear 2s infinite" }} />
        <path d="M 250,900 C 450,620 720,680 900,400 C 1060,260 1300,320 1500,100"
            fill="none" stroke="url(#fp-r1)" strokeWidth="0.8" strokeDasharray="1300"
            style={{ animation: "flight-path 11s linear 4s infinite" }} />
        {[{ cx: 950, cy: 350 }, { cx: 700, cy: 430 }, { cx: 1050, cy: 320 }].map((d, i) => (
            <g key={i}>
                <circle cx={d.cx} cy={d.cy} r="3" fill="rgba(220,38,38,0.7)" filter="url(#glow-r)" />
                <circle cx={d.cx} cy={d.cy} r="9" fill="none" stroke="rgba(220,38,38,0.2)"
                    style={{ animation: `pulse-ring 2.5s ease-out ${i * 0.8}s infinite` }} />
            </g>
        ))}
    </svg>
);

/* ── Word-by-word headline ───────────────────────────────────── */
const line1 = ["Fast. Reliable."];
const line2 = ["Delivered", "Across", "Nigeria."];

const WordReveal = () => {
    const container = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } };
    const word = { hidden: { y: "110%", opacity: 0 }, visible: { y: "0%", opacity: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } };
    return (
        <motion.div variants={container} initial="hidden" animate="visible">
            <div className="overflow-hidden">
                {line1.map((w) => (
                    <div key={w} className="overflow-hidden">
                        <motion.span variants={word}
                            className="inline-block text-6xl md:text-8xl lg:text-[7rem] font-bold tracking-[-0.04em] leading-none text-white"
                            style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            {w}
                        </motion.span>
                    </div>
                ))}
            </div>
            <div className="overflow-hidden flex flex-wrap gap-x-4 mt-2">
                {line2.map((w, i) => (
                    <div key={w} className="overflow-hidden">
                        <motion.span variants={word}
                            className={`inline-block text-6xl md:text-8xl lg:text-[7rem] font-bold tracking-[-0.04em] leading-none ${i === 2 ? "gradient-text-red glow-text-red" : i === 0 ? "text-white/30" : "text-white"
                                }`}
                            style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            {w}
                        </motion.span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

/* ── Floating badge ──────────────────────────────────────────── */
const FloatingBadge = ({ icon: Icon, label, value, delay, className }: any) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`absolute glass rounded-2xl px-5 py-4 flex items-center gap-3 animate-float ${className}`}
        style={{ animationDelay: `${delay}s` }}
    >
        <div className="p-2 bg-red-brand/15 rounded-xl"><Icon className="w-4 h-4 text-red-brand" /></div>
        <div>
            <span className="block text-white font-bold text-sm leading-none">{value}</span>
            <span className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">{label}</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-red-brand/60 relative">
            <div className="absolute inset-0 rounded-full bg-red-brand animate-ping" />
        </div>
    </motion.div>
);

/* ── Hero ─────────────────────────────────────────────────────── */
const Hero = ({ imageUrl }: { imageUrl: string }) => {
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
    const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.15]);

    return (
        <section ref={ref} className="relative w-full min-h-screen flex items-center pt-28 overflow-hidden">
            {/* Parallax bg */}
            <motion.div className="absolute inset-0 z-0" style={{ y: bgY, scale: bgScale }}>
                <img src={imageUrl} alt="Express Courier" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/95 via-ink-900/70 to-ink-900/50" />
                <div className="absolute inset-0 bg-gradient-to-r from-ink-900/80 via-transparent to-ink-900/40" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_110%,rgba(17,17,24,0.95),transparent)]" />
            </motion.div>

            {/* Grain texture */}
            <div className="absolute inset-0 z-[1] pointer-events-none opacity-[0.025]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "200px" }} />

            {/* Flight paths */}
            <div className="absolute inset-0 z-[2]"><FlightPaths /></div>

            {/* Ambient orbs */}
            <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] bg-red-brand/10 rounded-full blur-[120px] z-[1] pointer-events-none" />
            <div className="absolute bottom-0 right-0   w-[400px] h-[400px] bg-red-brand/6  rounded-full blur-[100px] z-[1] pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-20 w-full">
                <div className="max-w-4xl">
                    {/* Eyebrow */}
                    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                        className="mb-10 inline-flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-full pl-3 pr-5 py-2">
                        <div className="flex items-center gap-1.5 bg-red-brand/20 rounded-full px-3 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            <span className="text-red-400 text-[10px] font-bold uppercase tracking-[0.2em]">Live Network</span>
                        </div>
                        <span className="text-white/50 text-xs font-medium">Lagos · Abuja · Kano · PH · Ibadan & beyond</span>
                    </motion.div>

                    <WordReveal />

                    <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.6 }}
                        className="mt-8 text-lg text-white/55 max-w-lg leading-relaxed">
                        Nigeria's most reliable logistics partner — delivering parcels across all 36 states and the FCT, with door-to-door speed you can count on.
                    </motion.p>
                </div>

                {/* Tracking */}
                <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-14 max-w-2xl">
                    <TrackingInput dark />
                </motion.div>

                {/* CTA row */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="mt-8 flex flex-wrap gap-4">
                    <button className="btn-magnetic bg-red-brand hover:bg-red-dark text-white px-8 py-3.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-brand/30 transition-colors">
                        Send a Parcel <ArrowRight className="w-4 h-4" />
                    </button>
                    <button className="btn-magnetic bg-white/10 backdrop-blur-md border border-white/15 text-white px-8 py-3.5 rounded-full font-bold text-sm hover:bg-white/20 transition-colors">
                        Business Shipping
                    </button>
                </motion.div>

                {/* Floating badges */}
                <div className="hidden lg:block">
                    <FloatingBadge icon={MapPin} label="States Covered" value="36 + FCT" delay={1.6} className="top-12 right-10" />
                    <FloatingBadge icon={Package} label="Parcels / Day" value="1,000+" delay={1.8} className="top-52 right-48" />
                    <FloatingBadge icon={Shield} label="Insured" value="100%" delay={2.0} className="bottom-32 right-10" />
                </div>
            </div>

            {/* Scroll cue */}
            <motion.div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
                <span className="text-white/20 text-[9px] tracking-[0.4em] uppercase font-bold">Scroll</span>
                <div className="w-px h-10 bg-gradient-to-b from-red-brand/60 to-transparent" />
            </motion.div>
        </section>
    );
};

export default Hero;
