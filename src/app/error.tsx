"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        console.error("[Route Error]", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#0c0c10] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-lg mx-auto">

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8"
                >
                    <AlertTriangle className="w-10 h-10 text-amber-400" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-5">
                        <span className="text-amber-400 text-[10px] font-bold uppercase tracking-[0.3em]">An Error Occurred</span>
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Oops! Something broke
                    </h1>
                    <p className="text-white/40 text-base mb-10 leading-relaxed">
                        We hit an unexpected issue loading this page. You can try again or go back.
                    </p>

                    {error?.digest && (
                        <p className="text-white/15 text-[10px] font-mono mb-6">
                            Reference: {error.digest}
                        </p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => reset()}
                            className="flex items-center justify-center gap-2 bg-red-brand hover:bg-red-dark text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-brand/20 hover:-translate-y-0.5"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Go Back
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
