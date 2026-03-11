"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Prediction {
    place_id: string;
    description: string;
    structured_formatting: {
        main_text: string;
        secondary_text: string;
    };
}

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    dark?: boolean;
}

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

export default function AddressAutocomplete({ value, onChange, placeholder = "Enter an address", className, dark = false }: Props) {
    const [query,       setQuery]       = useState(value);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading,     setLoading]     = useState(false);
    const [open,        setOpen]        = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync external value changes
    useEffect(() => { setQuery(value); }, [value]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const fetchPredictions = useCallback(async (input: string) => {
        if (!MAPS_KEY || input.length < 3) {
            setPredictions([]);
            setOpen(false);
            return;
        }

        setLoading(true);
        try {
            // Use the Places Autocomplete API via our proxy route (avoids CORS issues)
            const res = await fetch(
                `/api/places/autocomplete?input=${encodeURIComponent(input)}`
            );
            const json = await res.json();

            if (json.predictions) {
                setPredictions(json.predictions);
                setOpen(json.predictions.length > 0);
            }
        } catch {
            setPredictions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setQuery(v);
        onChange(v); // Update parent immediately as user types

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchPredictions(v), 350);
    };

    const handleSelect = (p: Prediction) => {
        setQuery(p.description);
        onChange(p.description);
        setPredictions([]);
        setOpen(false);
    };

    const handleClear = () => {
        setQuery("");
        onChange("");
        setPredictions([]);
        setOpen(false);
    };

    const inputBase = dark
        ? "w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white font-medium placeholder-white/20 outline-none focus:border-red-brand/40 focus:bg-white/[0.07] transition-all text-sm"
        : "w-full bg-surface-50 border border-surface-200 rounded-xl px-5 py-4 text-ink-900 font-medium placeholder-ink-300 outline-none focus:border-red-brand/40 focus:ring-2 focus:ring-red-brand/8 transition-all";

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            {/* Input */}
            <div className="relative">
                <MapPin className={cn(
                    "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none",
                    dark ? "text-white/20" : "text-ink-300"
                )} />
                <input
                    type="text"
                    value={query}
                    onChange={handleInput}
                    onFocus={() => predictions.length > 0 && setOpen(true)}
                    placeholder={placeholder}
                    className={cn(inputBase, "pl-10 pr-9")}
                    autoComplete="off"
                />
                {/* Right side icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {loading ? (
                        <Loader2 className={cn("w-4 h-4 animate-spin", dark ? "text-white/20" : "text-ink-300")} />
                    ) : query ? (
                        <button type="button" onClick={handleClear}>
                            <X className={cn("w-4 h-4", dark ? "text-white/20 hover:text-white/50" : "text-ink-300 hover:text-ink-500")} />
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Dropdown */}
            {open && predictions.length > 0 && (
                <div className={cn(
                    "absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border overflow-hidden shadow-xl",
                    dark
                        ? "bg-[#1e1e28] border-white/[0.1]"
                        : "bg-white border-surface-200"
                )}>
                    {predictions.map((p, i) => (
                        <button
                            key={p.place_id}
                            type="button"
                            onClick={() => handleSelect(p)}
                            className={cn(
                                "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
                                i > 0 && (dark ? "border-t border-white/[0.05]" : "border-t border-surface-100"),
                                dark
                                    ? "hover:bg-white/[0.05]"
                                    : "hover:bg-surface-50"
                            )}
                        >
                            <div className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                                dark ? "bg-red-brand/15" : "bg-red-brand/8"
                            )}>
                                <MapPin className="w-3.5 h-3.5 text-red-brand" />
                            </div>
                            <div className="min-w-0">
                                <p className={cn(
                                    "text-sm font-semibold truncate",
                                    dark ? "text-white" : "text-ink-900"
                                )}>
                                    {p.structured_formatting?.main_text ?? p.description}
                                </p>
                                {p.structured_formatting?.secondary_text && (
                                    <p className={cn(
                                        "text-xs truncate mt-0.5",
                                        dark ? "text-white/35" : "text-ink-400"
                                    )}>
                                        {p.structured_formatting.secondary_text}
                                    </p>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Fallback notice when no Maps key is configured */}
            {!MAPS_KEY && (
                <p className={cn("text-[10px] mt-1", dark ? "text-white/20" : "text-ink-300")}>
                    Address suggestions unavailable — add NEXT_PUBLIC_GOOGLE_MAPS_KEY to enable.
                </p>
            )}
        </div>
    );
}
