"use client";

import { motion } from "framer-motion";
import { Globe, Shield, Truck, Leaf, Zap, MapPin } from "lucide-react";
import StatsSection from "@/components/StatsSection";

const timelineEvents = [
    { year: "2020", title: "Founded in Lagos", description: "PAN African Express launched as a Lagos-only same-day courier, serving Victoria Island and Lekki.", icon: Zap },
    { year: "2021", title: "Southwest Expansion", description: "Routes extended to Ibadan, Abeokuta, and Sagamu — first interstate corridors live.", icon: Truck },
    { year: "2022", title: "Abuja & North", description: "FCT hub opened. Kaduna and Kano depots followed within months.", icon: MapPin },
    { year: "2023", title: "South-South Coverage", description: "Port Harcourt and Warri integrated. Full Niger-Delta corridor established.", icon: Globe },
    { year: "2024", title: "36 States Achieved", description: "National coverage complete. All 36 states and the FCT connected on a single platform.", icon: Shield },
    { year: "2025+", title: "Africa Expansion", description: "Phase 1 West Africa: Ghana, Benin Republic, and Côte d'Ivoire routes officially in development.", icon: Leaf },
];

const values = [
    { title: "Nigerian-First", description: "Built for our roads, our cities, our people. We understand the logistics landscape from the inside.", icon: Truck },
    { title: "Radical Reliability", description: "We measure ourselves on promises kept — 98% on-time delivery is not a goal, it's a standard.", icon: Shield },
    { title: "Pan-African Vision", description: "Nigeria is the start. Our ultimate mission connects the entire continent with one trusted network.", icon: Globe },
    { title: "Speed at Scale", description: "From a single parcel to 10,000 orders per day — our platform handles both without compromise.", icon: Zap },
];

export default function AboutPage() {
    return (
        <div className="bg-surface-0 pt-32 pb-24 overflow-hidden">

            {/* ── Hero ── */}
            <section className="px-6 lg:px-12 py-24 max-w-7xl mx-auto relative">
                <div className="radial-red-center absolute inset-0 pointer-events-none" />
                <div className="max-w-4xl relative z-10">
                    <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        className="text-red-brand font-bold uppercase tracking-[0.3em] text-[11px] mb-4 block">
                        Our Story
                    </motion.span>
                    <h1 className="text-5xl md:text-8xl font-bold text-ink-900 tracking-tight mb-12 leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Made in Nigeria.<br />
                        <span className="gradient-text-red">Built for Africa.</span>
                    </h1>
                    <p className="max-w-2xl text-xl text-ink-400 leading-relaxed">
                        PAN African Express was born in Lagos with a simple mission — make parcel delivery in Nigeria as reliable as a phone call.
                        Starting from a single city in 2020, we now serve all 36 states and the FCT, with our next chapter taking us across the continent.
                    </p>
                </div>
            </section>

            {/* ── Mission image ── */}
            <section className="px-6 lg:px-12 py-12 max-w-7xl mx-auto">
                <div className="relative overflow-hidden rounded-[3rem] border border-surface-200 shadow-xl h-[500px] w-full group">
                    <img src="/images/hero.png" alt="Our Mission" className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 scale-105 group-hover:scale-100" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight text-center px-8 max-w-3xl" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            "When Nigeria moves, everyone wins."
                        </h2>
                    </div>
                </div>
            </section>

            {/* ── Values ── */}
            <section className="px-6 lg:px-12 py-32 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {values.map((v, i) => (
                    <motion.div key={v.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                        className="card p-10 group">
                        <div className="p-4 bg-red-brand/8 rounded-2xl w-fit mb-8 group-hover:bg-red-brand transition-colors">
                            <v.icon className="w-8 h-8 text-red-brand group-hover:text-white transition-colors" />
                        </div>
                        <h4 className="text-2xl font-bold text-ink-900 mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{v.title}</h4>
                        <p className="text-ink-400 leading-relaxed text-sm">{v.description}</p>
                    </motion.div>
                ))}
            </section>

            <StatsSection />

            {/* ── Timeline ── */}
            <section className="px-6 lg:px-12 py-32 max-w-3xl mx-auto">
                <div className="text-center mb-24">
                    <span className="text-red-brand font-bold uppercase tracking-[0.3em] text-[11px] mb-4 block">Our Journey</span>
                    <h2 className="text-4xl md:text-6xl font-bold text-ink-900 tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        From Lagos to All of Nigeria
                    </h2>
                </div>

                <div className="space-y-16 relative">
                    <div className="absolute left-1/2 -translate-x-1/2 h-full w-px bg-surface-200 hidden md:block" />
                    {timelineEvents.map((e, i) => (
                        <motion.div key={e.year}
                            initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                            className={`flex flex-col md:flex-row items-center ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} relative`}>
                            <div className="flex-1 px-8 md:text-right text-center">
                                <span className="text-6xl font-bold text-ink-900/5 mb-2 block leading-none" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{e.year}</span>
                                <h4 className="text-2xl font-bold text-ink-900 mb-2">{e.title}</h4>
                                <p className="text-ink-400 text-sm leading-relaxed max-w-xs md:ml-auto mx-auto">{e.description}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-red-brand flex items-center justify-center z-10 border-4 border-surface-0 shadow-md shadow-red-brand/30 my-8 md:my-0 flex-shrink-0">
                                <e.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 px-8 hidden md:block" />
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-32 bg-ink-900 text-center relative overflow-hidden">
                <div className="radial-red-center absolute inset-0 pointer-events-none" />
                <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12">
                    <h2 className="text-4xl md:text-8xl font-bold text-white tracking-tight mb-12" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        The Journey Continues.
                    </h2>
                    <p className="text-xl text-white/40 mb-12 leading-relaxed">
                        We're a team of Nigerians building logistics infrastructure for Africa. Come join us.
                    </p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <button className="btn-magnetic bg-red-brand hover:bg-red-dark text-white px-10 py-5 rounded-full font-bold text-lg transition-colors shadow-xl shadow-red-brand/30">
                            View Open Roles
                        </button>
                        <button className="btn-magnetic bg-white/8 border border-white/15 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-white/15 transition-colors">
                            Press Room
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
