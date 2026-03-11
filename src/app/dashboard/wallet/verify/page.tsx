"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { verifyAndCreditWallet } from "@/app/actions/payments";
import Link from "next/link";

function VerifyContent() {
    const params   = useSearchParams();
    const router   = useRouter();
    const reference = params.get("reference") ?? params.get("trxref");

    const [state, setState] = useState<"loading" | "success" | "error">("loading");
    const [amount, setAmount] = useState(0);
    const [error,  setError]  = useState("");

    useEffect(() => {
        if (!reference) {
            setState("error");
            setError("No payment reference found.");
            return;
        }

        verifyAndCreditWallet(reference).then(res => {
            if (res.success) {
                setAmount(res.amount);
                setState("success");
                // Auto-redirect after 4s
                setTimeout(() => router.push("/dashboard/wallet"), 4000);
            } else {
                setError(res.error ?? "Verification failed");
                setState("error");
            }
        });
    }, [reference, router]);

    const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

    return (
        <div className="min-h-screen bg-[#0c0c10] flex items-center justify-center px-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#111116] border border-white/[0.08] rounded-3xl p-12 w-full max-w-md text-center shadow-2xl shadow-black/60"
            >
                {state === "loading" && (
                    <>
                        <div className="w-20 h-20 bg-white/[0.06] rounded-full flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="w-9 h-9 text-white/40 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            Verifying Payment
                        </h2>
                        <p className="text-white/30 text-sm">Please wait — this only takes a moment…</p>
                    </>
                )}

                {state === "success" && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                        </motion.div>
                        <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            Payment Successful!
                        </h2>
                        <p className="text-white/40 text-sm mb-6">Your wallet has been credited</p>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-8 py-5 mb-8">
                            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Amount Credited</p>
                            <p className="text-4xl font-bold text-emerald-400" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                {fmt(amount)}
                            </p>
                        </div>
                        <p className="text-white/20 text-xs mb-6">Redirecting to your wallet in 4 seconds…</p>
                        <Link href="/dashboard/wallet"
                            className="flex items-center justify-center gap-2 bg-red-brand hover:bg-red-dark text-white py-3.5 rounded-2xl font-bold transition-all">
                            Go to Wallet <ArrowRight className="w-4 h-4" />
                        </Link>
                    </>
                )}

                {state === "error" && (
                    <>
                        <div className="w-20 h-20 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            Payment Failed
                        </h2>
                        <p className="text-white/30 text-sm mb-8">{error}</p>
                        <div className="flex gap-3">
                            <Link href="/dashboard/wallet"
                                className="flex-1 bg-white/[0.06] border border-white/[0.1] text-white py-3.5 rounded-2xl font-bold text-sm text-center hover:bg-white/[0.1] transition-all">
                                Back to Wallet
                            </Link>
                            <button onClick={() => window.location.reload()}
                                className="flex-1 bg-red-brand hover:bg-red-dark text-white py-3.5 rounded-2xl font-bold text-sm transition-all">
                                Try Again
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}

export default function WalletVerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0c0c10] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}
