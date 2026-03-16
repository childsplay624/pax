"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Clock, Info, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getNotifications, markAllAsRead, markNotificationAsRead } from "@/app/actions/notifications";
import { supabase } from "@/lib/supabase";

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    link?: string;
    read_at: string | null;
    created_at: string;
}

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read_at).length;

    const fetchNotifications = async () => {
        const data = await getNotifications();
        setNotifications(data as any[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchNotifications();

        // ── Real-time Supabase Subscription ──
        const channel = supabase.channel("realtime-notifications")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
                setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 20));
            })
            .subscribe();

        // Close on click outside
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            supabase.removeChannel(channel);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleMarkAll = async () => {
        await markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    };

    const handleMarkRead = async (id: string) => {
        await markNotificationAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    };

    const typeIcons = {
        info: <Info className="w-4 h-4 text-blue-400" />,
        success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
        warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        error: <X className="w-4 h-4 text-red-brand" />,
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    "relative p-2 rounded-xl transition-all",
                    open ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
                )}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-brand rounded-full text-[10px] text-white font-bold flex items-center justify-center border-2 border-[#111116] animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#16161e] border border-white/[0.08] rounded-2xl shadow-2xl z-[100] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between bg-white/[0.02]">
                            <h3 className="text-white font-bold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAll}
                                    className="text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-300 transition-colors flex items-center gap-1"
                                >
                                    <Check className="w-3 h-3" /> Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="p-10 text-center"><div className="w-6 h-6 border-2 border-red-brand border-t-transparent rounded-full animate-spin mx-auto" /></div>
                            ) : notifications.length === 0 ? (
                                <div className="p-10 text-center">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Bell className="w-5 h-5 text-white/20" />
                                    </div>
                                    <p className="text-white/30 text-xs font-semibold uppercase tracking-widest">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => !n.read_at && handleMarkRead(n.id)}
                                        className={cn(
                                            "px-5 py-4 border-b border-white/[0.04] transition-colors cursor-pointer group hover:bg-white/[0.03]",
                                            !n.read_at ? "bg-red-brand/5" : "opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <div className="flex gap-4">
                                            <div className="mt-1 flex-shrink-0">
                                                {typeIcons[n.type] || typeIcons.info}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                    <p className="text-white font-bold text-sm truncate" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{n.title}</p>
                                                    {!n.read_at && <div className="w-1.5 h-1.5 rounded-full bg-red-brand" />}
                                                </div>
                                                <p className="text-white/50 text-xs leading-relaxed mb-2 line-clamp-2">{n.message}</p>
                                                <div className="flex items-center gap-1.5 text-white/20 text-[9px] font-bold uppercase tracking-widest">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {new Date(n.created_at).toLocaleDateString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 bg-white/[0.02] border-t border-white/[0.07] text-center">
                            <button className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] hover:text-white/40 transition-colors">
                                View Notification Settings
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

