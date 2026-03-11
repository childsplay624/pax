import Link from "next/link";
import { Package, MapPin, Home, Search, MessageCircle } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#0c0c10] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">

            {/* Ambient glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-red-brand/6 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/4 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-brand/30 to-transparent" />

            <div className="relative z-10 max-w-xl mx-auto">

                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-16">
                    <div className="w-10 h-10 bg-red-brand rounded-xl flex items-center justify-center shadow-lg shadow-red-brand/30">
                        <Package className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        PAN <span className="text-red-brand">African Express</span>
                    </span>
                </div>

                {/* 404 Hero */}
                <div className="relative mb-10">
                    {/* Giant ghost number */}
                    <span
                        className="block text-[10rem] sm:text-[14rem] font-bold leading-none tracking-tighter select-none"
                        style={{
                            fontFamily: "Space Grotesk, sans-serif",
                            background: "linear-gradient(150deg, rgba(220,38,38,0.15) 0%, rgba(220,38,38,0.03) 60%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        404
                    </span>

                    {/* Floating icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                            {/* Pulse rings */}
                            <div className="absolute inset-0 rounded-full bg-red-brand/10 animate-ping" style={{ animationDuration: "2.5s" }} />
                            <div className="absolute -inset-4 rounded-full bg-red-brand/5 animate-ping" style={{ animationDuration: "3s", animationDelay: "0.5s" }} />
                            <div className="w-24 h-24 bg-red-brand/10 border border-red-brand/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                                <MapPin className="w-12 h-12 text-red-brand" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-4 py-2 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-brand animate-pulse" />
                    <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Page Not Found</span>
                </div>

                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    Parcel Lost<br />
                    <span className="text-red-brand">in Transit</span>
                </h1>
                <p className="text-white/40 text-lg mb-12 leading-relaxed max-w-md mx-auto">
                    This page got lost somewhere between Lagos and Abuja. Let&apos;s get you back on track.
                </p>

                {/* Quick action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
                    <Link href="/"
                        className="flex items-center justify-center gap-2 bg-red-brand hover:bg-red-dark text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-brand/25 hover:-translate-y-0.5">
                        <Home className="w-4 h-4" />
                        Back to Homepage
                    </Link>
                    <Link href="/tracking"
                        className="flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5">
                        <Search className="w-4 h-4" />
                        Track a Parcel
                    </Link>
                </div>

                {/* Secondary links */}
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                    {[
                        { href: "/book",    label: "Book Shipment" },
                        { href: "/contact", label: "Contact Support" },
                        { href: "/login",   label: "Sign In" },
                    ].map(l => (
                        <Link key={l.href} href={l.href}
                            className="text-white/25 hover:text-red-brand font-semibold transition-colors flex items-center gap-1">
                            {l.label}
                        </Link>
                    ))}
                </div>

                <p className="text-white/10 text-xs mt-14">
                    Error 404 · PAN African Express
                </p>
            </div>
        </div>
    );
}
