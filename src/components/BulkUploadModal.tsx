"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileUp, Download, CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";
import { createBulkShipments } from "@/app/actions/bookings";
import { cn } from "@/lib/utils";

interface BulkUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (count: number) => void;
    dark?: boolean;
}

export default function BulkUploadModal({ isOpen, onClose, onSuccess, dark = false }: BulkUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isPending, start] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected && selected.type === "text/csv") {
            setFile(selected);
            setError(null);
        } else {
            setError("Please upload a valid CSV file.");
        }
    };

    const downloadTemplate = () => {
        const headers = [
            "sender_name", "sender_phone", "sender_address", "sender_state",
            "recipient_name", "recipient_phone", "recipient_address", "recipient_state",
            "weight_kg", "declared_value", "service_type", "special_instructions"
        ];
        const row = [
            "John Doe", "08012345678", "123 Street, Lagos", "Lagos",
            "Jane Smith", "09087654321", "456 Rd, Abuja", "Abuja (FCT)",
            "2.5", "5000", "standard", "Handle with care"
        ];
        const csvContent = "data:text/csv;charset=utf-8," + [headers, row].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "pax_bulk_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUpload = () => {
        if (!file) return;

        start(async () => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const text = e.target?.result as string;
                    const lines = text.split("\n");
                    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

                    const data = lines.slice(1).filter(l => l.trim()).map(line => {
                        const values = line.split(",").map(v => v.trim());
                        const obj: any = {};
                        headers.forEach((h, i) => {
                            obj[h] = values[i];
                        });
                        return obj;
                    });

                    if (data.length === 0) {
                        setError("No valid data found in CSV.");
                        return;
                    }

                    const res = await createBulkShipments(data);
                    if (res.error) {
                        setError(res.error);
                    } else {
                        onSuccess(res.count);
                        onClose();
                    }
                } catch (err) {
                    setError("Failed to parse CSV. Ensure it matches the template.");
                }
            };
            reader.readAsText(file);
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className={cn(
                        "relative w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden",
                        dark ? "bg-[#111116] border border-white/10" : "bg-white"
                    )}>

                    {/* Header */}
                    <div className={cn(
                        "px-10 py-8 border-b flex items-center justify-between",
                        dark ? "border-white/5 bg-white/[0.02]" : "border-gray-100"
                    )}>
                        <div>
                            <h3 className={cn("text-xl font-bold", dark ? "text-white" : "text-gray-900")} style={{ fontFamily: "Space Grotesk, sans-serif" }}>Bulk Shipment Upload</h3>
                            <p className={cn("text-xs mt-0.5", dark ? "text-white/30" : "text-gray-400")}>Upload a CSV file to book multiple parcels at once.</p>
                        </div>
                        <button onClick={onClose} className={cn("p-2 rounded-full transition-colors", dark ? "hover:bg-white/5 text-white/30" : "hover:bg-gray-100 text-gray-400")}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-10 space-y-8">
                        {/* Info box */}
                        <div className={cn(
                            "rounded-2xl p-5 flex gap-4",
                            dark ? "bg-red-brand/5 border border-red-brand/10 text-red-brand/80" : "bg-blue-50 border border-blue-100 text-blue-700"
                        )}>
                            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div className="text-[10px] uppercase font-black tracking-widest space-y-2">
                                <p className="opacity-60">Fulfillment Sequence</p>
                                <div className="space-y-1.5 text-white/40">
                                    <p>1. Download the spatial CSV template below.</p>
                                    <p>2. Configure sender, recipient, and payload data.</p>
                                    <p>3. Upload completed deck to process bookings.</p>
                                </div>
                            </div>
                        </div>

                        {/* Dropzone */}
                        <div className={cn(
                            "relative border-2 border-dashed rounded-[2rem] p-12 text-center transition-all",
                            file
                                ? "border-emerald-500 bg-emerald-500/5"
                                : dark
                                    ? "border-white/10 hover:border-red-brand/40 bg-white/[0.02]"
                                    : "border-gray-200 hover:border-red-brand/40 bg-gray-50/50"
                        )}>
                            <input type="file" accept=".csv" onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />

                            <div className="flex flex-col items-center">
                                {file ? (
                                    <>
                                        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
                                            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                                        </div>
                                        <p className={cn("font-bold text-sm truncate max-w-[200px]", dark ? "text-white" : "text-gray-900")}>{file.name}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-2">{(file.size / 1024).toFixed(1)} KB Readiness</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 bg-red-brand/10 rounded-2xl flex items-center justify-center mb-4 text-red-brand">
                                            <FileUp className="w-7 h-7" />
                                        </div>
                                        <p className={cn("font-bold text-sm", dark ? "text-white" : "text-gray-900")}>Select CSV Deck</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-2">Maximum payload: 5MB</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest justify-center">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col gap-4 pt-2">
                            <button onClick={handleUpload} disabled={!file || isPending}
                                className="w-full bg-red-brand hover:bg-red-dark disabled:opacity-40 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-red-brand/20 flex items-center justify-center gap-3">
                                {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <><FileUp className="w-6 h-6" /> Initialize Batch Launch</>}
                            </button>
                            <button onClick={downloadTemplate} className={cn(
                                "w-full flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest py-2 transition-colors",
                                dark ? "text-white/20 hover:text-white" : "text-gray-500 hover:text-gray-900"
                            )}>
                                <Download className="w-4 h-4" /> Get CSV Architecture Template
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
