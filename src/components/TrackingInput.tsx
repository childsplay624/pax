"use client";

import { useState, useRef } from "react";
import { Package, ChevronRight, Search } from "lucide-react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const TrackingInput = ({ dark = false }: { dark?: boolean }) => {
    const [value, setValue] = useState("");
    const [focused, setFocused] = useState(false);
    const router = useRouter();
    const btnRef = useRef<HTMLButtonElement>(null);

    /* Magnetic physics */
    const mx = useMotionValue(0), my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 150, damping: 15 });
    const sy = useSpring(my, { stiffness: 150, damping: 15 });

    const onMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        const r = btnRef.current?.getBoundingClientRect();
        if (!r) return;
        mx.set((e.clientX - (r.left + r.width / 2)) * 0.3);
        my.set((e.clientY - (r.top + r.height / 2)) * 0.3);
    };
    const onMouseLeave = () => { mx.set(0); my.set(0); };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) router.push(`/tracking?id=${encodeURIComponent(value)}`);
    };

    /* Shared wrapper styles depending on surface */
    const wrapBase = dark
        ? "bg-white/8 backdrop-blur-md border border-white/12 focus-within:border-red-brand/50 focus-within:shadow-[0_0_0_1px_rgba(220,38,38,0.25),0_8px_40px_rgba(220,38,38,0.15)]"
        : "bg-surface-0 border border-surface-200 focus-within:border-red-brand/40 focus-within:shadow-[0_0_0_1px_rgba(220,38,38,0.15),0_8px_40px_rgba(220,38,38,0.08)]";

    const inputColor = dark ? "text-white placeholder-white/25" : "text-ink-900 placeholder-ink-300";
    const iconColor = focused ? "text-red-brand" : dark ? "text-white/30" : "text-ink-300";

    return (
        <form onSubmit={handleSubmit} className="relative">
            {/* Ambient glow behind input — on focus */}
            <motion.div
                animate={{ opacity: focused ? 1 : 0 }}
                transition={{ duration: 0.4 }}
                className="absolute -inset-3 rounded-3xl blur-2xl pointer-events-none"
                style={{ background: "radial-gradient(ellipse, rgba(220,38,38,0.18) 0%, transparent 70%)" }}
            />

            <div className={cn("relative flex flex-col sm:flex-row items-stretch sm:items-center p-2.5 rounded-2xl transition-all duration-400", wrapBase)}>
                <motion.div animate={{ color: focused ? "#dc2626" : undefined }} className={cn("hidden sm:flex items-center px-4", iconColor)}>
                    <Package className="w-5 h-5" />
                </motion.div>

                <input
                    type="text"
                    placeholder="Enter tracking ID, e.g. PAX-738291..."
                    className={cn("flex-1 bg-transparent px-4 py-3.5 text-base font-semibold outline-none", inputColor)}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />

                <motion.button
                    ref={btnRef}
                    type="submit"
                    style={{ x: sx, y: sy }}
                    onMouseMove={onMouseMove}
                    onMouseLeave={onMouseLeave}
                    whileTap={{ scale: 0.96 }}
                    className="mt-2.5 sm:mt-0 relative overflow-hidden bg-red-brand hover:bg-red-dark text-white px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 group/btn transition-colors"
                >
                    {/* Shine sweep */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "150%" }}
                        transition={{ duration: 0.5 }}
                    />
                    <Search className="relative w-4 h-4" />
                    <span className="relative">Track Parcel</span>
                    <ChevronRight className="relative w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                </motion.button>
            </div>

            {/* Sample IDs */}
            <div className="mt-3 flex items-center gap-2 px-1">
                <span className={cn("text-[11px]", dark ? "text-white/30" : "text-ink-300")}>Try:</span>
                {["PAX-738291", "PAX-004421"].map(id => (
                    <button key={id} type="button" onClick={() => setValue(id)}
                        className="text-[11px] text-red-brand hover:text-red-dark underline underline-offset-2 transition-colors font-mono">
                        {id}
                    </button>
                ))}
            </div>
        </form>
    );
};

export default TrackingInput;
