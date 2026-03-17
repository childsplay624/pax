"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, MapPin, Clock, ChevronRight, LogOut, User, ArrowRight, CheckCircle2, Truck, AlertCircle, Plus, Search, Wallet, ShieldCheck, Heart, Bike, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
    confirmed:        "bg-blue-500/10 text-blue-600 border-blue-500/20",
    collected:        "bg-purple-500/10 text-purple-600 border-purple-500/20",
    in_transit:       "bg-amber-500/10 text-amber-600 border-amber-500/20",
    at_hub:           "bg-orange-500/10 text-orange-600 border-orange-500/20",
    out_for_delivery: "bg-sky-500/10 text-sky-600 border-sky-500/20",
    delivered:        "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    failed:           "bg-red-500/10 text-red-600 border-red-500/20",
};

const STATUS_LABELS: Record<string, string> = {
    confirmed:        "Confirmed", 
    collected:        "Collected", 
    in_transit:       "In Transit",
    at_hub:           "At Hub", 
    out_for_delivery: "Out for Delivery", 
    delivered:        "Delivered", 
    failed:           "Failed",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
    confirmed:        CheckCircle2, 
    collected:        Package, 
    in_transit:       Truck,
    at_hub:           MapPin, 
    out_for_delivery: Truck, 
    delivered:        CheckCircle2, 
    failed:           AlertCircle,
};

const BOX = "bg-white border border-surface-200 rounded-[2rem] shadow-sm overflow-hidden";
const ACCENT_BAR = "w-1.5 h-5 rounded-full";

