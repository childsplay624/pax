"use client";

import { motion } from "framer-motion";
import {
    Terminal, Globe, Zap, Shield,
    BookOpen, Code2, ChevronRight,
    Command, Box, Lock, Server
} from "lucide-react";
import { cn } from "@/lib/utils";

const BOX = "bg-[#111116] border border-white/[0.06] rounded-[1.5rem] p-8";
const CODE = "bg-black/60 border border-white/5 rounded-2xl p-6 font-mono text-[13px] text-blue-400 group relative";

export default function ApiDocsPage() {
    return (
        <div className="p-8 lg:p-12 space-y-12 min-h-screen bg-[#0c0c10]">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-white/20 text-[10px] font-black uppercase tracking-widest">
                <span>Developer</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white/60">API Documentation</span>
            </div>

            <div className="max-w-4xl space-y-10">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        Integrate <span className="text-blue-500">PAX Cloud</span>
                    </h1>
                    <p className="text-white/40 leading-relaxed text-sm max-w-2xl font-medium">
                        Build powerful logistics workflows using the Pan Africa Express REST API. Our infrastructure handles cross-border compliance, real-time tracking, and multi-currency settlements so you can focus on scale.
                    </p>
                </div>

                {/* Authentication Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                            <Lock className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Authentication</h2>
                    </div>
                    <p className="text-white/40 text-sm leading-relaxed font-medium">
                        The PAX API uses API keys to authenticate requests. You can view and manage your API keys in the <a href="/dashboard/developer" className="text-blue-400 hover:text-blue-300">Developer Dashboard</a>.
                    </p>
                    <div className={CODE}>
                        <div className="flex items-center gap-2 mb-4 text-[10px] text-white/20 font-black uppercase tracking-widest">
                            <Command className="w-3 h-3" /> Header Example
                        </div>
                        Authorization: Bearer pax_sk_live_...
                    </div>
                </section>

                {/* Core Endpoints */}
                <section className="space-y-8 pt-8 border-t border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                            <Server className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Core Endpoints</h2>
                    </div>

                    {/* POST /v1/bookings */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-black">POST</span>
                                <code className="text-white font-mono text-sm">/v1/bookings</code>
                            </div>
                            <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">Create Shipment</span>
                        </div>
                        <p className="text-white/40 text-sm leading-relaxed font-medium">Creates a new logistics order in our network and returns a PAX Tracking ID.</p>
                        <div className={CODE}>
                            <pre className="whitespace-pre-wrap">
                                {`{
  "sender": {
    "name": "Jane Merchant",
    "phone": "+234 810 000 0005"
  },
  "recipient": {
    "name": "John Customer",
    "address": "22 Garki Close, Abuja",
    "state": "Abuja (FCT)"
  },
  "parcel": {
    "weight_kg": 2.5,
    "service_type": "express"
  }
}`}
                            </pre>
                        </div>
                    </div>

                    {/* GET /v1/track/{id} */}
                    <div className="space-y-6 pt-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-black">GET</span>
                                <code className="text-white font-mono text-sm">/v1/track/:tracking_id</code>
                            </div>
                            <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">Real-time Telemetry</span>
                        </div>
                        <p className="text-white/40 text-sm leading-relaxed font-medium">Returns the current location and status history of a specific shipment.</p>
                    </div>
                </section>

                {/* Webhooks Section */}
                <section className="space-y-6 pt-12 border-t border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400">
                            <Globe className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Webhooks</h2>
                    </div>
                    <p className="text-white/40 text-sm leading-relaxed font-medium">
                        PAX can send HTTP POST notifications to your server when events occur in your account. Active events: <code className="text-blue-300">shipment.created</code>, <code className="text-blue-300">shipment.delivered</code>.
                    </p>
                </section>

            </div>

            {/* Sidebar info */}
            <div className="fixed right-10 top-32 hidden xl:block w-64 space-y-6">
                <div className={cn(BOX, "p-6 bg-gradient-to-br from-[#111116] to-[#1a1a2e]")}>
                    <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">Official SDKs</h4>
                    <div className="space-y-3">
                        {["Node.js", "Python", "PHP", "Go"].map(s => (
                            <div key={s} className="flex items-center justify-between group cursor-pointer">
                                <span className="text-xs text-white/60 group-hover:text-white transition-colors">{s} Client</span>
                                <ChevronRight className="w-3 h-3 text-white/10 group-hover:text-blue-400 transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}
