"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Package, MapPin, Phone, User, Calendar, Scale, ShieldCheck, QrCode, Printer, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────── */
interface Shipment {
    id: string;
    tracking_id: string;
    sender_name: string;
    sender_phone: string;
    sender_address: string;
    receiver_name: string;
    receiver_phone: string;
    receiver_address: string;
    origin_state: string;
    destination_state: string;
    weight: number;
    parcel_type: string;
    created_at: string;
    status: string;
}

export default function WaybillPage() {
    const { id } = useParams();
    const router = useRouter();
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchShipment() {
            const { data, error } = await supabase
                .from("shipments")
                .select("*")
                .eq("id", id)
                .single();

            if (!error && data) setShipment(data);
            setLoading(false);
        }
        fetchShipment();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-red-brand border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!shipment) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <p className="text-gray-400 mb-4">Shipment not found.</p>
            <button onClick={() => router.back()} className="text-red-brand font-bold flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
        </div>
    );

    const dateStr = new Date(shipment.created_at).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    }).toUpperCase();

    return (
        <div className="min-h-screen bg-gray-100 py-10 print:p-0 print:bg-white">
            
            {/* Toolbar — hidden on print */}
            <div className="max-w-[800px] mx-auto mb-6 flex items-center justify-between px-4 print:hidden">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-semibold">
                    <ArrowLeft className="w-4 h-4" /> Back to Shipment
                </button>
                <div className="flex items-center gap-3">
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-red-brand text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-dark transition-all shadow-lg shadow-red-brand/20">
                        <Printer className="w-4 h-4" /> Print Waybill
                    </button>
                </div>
            </div>

            {/* Waybill Sheet */}
            <div className="max-w-[800px] mx-auto bg-white shadow-2xl print:shadow-none print:w-full overflow-hidden border border-gray-200 print:border-none">
                
                {/* Header */}
                <div className="bg-black text-white p-8 flex items-center justify-between border-b-4 border-red-brand">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-brand rounded-xl flex items-center justify-center shadow-lg">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                PAN <span className="text-red-brand">AFRICAN EXPRESS</span>
                            </h1>
                            <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] font-bold">Logistics & Supply Chain</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Waybill Number</p>
                        <p className="text-2xl font-black tracking-tight">{shipment.tracking_id}</p>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-2 divide-x divide-gray-200">
                    
                    {/* SENDER BLOCK */}
                    <div className="p-8 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-4 bg-red-brand rounded-full" />
                            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Sender Details</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <User className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Full Name</p>
                                    <p className="font-bold text-gray-900">{shipment.sender_name}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Phone className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Phone Number</p>
                                    <p className="font-bold text-gray-900">{shipment.sender_phone}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Pickup Address</p>
                                    <p className="text-sm font-bold text-gray-900 leading-relaxed uppercase">
                                        {shipment.sender_address}, {shipment.origin_state} State, Nigeria
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RECEIVER BLOCK */}
                    <div className="p-8 space-y-6 bg-gray-50/50">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-4 bg-black rounded-full" />
                            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Receiver Details</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <User className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Full Name</p>
                                    <p className="font-bold text-gray-900">{shipment.receiver_name}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Phone className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Phone Number</p>
                                    <p className="font-bold text-gray-900">{shipment.receiver_phone}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Delivery Address</p>
                                    <p className="text-sm font-bold text-gray-900 leading-relaxed uppercase">
                                        {shipment.receiver_address}, {shipment.destination_state} State, Nigeria
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shipping Metadata Strip */}
                <div className="border-y border-gray-200 grid grid-cols-4 divide-x divide-gray-200">
                    <div className="p-6 text-center">
                        <Calendar className="w-4 h-4 text-gray-400 mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Booking Date</p>
                        <p className="text-xs font-black">{dateStr}</p>
                    </div>
                    <div className="p-6 text-center">
                        <Scale className="w-4 h-4 text-gray-400 mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Weight</p>
                        <p className="text-xs font-black">{shipment.weight} KG</p>
                    </div>
                    <div className="p-6 text-center">
                        <Package className="w-4 h-4 text-gray-400 mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Parcel Type</p>
                        <p className="text-xs font-black uppercase">{shipment.parcel_type}</p>
                    </div>
                    <div className="p-6 text-center">
                        <ShieldCheck className="w-4 h-4 text-gray-400 mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Insurance</p>
                        <p className="text-xs font-black text-emerald-600 uppercase">Standard</p>
                    </div>
                </div>

                {/* Bottom Section: Tracker + Verification */}
                <div className="p-8 flex items-end justify-between">
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Tracking ID (Barcode)</p>
                            <div className="h-14 w-60 bg-gray-100 flex items-center justify-center border-x-2 border-black border-dashed">
                                <span className="font-mono text-xl tracking-[0.5em] font-black opacity-30 select-none">
                                    || ||| | ||| | ||
                                </span>
                            </div>
                            <p className="font-mono text-xs font-bold mt-1 tracking-widest text-center w-60">{shipment.tracking_id}</p>
                        </div>
                        <p className="text-[9px] text-gray-400 italic max-w-xs">
                            * By receiving this waybill, the customer agrees to the terms and conditions of PAN African Express.
                        </p>
                    </div>

                    <div className="text-right space-y-2">
                        <div className="inline-block p-1 border-2 border-black rounded-lg">
                            <QrCode className="w-20 h-20 text-black" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Scan to Track Live</p>
                    </div>
                </div>

                {/* Footer Strip */}
                <div className="bg-gray-50 border-t border-gray-200 p-4 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.5em]">Express Logistics Solution &bull; pan-africa.com</p>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body {
                        background: white;
                    }
                }
            `}</style>
        </div>
    );
}
