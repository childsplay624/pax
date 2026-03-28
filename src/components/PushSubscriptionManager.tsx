"use client";

import { useEffect, useState, useRef } from "react";
import { BellRing, ShieldCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { savePushSubscription } from "@/app/actions/notifications";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BDHNGxH7ORPn_hFaQhnWorb6ZXZjwsJxBXW2kbB_uCRN92LHc9pPya2TxJu_VjVMIp18DK1vsCe82a29ZeHix6g";

export function PushSubscriptionManager() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [status, setStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");

    useEffect(() => {
        if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

        if (Notification.permission === "default") {
            // Wait a bit before showing the prompt to avoid annoying the user immediately
            const timer = setTimeout(() => setShowPrompt(true), 3000);
            return () => clearTimeout(timer);
        } else {
            setStatus(Notification.permission as any);
            if (Notification.permission === "granted") {
                syncSubscription();
            }
        }
    }, []);

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const isSyncing = useRef(false);
    const syncSubscription = async () => {
        if (isSyncing.current) return;
        isSyncing.current = true;
        try {
            const registration = await navigator.serviceWorker.register("/sw.js");
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
                });
            }

            const sub = JSON.parse(JSON.stringify(subscription));
            await savePushSubscription(sub);
        } catch (err) {
            console.error("[Push] Sync failed:", err);
        } finally {
            isSyncing.current = false;
        }
    };

    const handleEnable = async () => {
        setStatus("loading");
        const permission = await Notification.requestPermission();
        setStatus(permission as any);
        if (permission === "granted") {
            await syncSubscription();
            setShowPrompt(false);
        }
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="fixed bottom-6 right-6 z-[100] max-w-sm"
                >
                    <div className="bg-[#16161e] border border-white/[0.08] rounded-2xl p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-brand/10 rounded-full blur-[40px] pointer-events-none" />

                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-brand/10 border border-red-brand/20 flex items-center justify-center flex-shrink-0">
                                <BellRing className="w-5 h-5 text-red-brand animate-bounce" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-bold text-sm mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Get Instant Alerts</h4>
                                <p className="text-white/40 text-[11px] leading-relaxed">Don't miss a shipment! Enable browser notifications to get live updates even when your browser is closed.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleEnable}
                                disabled={status === "loading"}
                                className="flex-1 bg-red-brand hover:bg-red-dark text-white py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                            >
                                {status === "loading" ? "Activating..." : "Enable Notifications"}
                            </button>
                            <button
                                onClick={() => setShowPrompt(false)}
                                className="px-4 py-2 text-white/20 hover:text-white/40 transition-colors text-[11px] font-bold uppercase tracking-wider"
                            >
                                Later
                            </button>
                        </div>

                        <button
                            onClick={() => setShowPrompt(false)}
                            className="absolute top-3 right-3 text-white/10 hover:text-white/40 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
