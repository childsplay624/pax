"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, Package, BarChart3, Shield, Truck, CreditCard, Stamp, Box, ShoppingBag, Users, Layers, Tag, Clock, LogIn, LogOut, UserPlus, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/app/actions/auth";

/* ── Mega-menu data ────────────────────────────────────────── */
const megaMenus = {
    Personal: {
        headline: "For Individuals",
        items: [
            { name: "Send a Parcel", desc: "Interstate door-to-door delivery across all 36 states.", icon: Package, href: "/book" },
            { name: "Same-Day City Delivery", desc: "Lagos, Abuja, Kano & PH — delivered before sunset.", icon: Clock, href: "/services#same-day" },
            { name: "Track a Shipment", desc: "Real-time tracking. Know exactly where your parcel is.", icon: Truck, href: "/tracking" },
            { name: "Pricing Calculator", desc: "Get an instant ₦ quote for any Nigeria route.", icon: Calculator, href: "/pricing" },
        ],
    },
    Business: {
        headline: "For Organisations",
        items: [
            { name: "Corporate Bulk Shipping", desc: "Monthly contracts and consolidated billing for 100+ daily.", icon: Shield, href: "/business#enterprise" },
            { name: "E-commerce Fulfilment", desc: "Lagos & Abuja warehouses, pick-pack, and returns.", icon: Layers, href: "/business#bulk" },
            { name: "API Integration", desc: "RESTful API and webhooks to power your platform.", icon: BarChart3, href: "/business#api" },
            { name: "Business Account", desc: "Unified dashboard, invoicing, and reporting portal.", icon: Users, href: "/business#account" },
        ],
    },
    "Stamps & Supplies": {
        headline: "Shop Online",
        items: [
            { name: "Waybills & Labels", desc: "Pre-printed waybills, stickers, and barcode labels.", icon: Stamp, href: "/shop#stamps" },
            { name: "Packaging Supplies", desc: "Boxes, envelopes, padded mailers, and bubble wrap.", icon: Box, href: "/shop#packaging" },
            { name: "Print Postage Online", desc: "Generate and print your shipment label from home or office.", icon: CreditCard, href: "/shop#click-drop" },
            { name: "Accessories", desc: "Tape, void fill, fragile stickers, and mailing tools.", icon: ShoppingBag, href: "/shop#accessories" },
        ],
    },
};

/* ── Standalone nav links (no mega menu) ───────────────────── */
const standaloneLinks = [
    { name: "Our Network", href: "/#network" },
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
];

