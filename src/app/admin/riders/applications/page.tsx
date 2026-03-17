"use client";

import { useEffect, useState, useTransition } from "react";
import { 
    Shield, CheckCircle2, XCircle, Clock, 
    ArrowRight, User, Truck, MapPin, Phone, 
    Mail, FileText, Image as ImageIcon, ExternalLink, Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getRiderApplications, processRiderApplication } from "@/app/actions/admin";

export default function AdminRiderApplicationsPage() {
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [isPending, start] = useTransition();
    const [searchTerm, setSearchTerm] = useState("");

    const fetchApps = async () => {
        setLoading(true);
        const data = await getRiderApplications(filter);
        setApps(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchApps();
    }, [filter]);

    const handleAction = async (id: string, action: "approve" | "reject") => {
        const reason = action === "reject" ? prompt("Enter rejection reason:") : undefined;
        if (action === "reject" && reason === null) return;

        start(async () => {
            const res = await processRiderApplication(id, action, reason || undefined);
            if (res.success) {
                fetchApps();
                setSelectedApp(null);
            } else {
                alert(res.error);
            }
        });
    };

    const filteredApps = apps.filter(a => 
        a.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.phone?.includes(searchTerm) ||
        a.id_number?.includes(searchTerm)
    );

    const BOX = "bg-[#111116] border border-white/[0.05] rounded-3xl overflow-hidden shadow-2xl shadow-black/40 transition-all hover:border-white/[0.1]";

    return (
        <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-4 bg-red-brand rounded-full animate-pulse" />
                        <span className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">Audit Terminal</span>
                    </div>
                    <h1 className="text-4xl font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Rider <span className="text-red-brand">Registry</span></h1>
                    <p className="text-white/30 text-sm mt-2 max-w-md">Verify and onboard new fleet members into the PAN operational network.</p>
                </div>

                <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] p-1.5 rounded-2xl">
                    {['pending', 'approved', 'rejected', 'all'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                filter === f ? "bg-red-brand text-white shadow-lg shadow-red-brand/20" : "text-white/30 hover:text-white"
                            )}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Matrix Search */}
            <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input 
                    type="text" 
                    placeholder="Search by name, phone, or identity serial..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.1] rounded-2.5xl px-14 py-5 text-white placeholder-white/20 outline-none focus:border-red-brand/40 transition-all font-medium"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Applications List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-8 h-8 border-2 border-red-brand border-t-transparent rounded-full animate-spin" />
                            <p className="text-white/20 text-[10px] uppercase font-black tracking-widest">Scanning Network...</p>
                        </div>
                    ) : filteredApps.length === 0 ? (
                        <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                            <p className="text-white/20 text-sm font-bold uppercase tracking-widest">No matching nodes found</p>
                        </div>
                    ) : (
                        filteredApps.map((app) => (
                            <div key={app.id} 
                                onClick={() => setSelectedApp(app)}
                                className={cn(
                                    BOX, "p-6 cursor-pointer group flex items-center justify-between",
                                    selectedApp?.id === app.id ? "border-red-brand/40 bg-red-brand/[0.02]" : ""
                                )}>
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/20 group-hover:scale-110 transition-transform">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black uppercase tracking-wider text-sm">{app.full_name}</h3>
                                        <div className="flex items-center gap-3 mt-1 text-white/30 text-[11px] font-bold">
                                            <span className="flex items-center gap-1.5"><Truck className="w-3 h-3" /> {app.vehicle_type}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/10" />
                                            <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {app.city}, {app.state}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border",
                                        app.status === 'pending' ? "text-amber-500 border-amber-500/20 bg-amber-500/5" :
                                        app.status === 'approved' ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" :
                                        "text-red-500 border-red-500/20 bg-red-500/5"
                                    )}>
                                        {app.status}
                                    </div>
                                    <ArrowRight className={cn(
                                        "w-5 h-5 transition-all text-white/10 group-hover:text-red-brand group-hover:translate-x-1",
                                        selectedApp?.id === app.id ? "text-red-brand translate-x-1" : ""
                                    )} />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Audit Panel */}
                <div className="lg:col-span-1">
                    <AnimatePresence mode="wait">
                        {selectedApp ? (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={cn(BOX, "sticky top-8")}>
                                <div className="p-8 border-b border-white/[0.04] flex items-center justify-between">
                                    <div>
                                        <p className="text-red-brand text-[10px] font-black uppercase tracking-widest mb-1">Verify Node</p>
                                        <h2 className="text-xl font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Detail Specs</h2>
                                    </div>
                                    <button onClick={() => setSelectedApp(null)} className="text-white/20 hover:text-white transition-colors">
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>
                                
                                <div className="p-8 space-y-8">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                                            <p className="text-white/20 text-[9px] font-black uppercase tracking-widest mb-1">Status</p>
                                            <p className="text-white text-xs font-black uppercase tracking-wider">{selectedApp.status}</p>
                                        </div>
                                        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                                            <p className="text-white/20 text-[9px] font-black uppercase tracking-widest mb-1">Registered</p>
                                            <p className="text-white text-xs font-black tracking-wider">{new Date(selectedApp.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 group">
                                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/30 group-hover:text-red-brand transition-colors">
                                                <Phone className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-white/20 text-[9px] font-black uppercase tracking-widest">Communication Channel</p>
                                                <p className="text-white text-xs font-bold">{selectedApp.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 group">
                                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/30 group-hover:text-red-brand transition-colors">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-white/20 text-[9px] font-black uppercase tracking-widest">Network ID</p>
                                                <p className="text-white text-xs font-bold">{selectedApp.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 group">
                                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/30 group-hover:text-red-brand transition-colors">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-white/20 text-[9px] font-black uppercase tracking-widest">Identity Protocol</p>
                                                <p className="text-white text-xs font-bold">{selectedApp.id_type}: {selectedApp.id_number}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ID Card Simulation */}
                                    <div className="aspect-[1.6/1] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-2.5xl flex flex-col items-center justify-center gap-4 overflow-hidden relative group">
                                        <ImageIcon className="w-10 h-10 text-white/10 group-hover:scale-110 transition-transform" />
                                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">KYC Document Not Loaded</p>
                                        
                                        {/* Overlay action */}
                                        <div className="absolute inset-0 bg-red-brand/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                            <ExternalLink className="w-8 h-8 text-white mb-2" />
                                            <p className="text-white font-black uppercase tracking-widest text-[10px]">Verify Source</p>
                                        </div>
                                    </div>

                                    {selectedApp.status === 'pending' && (
                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <button 
                                                onClick={() => handleAction(selectedApp.id, "reject")}
                                                disabled={isPending}
                                                className="px-6 py-4 bg-white/[0.03] border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 text-white/40 hover:text-red-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all">
                                                Reject Node
                                            </button>
                                            <button 
                                                onClick={() => handleAction(selectedApp.id, "approve")}
                                                disabled={isPending}
                                                className="px-6 py-4 bg-red-brand hover:bg-white text-white hover:text-red-brand rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-red-brand/20 transition-all">
                                                Approve Fleet
                                            </button>
                                        </div>
                                    )}
                                    
                                    {selectedApp.status === 'rejected' && selectedApp.rejection_reason && (
                                        <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl">
                                            <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mb-1">Rejection Reason</p>
                                            <p className="text-white/60 text-[11px] font-bold leading-relaxed">{selectedApp.rejection_reason}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-white/5 rounded-[3rem] p-10 text-center">
                                <Shield className="w-12 h-12 text-white/5 mb-6" />
                                <p className="text-white/20 text-xs font-bold uppercase tracking-widest leading-relaxed">Select a data node from the operations grid to begin neural audit.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

            </div>

        </div>
    );
}