export default function AccountPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ email: string; id: string; name: string; role?: string } | null>(null);
    const [shipments, setShipments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (!data.user) { router.push("/login?redirect=/account"); return; }
            setUser({ 
                email: data.user.email!, 
                id: data.user.id,
                name: (data.user.user_metadata?.full_name as string) || data.user.email?.split("@")[0] || "User"
            });

            // Fetch profile for role
            (supabase.from("profiles") as any).select("account_type").eq("id", data.user.id).single()
                .then((res: any) => {
                    if (res.data) {
                        setUser(u => u ? { ...u, role: res.data.account_type } : null);
                    }
                });

            supabase
                .from("shipments")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(20)
                .then(({ data: rows }) => {
                    setShipments(rows ?? []);
                    setLoading(false);
                });
        });
    }, []);

    const stats = {
        total: shipments.length,
        delivered: shipments.filter(s => s.status === "delivered").length,
        active: shipments.filter(s => !["delivered", "failed"].includes(s.status)).length,
    };

    return (
        <div className="bg-surface-50 min-h-screen pt-32 pb-24 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(220,38,38,0.08),transparent)] pointer-events-none" />
            
            <div className="relative z-10 max-w-6xl mx-auto px-6 space-y-8">

                {/* ── Header Row ── */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-2 mb-2">
                             <div className="bg-red-brand/10 text-red-brand text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                                Personal Account
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-ink-900 tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            {loading ? "Welcome back" : `Hi, ${user?.name} 👋`}
                        </h1>
                        <p className="text-ink-400 text-lg mt-1 font-medium">{user?.email}</p>
                    </motion.div>

                    <div className="flex items-center gap-3">
                        <Link href="/book" 
                            className="bg-red-brand hover:bg-red-dark text-white px-8 py-4 rounded-full font-bold text-sm shadow-xl shadow-red-brand/20 transition-all hover:-translate-y-0.5 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Book New Package
                        </Link>
                        <button onClick={() => signOut()}
                            className="bg-white hover:bg-surface-50 text-ink-600 border border-surface-200 px-4 py-4 rounded-full transition-all hover:text-red-brand">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ── Stat Row ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                        { label: "Total Shipments", val: stats.total, icon: Package, color: "text-blue-600", bg: "bg-blue-500/10", accent: "bg-blue-500" },
                        { label: "Items in Transit", val: stats.active, icon: Truck, color: "text-amber-600", bg: "bg-amber-500/10", accent: "bg-amber-500" },
                        { label: "Successfully Delivered", val: stats.delivered, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10", accent: "bg-emerald-500" },
                    ].map((s, i) => (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className={cn(BOX, "p-8 group hover:border-red-brand/20 transition-colors backdrop-blur-sm bg-white/80")}>
                            <div className="flex items-center justify-between mb-6">
                                <div className={cn("w-12 h-12 rounded-[1.25rem] flex items-center justify-center", s.bg)}>
                                    <s.icon className={cn("w-6 h-6", s.color)} />
                                </div>
                                <div className={cn(ACCENT_BAR, s.accent, "opacity-20")} />
                            </div>
                            <h3 className="text-4xl font-bold text-ink-900" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                {loading ? "—" : s.val}
                            </h3>
                            <p className="text-ink-400 text-sm font-semibold uppercase tracking-widest mt-1">{s.label}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* ── Main Content: Recent History ── */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className={cn(BOX, "bg-white/90 backdrop-blur-sm h-full flex flex-col")}>
                            <div className="px-8 py-6 border-b border-surface-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn(ACCENT_BAR, "bg-red-brand")} />
                                    <h2 className="text-xl font-bold text-ink-900" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Recent Shipments</h2>
                                </div>
                                <div className="hidden sm:flex items-center gap-1 bg-surface-50 border border-surface-100 px-3 py-1.5 rounded-full">
                                    <Clock className="w-3.5 h-3.5 text-ink-400" />
                                    <span className="text-ink-400 text-[10px] font-bold uppercase tracking-wider">Live Updates</span>
                                </div>
                            </div>

                            <div className="flex-1">
                                {loading ? (
                                    <div className="p-8 space-y-6">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-surface-100 rounded-2xl animate-pulse" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 w-32 bg-surface-100 rounded animate-pulse" />
                                                    <div className="h-3 w-48 bg-surface-100 rounded animate-pulse" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : shipments.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <div className="w-20 h-20 bg-surface-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                                            <Package className="w-10 h-10 text-ink-200" />
                                        </div>
                                        <h3 className="text-xl font-bold text-ink-900 mb-2">No shipments yet</h3>
                                        <p className="text-ink-400 mb-8 max-w-xs mx-auto">Your parcel history is empty. Start shipping to see tracking updates here.</p>
                                        <Link href="/book" className="text-red-brand font-bold flex items-center justify-center gap-2 hover:gap-3 transition-all">
                                            Book your first shipment <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-surface-100">
                                        {shipments.map((s, i) => {
                                            const Icon = STATUS_ICONS[s.status] ?? Package;
                                            return (
                                                <Link key={s.id} href={`/tracking?id=${s.tracking_id}`}>
                                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                                        className="px-8 py-6 flex items-center gap-6 hover:bg-surface-50 transition-all group">
                                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-transform group-hover:scale-110", STATUS_COLORS[s.status] ?? "bg-surface-100 text-ink-400 border-surface-200")}>
                                                            <Icon className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="font-bold text-ink-900 font-mono tracking-tight">{s.tracking_id}</p>
                                                                <span className={cn("text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border", STATUS_COLORS[s.status] ?? "bg-surface-100 text-ink-400 border-surface-200")}>
                                                                    {STATUS_LABELS[s.status] ?? s.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-ink-400 text-xs font-medium truncate">
                                                                {s.origin_city} 
                                                                <ArrowRight className="inline-block w-3 h-3 mx-1 opacity-40 text-red-brand" />
                                                                {s.destination_city}
                                                                {s.recipient_name && <span className="text-ink-300 ml-2">· To {s.recipient_name}</span>}
                                                            </p>
                                                        </div>
                                                        <div className="text-right flex-shrink-0 flex items-center gap-4">
                                                            <div className="hidden sm:block">
                                                                <p className="text-ink-900 font-bold text-sm">
                                                                    {new Date(s.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                                                                </p>
                                                                <p className="text-ink-300 text-[10px] uppercase font-bold tracking-tighter">Ordered Date</p>
                                                            </div>
                                                            <div className="w-10 h-10 rounded-full border border-surface-200 flex items-center justify-center group-hover:bg-red-brand group-hover:border-red-brand group-hover:text-white transition-all shadow-sm">
                                                                <ChevronRight className="w-5 h-5" />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Side Actions: Quick Tools ── */}
                    <div className="space-y-6">
                        
                        {/* Help Center Section */}
                        <div className={cn(BOX, "p-8 bg-black border-none shadow-2xl")}>
                             <div className="flex items-center gap-3 mb-8">
                                <div className={cn(ACCENT_BAR, "bg-red-brand")} />
                                <h2 className="text-xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Help Center</h2>
                            </div>
                            
                            <div className="space-y-3">
                                {[
                                    { label: "Track Package",   icon: Search,      href: "/tracking",        color: "bg-blue-400/10 text-blue-400" },
                                    { label: "Book Pickup",     icon: MapPin,      href: "/book?type=pickup", color: "bg-red-400/10 text-red-400" },
                                    { label: "Pricing Calculator", icon: Wallet,   href: "/pricing",         color: "bg-emerald-400/10 text-emerald-400" },
                                    { label: "Safety Tips",    icon: ShieldCheck, href: "/about",           color: "bg-purple-400/10 text-purple-400" },
                                ].map((tool, i) => (
                                    <Link key={tool.label} href={tool.href}>
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 + 0.4 }}
                                            className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all group">
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105", tool.color)}>
                                                <tool.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-white font-bold text-sm">{tool.label}</span>
                                        </motion.div>
                                    </Link>
                                ))}

                                {/* Become a Rider - Now inside Help Center */}
                                {user?.role === "personal" && (
                                    <Link href="/riders/apply">
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
                                            className="flex items-center gap-4 p-4 rounded-2xl bg-red-brand/10 border border-red-brand/20 hover:bg-red-brand/20 transition-all group overflow-hidden relative">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-red-brand/10 rounded-full -mr-8 -mt-8 blur-xl" />
                                            <div className="w-10 h-10 rounded-xl bg-red-brand text-white flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-lg shadow-red-brand/20">
                                                <Bike className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-white font-bold text-sm block leading-none">Become a Rider</span>
                                                <span className="text-red-400 text-[10px] font-bold uppercase tracking-widest mt-1 block">Earn with PAV</span>
                                            </div>
                                            <Zap className="w-4 h-4 text-red-brand/40 animate-pulse" />
                                        </motion.div>
                                    </Link>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5">
                                <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                                    <Heart className="w-5 h-5 text-red-brand mb-3" />
                                    <p className="text-white text-xs font-bold mb-1">Need assistance?</p>
                                    <p className="text-white/40 text-[10px] leading-relaxed mb-4">Our support team is available 24/7 to help with your deliveries.</p>
                                    <Link href="/contact" className="text-red-400 text-xs font-bold hover:text-red-300 transition-colors flex items-center gap-1">
                                        Chat with us <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Promo / Info Box */}
                        <div className={cn(BOX, "p-8 bg-gradient-to-br from-blue-600 to-indigo-700 border-none relative overflow-hidden group shadow-xl shadow-blue-900/10")}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-2xl" />
                            
                            <Package className="w-8 h-8 text-white/40 mb-4 group-hover:translate-x-1 transition-transform" />
                            <h3 className="text-white font-bold text-xl leading-tight mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                Ship at scale?<br />Try Business.
                            </h3>
                            <p className="text-white/60 text-xs leading-relaxed mb-6 font-medium">Get lower rates, bulk API access, and monthly invoicing.</p>
                            <Link href="/register?type=business" 
                                className="inline-block bg-white text-blue-700 px-6 py-2.5 rounded-full font-bold text-xs shadow-lg shadow-black/10 hover:shadow-black/20 transition-all active:scale-95">
                                Explore Business Account
                            </Link>
                        </div>


                    </div>

                </div>

            </div>
        </div>
    );
}