const Navbar = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [mobileGroup, setMobileGroup] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [accountType, setAccountType] = useState<"personal" | "business" | null>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener("scroll", onScroll, { passive: true });

        // Auth state listener
        supabase.auth.getSession().then(({ data }) => {
            const user = data.session?.user;
            setUserEmail(user?.email ?? null);
            setAccountType(user?.user_metadata?.account_type ?? null);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const user = session?.user;
            setUserEmail(user?.email ?? null);
            setAccountType(user?.user_metadata?.account_type ?? null);
        });

        return () => {
            window.removeEventListener("scroll", onScroll);
            subscription.unsubscribe();
        };
    }, []);

    const userInitial = userEmail?.[0]?.toUpperCase() ?? "";

    return (
        <>
            <motion.nav
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                    "fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 lg:px-12",
                    scrolled
                        ? "py-3 bg-white/92 backdrop-blur-xl border-b border-surface-200 shadow-sm"
                        : "py-5 bg-transparent"
                )}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">

                    {/* ── Logo ── */}
                    <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
                        <div className="w-9 h-9 bg-red-brand rounded-lg flex items-center justify-center shadow-md shadow-red-brand/30 group-hover:shadow-red-brand/50 transition-shadow">
                            <Package className="text-white w-5 h-5" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-ink-900 hidden sm:block" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            PAN <span className="text-red-brand">African Express</span>
                        </span>
                    </Link>

                    {/* ── Desktop mega-menu links ── */}
                    <div
                        className="hidden lg:flex items-center gap-1"
                        onMouseLeave={() => setActiveMenu(null)}
                    >
                        {/* Mega-menu groups */}
                        {Object.entries(megaMenus).map(([name, data]) => (
                            <div key={name} className="relative" onMouseEnter={() => setActiveMenu(name)}>
                                <button
                                    className={cn(
                                        "relative flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all",
                                        activeMenu === name
                                            ? "text-red-brand bg-red-brand/6"
                                            : "text-ink-500 hover:text-ink-900 hover:bg-surface-100"
                                    )}
                                >
                                    {name}
                                    <motion.span animate={{ rotate: activeMenu === name ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    </motion.span>
                                    {/* Active bottom line */}
                                    {activeMenu === name && (
                                        <motion.span
                                            layoutId="nav-underline"
                                            className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-red-brand"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </button>

                                {/* Mega menu panel */}
                                <AnimatePresence>
                                    {activeMenu === name && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.97 }}
                                            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                                            className="absolute top-full left-0 mt-3 w-[340px] bg-white rounded-2xl overflow-hidden border border-surface-200 shadow-xl shadow-ink-900/8"
                                        >
                                            {/* Panel header */}
                                            <div className="px-5 pt-4 pb-3 border-b border-surface-100">
                                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-brand">{data.headline}</span>
                                            </div>

                                            <div className="p-3 space-y-1">
                                                {data.items.map((item, i) => (
                                                    <motion.div
                                                        key={item.name}
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.04 }}
                                                    >
                                                        <Link
                                                            href={item.href}
                                                            onClick={() => setActiveMenu(null)}
                                                            className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-surface-50 transition-colors group/item"
                                                        >
                                                            <div className="p-2 bg-red-brand/8 rounded-lg group-hover/item:bg-red-brand group-hover/item:text-white transition-colors flex-shrink-0">
                                                                <item.icon className="w-4 h-4 text-red-brand group-hover/item:text-white transition-colors" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-ink-900 mb-0.5 group-hover/item:text-red-brand transition-colors">{item.name}</p>
                                                                <p className="text-xs text-ink-400 leading-snug">{item.desc}</p>
                                                            </div>
                                                        </Link>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {/* Panel footer CTA */}
                                            <div className="px-5 py-3 border-t border-surface-100 bg-surface-50/50">
                                                <Link href={
                                                    name === "Personal" ? "/services" :
                                                        name === "Business" ? "/business" : "/shop"
                                                }
                                                    onClick={() => setActiveMenu(null)}
                                                    className="text-[11px] font-bold text-red-brand hover:text-red-dark transition-colors flex items-center gap-1"
                                                >
                                                    View all {name} services →
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}

                    </div>

                    {/* ── Desktop CTA buttons ── */}
                    <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                        <Link href="/tracking"
                            className="text-sm text-ink-500 hover:text-ink-900 transition-colors font-semibold px-3 py-2">
                            Track
                        </Link>

                        {userEmail ? (
                            /* Logged-in state */
                            <div className="flex items-center gap-2">
                                <Link href={accountType === "business" ? "/dashboard" : "/account"}
                                    className="flex items-center gap-2 text-sm font-semibold text-ink-600 hover:text-ink-900 border border-surface-200 hover:border-surface-300 px-3 py-2 rounded-full transition-all">
                                    <div className="w-5 h-5 rounded-full bg-red-brand flex items-center justify-center text-white text-[10px] font-bold">
                                        {userInitial}
                                    </div>
                                    My Account
                                </Link>
                                <button onClick={() => signOut()}
                                    className="flex items-center gap-1.5 text-sm font-semibold text-ink-400 hover:text-red-brand transition-colors px-2 py-2">
                                    <LogOut className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            /* Logged-out state */
                            <Link href="/login"
                                className="flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900 border border-surface-200 hover:border-surface-300 px-4 py-2 rounded-full transition-all">
                                <LogIn className="w-3.5 h-3.5" /> Sign In
                            </Link>
                        )}

                        <Link href={accountType === "business" ? "/dashboard/book" : "/book"}
                            className="btn-magnetic bg-red-brand text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-md shadow-red-brand/25 hover:bg-red-dark transition-colors">
                            Ship Now
                        </Link>
                    </div>

                    {/* ── Mobile hamburger ── */}
                    <button
                        className="lg:hidden w-9 h-9 flex items-center justify-center text-ink-500 hover:text-ink-900 transition-colors"
                        onClick={() => setMobileOpen(v => !v)}
                        aria-label="Toggle navigation"
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {mobileOpen ? (
                                <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                                    <X className="w-5 h-5" />
                                </motion.span>
                            ) : (
                                <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                                    <Menu className="w-5 h-5" />
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </motion.nav>

            {/* ── Mobile drawer ── */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed top-0 left-0 right-0 z-[99] bg-white/97 backdrop-blur-xl border-b border-surface-200 overflow-hidden pt-20 pb-6 px-6"
                    >
                        <div className="max-w-7xl mx-auto space-y-1 overflow-y-auto max-h-[80vh]">

                            {/* Mega groups — collapsible */}
                            {Object.entries(megaMenus).map(([name, data], gi) => (
                                <motion.div
                                    key={name}
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: gi * 0.06 + 0.05 }}
                                >
                                    <button
                                        onClick={() => setMobileGroup(mobileGroup === name ? null : name)}
                                        className="w-full flex items-center justify-between py-4 border-b border-surface-100 text-left"
                                    >
                                        <span className="text-2xl font-bold text-ink-900" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{name}</span>
                                        <motion.span animate={{ rotate: mobileGroup === name ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                            <ChevronDown className="w-5 h-5 text-ink-400" />
                                        </motion.span>
                                    </button>

                                    <AnimatePresence>
                                        {mobileGroup === name && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="py-3 space-y-1 pl-2">
                                                    {data.items.map(item => (
                                                        <Link
                                                            key={item.name}
                                                            href={item.href}
                                                            onClick={() => setMobileOpen(false)}
                                                            className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-surface-50 transition-colors group/mi"
                                                        >
                                                            <div className="p-1.5 bg-red-brand/8 rounded-lg flex-shrink-0">
                                                                <item.icon className="w-4 h-4 text-red-brand" />
                                                            </div>
                                                            <span className="text-base font-semibold text-ink-700 group-hover/mi:text-red-brand transition-colors">{item.name}</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}


                            {/* CTA buttons */}
                            <div className="pt-6 flex flex-col gap-3">
                                <Link href="/tracking" onClick={() => setMobileOpen(false)}
                                    className="bg-surface-100 rounded-xl py-4 text-center font-bold text-ink-900 hover:bg-surface-200 transition-colors">
                                    Track a Parcel
                                </Link>
                                {userEmail ? (
                                    <>
                                        <Link href={accountType === "business" ? "/dashboard" : "/account"} onClick={() => setMobileOpen(false)}
                                            className="flex items-center justify-center gap-2 border border-surface-200 rounded-xl py-4 font-bold text-ink-700 hover:bg-surface-100 transition-colors">
                                            <div className="w-6 h-6 rounded-full bg-red-brand flex items-center justify-center text-white text-xs font-bold">{userInitial}</div>
                                            My Account
                                        </Link>
                                        <button onClick={() => { setMobileOpen(false); signOut(); }}
                                            className="flex items-center justify-center gap-2 border border-red-brand/20 bg-red-brand/5 rounded-xl py-4 font-bold text-red-brand hover:bg-red-brand/10 transition-colors">
                                            <LogOut className="w-4 h-4" /> Sign Out
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex gap-3">
                                        <Link href="/login" onClick={() => setMobileOpen(false)}
                                            className="flex-1 flex items-center justify-center gap-2 border border-surface-200 rounded-xl py-4 font-bold text-ink-700 hover:bg-surface-100 transition-colors">
                                            <LogIn className="w-4 h-4" /> Sign In
                                        </Link>
                                        <Link href="/register" onClick={() => setMobileOpen(false)}
                                            className="flex-1 flex items-center justify-center gap-2 border border-surface-200 rounded-xl py-4 font-bold text-ink-700 hover:bg-surface-100 transition-colors">
                                            <UserPlus className="w-4 h-4" /> Register
                                        </Link>
                                    </div>
                                )}
                                <Link href={accountType === "business" ? "/dashboard/book" : "/book"} onClick={() => setMobileOpen(false)}
                                    className="bg-red-brand rounded-xl py-4 text-center font-bold text-white shadow-md shadow-red-brand/20 hover:bg-red-dark transition-colors">
                                    Ship Now
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
