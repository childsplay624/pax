"use client";

import Link from "next/link";
import { Package, Twitter, Linkedin, Facebook, Instagram } from "lucide-react";

const Footer = () => {
    const sections = [
        {
            title: "Services",
            links: [
                { name: "Send a Parcel", href: "/book" },
                { name: "Same-Day City Delivery", href: "/services#same-day" },
                { name: "E-commerce Fulfilment", href: "/business#bulk" },
                { name: "Pricing Calculator", href: "/pricing" },
            ],
        },
        {
            title: "Business",
            links: [
                { name: "Enterprise Solutions", href: "/business#enterprise" },
                { name: "API Integration", href: "/business#api" },
                { name: "Bulk Shipping", href: "/business#bulk" },
                { name: "Business Account", href: "/business#account" },
            ],
        },
        {
            title: "Company",
            links: [
                { name: "About Us", href: "/about" },
                { name: "Our Network", href: "/#network" },
                { name: "Careers", href: "/about" },
                { name: "Contact Us", href: "/contact" },
            ],
        },
        {
            title: "Support",
            links: [
                { name: "Track a Parcel", href: "/tracking" },
                { name: "Help Centre", href: "/contact" },
                { name: "Contact", href: "/contact" },
                { name: "Service Status", href: "/contact" },
            ],
        },
    ];

    return (
        <footer className="bg-ink-900 text-white">
            {/* Main grid */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
                    {/* Brand column */}
                    <div className="md:col-span-1">
                        <Link href="/" className="flex items-center gap-2.5 mb-6 group">
                            <div className="w-9 h-9 bg-red-brand rounded-lg flex items-center justify-center shadow-md shadow-red-brand/30">
                                <Package className="text-white w-5 h-5" />
                            </div>
                            <span className="font-bold text-lg" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                PAN <span className="text-red-brand">African Express</span>
                            </span>
                        </Link>
                        <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-[200px]">
                            Nigeria-first courier. Every state. Every LGA. One network.
                        </p>
                        <div className="flex gap-3">
                            {[Twitter, Linkedin, Facebook, Instagram].map((Icon, i) => (
                                <a key={i} href="#" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-red-brand/20 hover:border-red-brand/30 border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-red-400 transition-all">
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {sections.map((s) => (
                        <div key={s.title}>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30 mb-5">{s.title}</h4>
                            <ul className="space-y-3">
                                {s.links.map((l) => (
                                    <li key={l.name}>
                                        <Link href={l.href} className="text-sm text-white/50 hover:text-white transition-colors">{l.name}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/[0.06]">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-white/25 text-xs">© {new Date().getFullYear()} PAN African Express. All rights reserved.</span>
                    <div className="flex gap-6">
                        {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((t) => (
                            <Link key={t} href="#" className="text-xs text-white/25 hover:text-white/60 transition-colors">{t}</Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
