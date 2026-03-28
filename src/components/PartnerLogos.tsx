"use client";

import React from "react";

const PartnerLogos = () => {
    return (
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            {/* Standards Organisation of Nigeria (SON) */}
            <svg viewBox="0 0 120 40" className="h-8 w-auto fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 10c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" />
                <text x="30" y="27" className="font-bold text-[18px]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>SON</text>
                <text x="30" y="32" className="text-[5px] uppercase tracking-tighter">Standards Org of Nigeria</text>
            </svg>

            {/* LCCI - Lagos Chamber of Commerce */}
            <svg viewBox="0 0 140 40" className="h-7 w-auto fill-current" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="10" width="20" height="20" rx="2" />
                <path d="M10 15h10M10 20h10M10 25h10" stroke="white" strokeWidth="2" />
                <text x="32" y="24" className="font-bold text-[16px]">LCCI</text>
                <text x="32" y="31" className="text-[5px] uppercase tracking-widest">Lagos Chamber of Commerce</text>
            </svg>

            {/* NIPOST */}
            <svg viewBox="0 0 130 40" className="h-8 w-auto fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 20l10-10h20l10 10-10 10H15L5 20z" fill="none" stroke="currentColor" strokeWidth="2" />
                <text x="45" y="25" className="font-bold text-[18px]">NIPOST</text>
                <text x="45" y="32" className="text-[5px] uppercase tracking-widest">Courier Regulator</text>
            </svg>

            {/* IATA */}
            <svg viewBox="0 0 100 40" className="h-6 w-auto fill-current" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="28" className="font-black text-[28px]" style={{ letterSpacing: "-0.05em" }}>IATA</text>
                <rect x="70" y="10" width="30" height="20" rx="2" />
            </svg>

            {/* GTBank / Payment Partner */}
            <svg viewBox="0 0 120 40" className="h-7 w-auto fill-current" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="10" width="20" height="20" rx="4" />
                <text x="28" y="25" className="font-bold text-[18px]">GTBank</text>
                <text x="28" y="32" className="text-[5px] uppercase tracking-widest">Payment Partner</text>
            </svg>
            
            {/* Konga */}
            <svg viewBox="0 0 110 40" className="h-7 w-auto fill-current" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="27" className="font-black text-[24px]" style={{ fontFamily: "Inter, sans-serif" }}>konga</text>
                <circle cx="95" cy="20" r="8" fill="currentColor" opacity="0.2" />
            </svg>
        </div>
    );
};

export default PartnerLogos;
