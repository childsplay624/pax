"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

const FloatingTracker = () => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    const router = useRouter();

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) return;
        router.push(`/tracking?id=${encodeURIComponent(value)}`);
        setOpen(false);
        setValue("");
    };

    return (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-3">
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 12 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-white rounded-2xl border border-surface-200 p-5 w-72 shadow-2xl shadow-ink-900/10"
                        style={{ boxShadow: "0 20px 60px rgba(17,17,24,0.15), 0 0 0 1px rgba(220,38,38,0.12)" }}
                    >
                        {/* Red top accent */}
                        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-red-brand/60 via-red-brand to-red-brand/60" />
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-red-brand" />
                                <span className="text-ink-900 font-bold text-sm">Quick Track</span>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-ink-300 hover:text-ink-900 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleTrack} className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Enter Tracking ID..."
                                autoFocus
                                value={value}
                                onChange={e => setValue(e.target.value)}
                                className="bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-ink-900 text-sm font-semibold placeholder-ink-300 outline-none focus:border-red-brand/40 focus:ring-2 focus:ring-red-brand/10 transition-all"
                            />
                            <button type="submit" className="btn-magnetic bg-red-brand hover:bg-red-dark text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-red-brand/25">
                                <span>Track Now</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB */}
            <motion.button
                onClick={() => setOpen(v => !v)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                className="relative w-14 h-14 bg-red-brand rounded-full shadow-xl shadow-red-brand/40 flex items-center justify-center glow-red transition-shadow"
                aria-label="Quick track"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {open ? (
                        <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <X className="text-white w-5 h-5" />
                        </motion.span>
                    ) : (
                        <motion.span key="pkg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <Package className="text-white w-6 h-6" />
                        </motion.span>
                    )}
                </AnimatePresence>
                {!open && <span className="absolute inset-0 rounded-full border-2 border-red-brand animate-ping opacity-30 pointer-events-none" />}
            </motion.button>
        </div>
    );
};

export default FloatingTracker;
