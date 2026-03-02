"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/* ── Nigerian hub data ──────────────────────────────────────── */
const hubs = [
    { id: "lagos", name: "Lagos", region: "SW", x: 13, y: 68, major: true },
    { id: "abuja", name: "Abuja (FCT)", region: "NC", x: 42, y: 44, major: true },
    { id: "kano", name: "Kano", region: "NW", x: 48, y: 18, major: true },
    { id: "ph", name: "Port Harcourt", region: "SS", x: 34, y: 75, major: true },
    { id: "ibadan", name: "Ibadan", region: "SW", x: 18, y: 60, major: false },
    { id: "enugu", name: "Enugu", region: "SE", x: 48, y: 62, major: false },
    { id: "kaduna", name: "Kaduna", region: "NW", x: 44, y: 28, major: false },
    { id: "benin", name: "Benin City", region: "SS", x: 26, y: 66, major: false },
    { id: "onitsha", name: "Onitsha", region: "SE", x: 40, y: 65, major: false },
    { id: "jos", name: "Jos", region: "NC", x: 52, y: 34, major: false },
    { id: "ilorin", name: "Ilorin", region: "NC", x: 28, y: 50, major: false },
    { id: "warri", name: "Warri", region: "SS", x: 22, y: 72, major: false },
];

/* ── Route arcs between major hubs ─────────────────────────── */
const routes = [
    { from: "lagos", to: "abuja" },
    { from: "lagos", to: "ph" },
    { from: "abuja", to: "kano" },
    { from: "abuja", to: "ph" },
    { from: "kano", to: "ph" },
    { from: "lagos", to: "kano" },
];

/* ── Build SVG quadratic arc between two hub points ─────────── */
function arc(h1: typeof hubs[0], h2: typeof hubs[0]) {
    const x1 = h1.x; const y1 = h1.y;
    const x2 = h2.x; const y2 = h2.y;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 - 18;
    return `M ${x1},${y1} Q ${mx},${my} ${x2},${y2}`;
}

const statusItems = [
    { label: "Lagos HQ", status: "Online", ok: true },
    { label: "Abuja Hub", status: "Online", ok: true },
    { label: "Kano Depot", status: "Online", ok: true },
    { label: "Port Harcourt", status: "Online", ok: true },
    { label: "State Coverage", status: "37 / 37", ok: true },
];

let routeIdx = 0;

const GlobeSection = () => {
    const [activeRoute, setActiveRoute] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            routeIdx = (routeIdx + 1) % routes.length;
            setActiveRoute(routeIdx);
        }, 2200);
        return () => clearInterval(id);
    }, []);

    const getHub = (id: string) => hubs.find(h => h.id === id)!;

    return (
        <section className="bg-surface-0 py-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-stretch">

                    {/* ── Left copy ── */}
                    <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                        <span className="text-red-brand text-[11px] font-bold uppercase tracking-[0.35em] block mb-5">Our Network</span>
                        <h2 className="text-4xl md:text-6xl font-bold text-ink-900 tracking-tight mb-8 leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            Every State.<br />Every LGA.<br />
                            <span className="gradient-text-red">One Network.</span>
                        </h2>
                        <p className="text-ink-400 text-lg leading-relaxed mb-10 max-w-md">
                            From Sokoto to Calabar, Maiduguri to Lagos — our logistics network connects all 36 states and the FCT with fast, trackable delivery.
                            We're building the infrastructure for pan-African expansion, one route at a time.
                        </p>

                        {/* Hub status */}
                        <div className="space-y-3">
                            {statusItems.map((s) => (
                                <div key={s.label} className="flex items-center justify-between p-4 bg-surface-50 border border-surface-200 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${s.ok ? "bg-red-brand" : "bg-ink-300"}`} />
                                        <span className="text-sm font-semibold text-ink-700">{s.label}</span>
                                    </div>
                                    <span className={`text-xs font-bold ${s.ok ? "text-red-brand" : "text-ink-400"}`}>{s.status}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex items-center gap-6 text-xs font-semibold text-ink-400">
                            <div className="flex items-center gap-2"><div className="w-8 h-px bg-red-brand" /><span>Express Route</span></div>
                            <div className="flex items-center gap-2"><div className="w-8 h-px bg-red-brand/30" /><span>Standard Route</span></div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-brand" /><span>Major Hub</span></div>
                        </div>
                    </motion.div>

                    {/* ── Right: Nigeria network map ── */}
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="flex flex-col">
                        <div className="relative bg-ink-900 rounded-[2rem] overflow-hidden border border-surface-200 shadow-xl flex-1 min-h-[520px]">

                            {/* Grid overlay */}
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                {Array.from({ length: 11 }).map((_, i) => (
                                    <line key={`v${i}`} x1={i * 10} y1={0} x2={i * 10} y2={100} stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />
                                ))}
                                {Array.from({ length: 11 }).map((_, i) => (
                                    <line key={`h${i}`} x1={0} y1={i * 10} x2={100} y2={i * 10} stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />
                                ))}

                                {/* Route arcs — all dimmed */}
                                {routes.map((r, i) => {
                                    const h1 = getHub(r.from); const h2 = getHub(r.to);
                                    return (
                                        <path key={i} d={arc(h1, h2)}
                                            fill="none" stroke="rgba(220,38,38,0.12)" strokeWidth="0.6" strokeDasharray="2 2" />
                                    );
                                })}

                                {/* Active route arc — animated */}
                                {(() => {
                                    const r = routes[activeRoute];
                                    const h1 = getHub(r.from); const h2 = getHub(r.to);
                                    const d = arc(h1, h2);
                                    return (
                                        <path key={activeRoute} d={d}
                                            fill="none" stroke="#dc2626" strokeWidth="1.2" strokeDasharray="40" strokeLinecap="round"
                                            style={{ animation: "flight-path 2.2s linear infinite" }} />
                                    );
                                })()}

                                {/* Hub dots */}
                                {hubs.map((h, hi) => (
                                    <g key={h.id}>
                                        {h.major && (
                                            <circle cx={h.x} cy={h.y} r="4" fill="rgba(220,38,38,0.12)"
                                                style={{ animation: `pulse-ring 3s ease-out ${(hi * 0.55) % 2}s infinite` }} />
                                        )}
                                        <circle cx={h.x} cy={h.y} r={h.major ? 2.5 : 1.5}
                                            fill={h.major ? "#dc2626" : "rgba(220,38,38,0.5)"} />
                                    </g>
                                ))}
                            </svg>

                            {/* Hub labels */}
                            {hubs.filter(h => h.major).map(h => (
                                <div key={h.id} className="absolute text-[9px] font-bold text-white/70 uppercase tracking-widest pointer-events-none"
                                    style={{ left: `${h.x + 2}%`, top: `${h.y - 5}%`, transform: "translate(-50%,-50%)" }}>
                                    {h.name}
                                </div>
                            ))}

                            {/* HUD top bar */}
                            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 bg-black/30 backdrop-blur-md border-b border-white/[0.06]">
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-400">PAX Network · Nigeria</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-brand animate-pulse" />
                                    <span className="text-[10px] font-semibold text-white/40">Live</span>
                                </div>
                            </div>

                            {/* HUD bottom bar */}
                            <div className="absolute bottom-0 left-0 right-0 px-5 py-3 bg-black/30 backdrop-blur-md border-t border-white/[0.06] flex justify-between">
                                <span className="text-[9px] text-white/30 font-semibold uppercase tracking-widest">Active Routes: {routes.length}</span>
                                <span className="text-[9px] text-white/20">Expanding to West Africa 2026</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default GlobeSection;
