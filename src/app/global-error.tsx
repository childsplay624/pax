"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Global Error]", error);
    }, [error]);

    return (
        <html lang="en">
            <body style={{ margin: 0, padding: 0, background: "#0c0c10", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
                <div style={{ textAlign: "center", padding: "2rem", maxWidth: "480px", width: "100%" }}>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "48px" }}>
                        <div style={{ width: 40, height: 40, background: "#dc2626", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                        </div>
                        <span style={{ color: "white", fontWeight: 700, fontSize: "1.1rem", fontFamily: "Space Grotesk, sans-serif" }}>PAN <span style={{ color: "#dc2626" }}>African Express</span></span>
                    </div>

                    <div style={{ width: 80, height: 80, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                        <AlertTriangle style={{ width: 40, height: 40, color: "#f87171" }} />
                    </div>

                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
                        <span style={{ color: "#f87171", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.25em" }}>System Error</span>
                    </div>

                    <h1 style={{ color: "white", fontSize: "2rem", fontWeight: 700, marginBottom: 12, fontFamily: "Space Grotesk, sans-serif" }}>
                        Something went wrong
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.95rem", marginBottom: 8, lineHeight: 1.6 }}>
                        Our team has been notified. This is usually a temporary issue.
                    </p>
                    {error?.digest && (
                        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7rem", fontFamily: "monospace", marginBottom: 32 }}>
                            Error ID: {error.digest}
                        </p>
                    )}

                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 32 }}>
                        <button
                            onClick={() => reset()}
                            style={{ display: "flex", alignItems: "center", gap: 8, background: "#dc2626", color: "white", border: "none", padding: "14px 28px", borderRadius: 16, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}
                        >
                            <RefreshCw style={{ width: 16, height: 16 }} />
                            Try Again
                        </button>
                        <a href="/"
                            style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.1)", textDecoration: "none", padding: "14px 28px", borderRadius: 16, fontWeight: 700, fontSize: "0.875rem" }}>
                            <Home style={{ width: 16, height: 16 }} />
                            Go Home
                        </a>
                    </div>

                    <p style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.7rem", marginTop: 40 }}>
                        Error 500 · PAN African Express · <a href="/contact" style={{ color: "#dc2626" }}>Contact support</a>
                    </p>
                </div>
            </body>
        </html>
    );
}
