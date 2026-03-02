"use client";

import { motion } from "framer-motion";
import { Truck, Globe, Package, Layers, ArrowRight, Gauge, Headphones, Shield, Clock } from "lucide-react";
import ServiceCard from "@/components/ServiceCard";
import StatsSection from "@/components/StatsSection";

const serviceSections = [
    {
        id: "interstate",
        title: "Interstate Delivery",
        tagline: "Lagos to Kano. Abuja to PH.",
        description: "Our signature service — fast, reliable door-to-door parcel delivery between any two states in Nigeria. With real-time tracking and confirmed handover at every step.",
        icon: Truck,
        features: ["Next-day Express (Key Cities)", "2–3 Day Standard Nationwide", "Weekend & Public Holiday Delivery", "Signature on Delivery"],
        imageUrl: "/images/van.png",
    },
    {
        id: "same-day",
        title: "Same-Day City Delivery",
        tagline: "Delivered before sunset.",
        description: "Urgent within-city deliveries for Lagos, Abuja, Kano, and Port Harcourt — collected and delivered same day, with live courier tracking.",
        icon: Clock,
        features: ["Intra-Lagos Same-Day", "Abuja Metro Express", "Live Rider Tracking", "Collection within 2 Hours"],
        imageUrl: "/images/hero.png",
    },
    {
        id: "ecommerce",
        title: "E-commerce Fulfilment",
        tagline: "Power your online store.",
        description: "Fulfilment centres in Lagos and Abuja handle your inventory so you focus on sales. Automated label printing, packing, and returns included.",
        icon: Layers,
        features: ["Warehousing in Lagos & Abuja", "WMS & Shopify Integration", "Automated Pick & Pack", "Returns Management"],
        imageUrl: "/images/sorting.png",
    },
    {
        id: "business",
        title: "Corporate Bulk Shipping",
        tagline: "For teams that ship at scale.",
        description: "Monthly contracts, consolidated billing, dedicated account managers, and API integration for companies handling 100+ shipments daily across Nigeria.",
        icon: Package,
        features: ["Consolidated Monthly Invoicing", "Dedicated Account Manager", "API & System Integration", "Priority Collection Slots"],
        imageUrl: "/images/sorting.png",
    },
];

export default function ServicesPage() {
    return (
        <div className="bg-surface-0 pt-32 min-h-screen">

            {/* ── Hero header ── */}
            <section className="px-6 lg:px-12 py-24 max-w-7xl mx-auto text-center relative overflow-hidden">
                <div className="radial-red-center absolute inset-0 pointer-events-none" />
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10">
                    <span className="text-red-brand font-bold uppercase tracking-[0.3em] text-[11px] mb-4 block">Our Service Portfolio</span>
                    <h1 className="text-5xl md:text-8xl font-bold text-ink-900 tracking-tight mb-8 leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Logistics Built<br />
                        <span className="gradient-text-red">for Nigeria.</span>
                    </h1>
                    <p className="max-w-3xl mx-auto text-xl text-ink-400 leading-relaxed">
                        From same-day city runs to interstate freight — every service is designed for Nigeria's roads, routes, and realities.
                        Expanding to the rest of Africa soon.
                    </p>
                </motion.div>
            </section>

            {/* ── Service detail sections ── */}
            <section className="px-6 lg:px-12 py-12 max-w-7xl mx-auto space-y-36 mb-36">
                {serviceSections.map((section, i) => (
                    <motion.div
                        key={section.id} id={section.id}
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-100px" }}
                        className={`flex flex-col ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} gap-24 items-center`}
                    >
                        <div className="flex-1 space-y-8">
                            <div className="space-y-3">
                                <span className="text-red-brand font-bold uppercase tracking-widest text-sm block">{section.tagline}</span>
                                <h2 className="text-4xl md:text-6xl font-bold text-ink-900 tracking-tight leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                    {section.title}
                                </h2>
                            </div>
                            <p className="text-lg text-ink-400 leading-relaxed max-w-xl">{section.description}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {section.features.map((f) => (
                                    <div key={f} className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-red-brand flex-shrink-0" />
                                        <span className="font-semibold text-sm text-ink-700">{f}</span>
                                    </div>
                                ))}
                            </div>
                            <button className="btn-magnetic bg-red-brand text-white px-8 py-4 rounded-full font-bold text-sm flex items-center gap-2 shadow-md shadow-red-brand/20 hover:bg-red-dark transition-colors w-fit">
                                Get a Quote <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 relative group">
                            <div className="absolute -inset-4 bg-red-brand/5 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="relative overflow-hidden rounded-[3rem] border border-surface-200 shadow-xl h-[500px] w-full">
                                <img src={section.imageUrl} alt={section.title} className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[2s]" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </section>

            <StatsSection />

            {/* ── Expansion preview ── */}
            <section className="py-32 bg-ink-900 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(220,38,38,0.12),transparent)] pointer-events-none" />
                <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
                    <span className="text-red-brand font-bold uppercase tracking-[0.35em] text-[11px] block mb-5">Coming Soon</span>
                    <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tight mb-8 leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Nigeria First.<br /><span className="gradient-text-red">Africa Next.</span>
                    </h2>
                    <p className="text-xl text-white/40 leading-relaxed mb-14 max-w-2xl mx-auto">
                        Our roadmap includes cross-border West Africa routes — Ghana, Benin Republic, and beyond — as we scale from a national courier to a continental logistics powerhouse.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="btn-magnetic bg-red-brand hover:bg-red-dark text-white px-10 py-5 rounded-full font-bold text-lg transition-colors shadow-xl shadow-red-brand/30">
                            Register Interest
                        </button>
                        <button className="btn-magnetic bg-white/8 border border-white/15 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-white/15 transition-colors">
                            Our Expansion Roadmap
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Trust strip ── */}
            <section className="py-32 bg-surface-50 border-t border-surface-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
                    <h2 className="text-4xl md:text-6xl font-bold text-ink-900 tracking-tight mb-24" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Our Commitment to You
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { title: "24/7 Support", description: "Track, report, and resolve issues any time — our team is always on.", icon: Headphones },
                            { title: "98% On-Time", description: "We honour delivery windows. If we're late, you hear from us first.", icon: Gauge },
                            { title: "Fully Insured", description: "Every parcel is insured up to declared value with zero hidden clauses.", icon: Shield },
                        ].map((item, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className="flex flex-col items-center group">
                                <div className="p-6 bg-red-brand/8 rounded-3xl mb-8 group-hover:bg-red-brand transition-colors">
                                    <item.icon className="w-8 h-8 text-red-brand group-hover:text-white transition-colors" />
                                </div>
                                <h4 className="text-2xl font-bold text-ink-900 mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{item.title}</h4>
                                <p className="text-ink-400 text-sm leading-relaxed max-w-xs">{item.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
