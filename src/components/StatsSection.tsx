"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring, animate } from "framer-motion";
import { Package, Clock, MapPin, Star } from "lucide-react";

const stats = [
    { icon: MapPin, value: 37, suffix: "", label: "States & Territories", sub: "All 36 states + FCT covered" },
    { icon: Package, value: 1000, suffix: "+", label: "Parcels Delivered Daily", sub: "Growing every week" },
    { icon: Clock, value: 98, suffix: "%", label: "On-Time Delivery Rate", sub: "Tracked, confirmed, reliable" },
    { icon: Star, value: 100, suffix: "%", label: "Shipments Insured", sub: "Your parcels are always protected" },
];

const AnimatedNumber = ({ target, suffix }: { target: number; suffix: string }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: "-50px" });
    const motionVal = useMotionValue(0);
    const spring = useSpring(motionVal, { stiffness: 60, damping: 18 });

    useEffect(() => {
        if (inView) { animate(motionVal, target, { duration: 1.8, ease: [0.16, 1, 0.3, 1] }); }
    }, [inView, motionVal, target]);

    useEffect(() => {
        return spring.on("change", (v) => {
            if (ref.current) ref.current.textContent = Math.round(v).toLocaleString() + suffix;
        });
    }, [spring, suffix]);

    return <span ref={ref} className="">0{suffix}</span>;
};

const StatsSection = () => (
    <section className="bg-surface-0 border-y border-surface-200 py-20 overflow-hidden relative">
        {/* subtle red tint */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-brand/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-brand/30 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_100%_at_50%_50%,rgba(220,38,38,0.03),transparent)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="text-center mb-16">
                <span className="text-red-brand font-bold text-[11px] uppercase tracking-[0.35em] block mb-3">By the Numbers</span>
                <h2 className="text-3xl md:text-5xl font-bold text-ink-900 tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    Nigeria-wide, and growing.
                </h2>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="relative group"
                    >
                        <div className="card p-8 text-center h-full">
                            <div className="inline-flex p-3 bg-red-brand/8 rounded-2xl mb-5 group-hover:bg-red-brand transition-colors">
                                <s.icon className="w-5 h-5 text-red-brand group-hover:text-white transition-colors" />
                            </div>
                            <div className="text-4xl md:text-5xl font-bold text-ink-900 mb-2 tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                <AnimatedNumber target={s.value} suffix={s.suffix} />
                            </div>
                            <p className="text-sm font-bold text-ink-700 mb-1">{s.label}</p>
                            <p className="text-xs text-ink-400 leading-relaxed">{s.sub}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

export default StatsSection;
