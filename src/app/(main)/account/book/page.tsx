"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin, Package, User, CreditCard, ChevronRight, ChevronLeft,
    Loader2, Star, Clock, Check, Navigation, Home, Briefcase, Plus,
    AlertCircle, Wallet,
} from "lucide-react";
import {
    APIProvider,
    Map,
    Marker,
    useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { cn } from "@/lib/utils";
import { createBookingRequest, calculateBookingPrice, getSavedAddresses } from "@/app/actions/on_demand";
import { supabase } from "@/lib/supabase";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!;

const STEPS = ["Pickup", "Dropoff", "Package", "Payment", "Confirm"];

const PACKAGE_SIZES = [
    { key: "small", label: "Small", desc: "Envelope, phone, small box", icon: "📦", weight: "< 2 kg" },
    { key: "medium", label: "Medium", desc: "Shoe box, small appliances", icon: "🗃️", weight: "2–5 kg" },
    { key: "large", label: "Large", desc: "Luggage bag, medium electronics", icon: "📦", weight: "5–15 kg" },
    { key: "xl", label: "XL / Bulk", desc: "Furniture, heavy equipment", icon: "🏗️", weight: "> 15 kg" },
] as const;

interface PlaceResult {
    address: string;
    lat: number;
    lng: number;
}

/* ── Google Place Autocomplete input ──────────────────────────── */
function PlaceAutocomplete({
    placeholder,
    onSelect,
    defaultValue,
}: {
    placeholder: string;
    onSelect: (place: PlaceResult) => void;
    defaultValue?: string;
}) {
    const [value, setValue] = useState(defaultValue ?? "");
    const inputRef = useRef<HTMLInputElement>(null);
    const placesLib = useMapsLibrary("places");

    useEffect(() => {
        if (!placesLib || !inputRef.current) return;
        const auto = new placesLib.Autocomplete(inputRef.current, {
            componentRestrictions: { country: "ng" },
            fields: ["formatted_address", "geometry"],
        });
        auto.addListener("place_changed", () => {
            const place = auto.getPlace();
            if (!place.geometry?.location) return;
            onSelect({
                address: place.formatted_address ?? "",
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
            });
            setValue(place.formatted_address ?? "");
        });
        return () => window.google?.maps.event.clearInstanceListeners(auto);
    }, [placesLib, onSelect]);

    return (
        <input
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white/[0.06] border border-white/[0.12] rounded-2xl px-4 py-4 text-white placeholder-white/30 text-sm font-medium outline-none focus:border-red-500/60 focus:bg-white/[0.09] transition-all"
        />
    );
}

/* ── Mini map viewer ──────────────────────────────────────────── */
function MiniMap({ pickup, dropoff }: { pickup: PlaceResult | null; dropoff: PlaceResult | null }) {
    const center = pickup
        ? { lat: pickup.lat, lng: pickup.lng }
        : { lat: 6.5244, lng: 3.3792 }; // Lagos default

    return (
        <Map
            defaultCenter={center}
            center={center}
            defaultZoom={13}
            zoom={pickup && dropoff ? 11 : 13}
            disableDefaultUI
            className="w-full h-full rounded-2xl"
            mapId="pax-booking-map"
        >
            {pickup && <Marker position={{ lat: pickup.lat, lng: pickup.lng }} title="Pickup" />}
            {dropoff && <Marker position={{ lat: dropoff.lat, lng: dropoff.lng }} title="Dropoff" />}
        </Map>
    );
}

/* ── Main Booking Wizard ──────────────────────────────────────── */
export default function BookDeliveryPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [savedAddresses, setSavedAddresses] = useState<{ id: string; label: string; address: string; lat: number; lng: number }[]>([]);

    // Form state
    const [pickup, setPickup] = useState<PlaceResult | null>(null);
    const [dropoff, setDropoff] = useState<PlaceResult | null>(null);
    const [packageSize, setPackageSize] = useState<"small" | "medium" | "large" | "xl">("small");
    const [weightKg, setWeightKg] = useState(1);
    const [packageDesc, setPackageDesc] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [receiverPhone, setReceiverPhone] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"wallet" | "cash">("wallet");

    // Distance & price
    const distanceKm = pickup && dropoff
        ? (() => {
            const R = 6371;
            const dLat = ((dropoff.lat - pickup.lat) * Math.PI) / 180;
            const dLng = ((dropoff.lng - pickup.lng) * Math.PI) / 180;
            const a = Math.sin(dLat / 2) ** 2 +
                Math.cos((pickup.lat * Math.PI) / 180) *
                Math.cos((dropoff.lat * Math.PI) / 180) *
                Math.sin(dLng / 2) ** 2;
            return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
        })()
        : 0;

    const estimatedPrice = pickup && dropoff
        ? calculateBookingPrice(distanceKm, weightKg, packageSize)
        : 0;

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (!data.user) { router.push("/login?redirect=/account/book"); return; }
        });
        getSavedAddresses().then(setSavedAddresses);
        // Fetch wallet balance
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data } = await (supabase as any).from("wallets").select("balance").eq("user_id", user.id).single();
            if (data) setWalletBalance(data.balance);
        })();
    }, [router]);

    const handlePickupSelect = useCallback((place: PlaceResult) => setPickup(place), []);
    const handleDropoffSelect = useCallback((place: PlaceResult) => setDropoff(place), []);

    const canProceed = () => {
        if (step === 0) return !!pickup;
        if (step === 1) return !!dropoff;
        if (step === 2) return weightKg > 0 && receiverName.trim().length > 1 && receiverPhone.trim().length > 8;
        if (step === 3) return true;
        return true;
    };

    const handleSubmit = async () => {
        if (!pickup || !dropoff) return;
        setLoading(true);
        setError(null);

        const result = await createBookingRequest({
            pickup_address: pickup.address,
            pickup_lat: pickup.lat,
            pickup_lng: pickup.lng,
            dropoff_address: dropoff.address,
            dropoff_lat: dropoff.lat,
            dropoff_lng: dropoff.lng,
            package_description: packageDesc || undefined,
            package_size: packageSize,
            estimated_weight_kg: weightKg,
            receiver_name: receiverName,
            receiver_phone: receiverPhone,
            payment_method: paymentMethod,
        });

        setLoading(false);

        if (result.error) {
            setError(result.error);
            return;
        }

        router.push(`/account/book/tracking/${result.booking_id}`);
    };

    const BOX = "bg-[#13131a] border border-white/[0.08] rounded-3xl";

    return (
        <APIProvider apiKey={GOOGLE_MAPS_KEY}>
            <div className="bg-[#0d0d14] min-h-screen pt-24 pb-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">

                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                        className="mb-8">
                        <button onClick={() => router.back()}
                            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm font-semibold mb-4">
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            Book a Delivery
                        </h1>
                        <p className="text-white/40 text-sm mt-1">On-demand door-to-door delivery, anywhere in Nigeria</p>
                    </motion.div>

                    {/* Step Progress */}
                    <div className="flex items-center gap-2 mb-8">
                        {STEPS.map((s, i) => (
                            <div key={s} className="flex items-center gap-2 flex-1">
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all",
                                    i < step ? "bg-emerald-500 text-white" :
                                        i === step ? "bg-red-500 text-white ring-4 ring-red-500/20" :
                                            "bg-white/[0.06] text-white/30"
                                )}>
                                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                                </div>
                                <span className={cn("text-xs font-semibold hidden sm:block", i === step ? "text-white" : "text-white/30")}>
                                    {s}
                                </span>
                                {i < STEPS.length - 1 && (
                                    <div className={cn("flex-1 h-[2px] rounded-full transition-all", i < step ? "bg-emerald-500" : "bg-white/[0.06]")} />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                        {/* Left: Form Steps */}
                        <div className="lg:col-span-3">
                            <AnimatePresence mode="wait">
                                <motion.div key={step}
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                                    className={cn(BOX, "p-6 sm:p-8")}>

                                    {/* STEP 0: Pickup */}
                                    {step === 0 && (
                                        <div className="space-y-5">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 bg-red-500/15 border border-red-500/20 rounded-2xl flex items-center justify-center">
                                                    <Navigation className="w-5 h-5 text-red-400" />
                                                </div>
                                                <div>
                                                    <h2 className="text-white font-bold text-xl" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Pickup Location</h2>
                                                    <p className="text-white/40 text-xs">Where should the rider collect the package?</p>
                                                </div>
                                            </div>

                                            {/* Saved addresses */}
                                            {savedAddresses.length > 0 && (
                                                <div>
                                                    <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold mb-3">Saved Addresses</p>
                                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                                        {savedAddresses.slice(0, 4).map(addr => (
                                                            <button key={addr.id}
                                                                onClick={() => setPickup({ address: addr.address, lat: addr.lat, lng: addr.lng })}
                                                                className={cn(
                                                                    "flex items-center gap-2 p-3 rounded-xl border text-left transition-all",
                                                                    pickup?.address === addr.address
                                                                        ? "bg-red-500/15 border-red-500/30 text-white"
                                                                        : "bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.07]"
                                                                )}>
                                                                {addr.label === "Home" ? <Home className="w-3.5 h-3.5 flex-shrink-0" /> : <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />}
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold truncate">{addr.label}</p>
                                                                    <p className="text-[10px] text-white/30 truncate">{addr.address.split(",")[0]}</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold mb-2">Or type an address</p>
                                                <PlaceAutocomplete
                                                    placeholder="Search your pickup address in Nigeria..."
                                                    onSelect={handlePickupSelect}
                                                    defaultValue={pickup?.address}
                                                />
                                            </div>

                                            {pickup && (
                                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                    className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-emerald-400 text-xs font-bold">Pickup confirmed</p>
                                                        <p className="text-white/60 text-xs mt-0.5">{pickup.address}</p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}

                                    {/* STEP 1: Dropoff */}
                                    {step === 1 && (
                                        <div className="space-y-5">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 bg-blue-500/15 border border-blue-500/20 rounded-2xl flex items-center justify-center">
                                                    <MapPin className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div>
                                                    <h2 className="text-white font-bold text-xl" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Dropoff Location</h2>
                                                    <p className="text-white/40 text-xs">Where should the package be delivered?</p>
                                                </div>
                                            </div>

                                            {savedAddresses.length > 0 && (
                                                <div>
                                                    <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold mb-3">Saved Addresses</p>
                                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                                        {savedAddresses.slice(0, 4).map(addr => (
                                                            <button key={addr.id}
                                                                onClick={() => setDropoff({ address: addr.address, lat: addr.lat, lng: addr.lng })}
                                                                className={cn(
                                                                    "flex items-center gap-2 p-3 rounded-xl border text-left transition-all",
                                                                    dropoff?.address === addr.address
                                                                        ? "bg-blue-500/15 border-blue-500/30 text-white"
                                                                        : "bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.07]"
                                                                )}>
                                                                {addr.label === "Home" ? <Home className="w-3.5 h-3.5 flex-shrink-0" /> : <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />}
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold truncate">{addr.label}</p>
                                                                    <p className="text-[10px] text-white/30 truncate">{addr.address.split(",")[0]}</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold mb-2">Or type an address</p>
                                                <PlaceAutocomplete
                                                    placeholder="Search dropoff address in Nigeria..."
                                                    onSelect={handleDropoffSelect}
                                                    defaultValue={dropoff?.address}
                                                />
                                            </div>

                                            {dropoff && (
                                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                    className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                                                    <Check className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-blue-400 text-xs font-bold">Dropoff confirmed</p>
                                                        <p className="text-white/60 text-xs mt-0.5">{dropoff.address}</p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}

                                    {/* STEP 2: Package Details */}
                                    {step === 2 && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-amber-500/15 border border-amber-500/20 rounded-2xl flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-amber-400" />
                                                </div>
                                                <div>
                                                    <h2 className="text-white font-bold text-xl" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Package Details</h2>
                                                    <p className="text-white/40 text-xs">Tell us what's being delivered</p>
                                                </div>
                                            </div>

                                            {/* Package size */}
                                            <div>
                                                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">Package Size</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {PACKAGE_SIZES.map(s => (
                                                        <button key={s.key} onClick={() => setPackageSize(s.key)}
                                                            className={cn(
                                                                "p-4 rounded-2xl border text-left transition-all",
                                                                packageSize === s.key
                                                                    ? "bg-amber-500/15 border-amber-500/30"
                                                                    : "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07]"
                                                            )}>
                                                            <div className="text-2xl mb-1">{s.icon}</div>
                                                            <p className="text-white text-sm font-bold">{s.label}</p>
                                                            <p className="text-white/40 text-[11px]">{s.desc}</p>
                                                            <p className="text-amber-400 text-[11px] font-bold mt-1">{s.weight}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Weight */}
                                            <div>
                                                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Estimated Weight (kg)</p>
                                                <input
                                                    type="number"
                                                    min={0.1}
                                                    max={200}
                                                    step={0.5}
                                                    value={weightKg}
                                                    onChange={e => setWeightKg(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                                                    className="w-full bg-white/[0.06] border border-white/[0.12] rounded-2xl px-4 py-3.5 text-white placeholder-white/30 text-sm font-medium outline-none focus:border-amber-500/60 transition-all"
                                                />
                                            </div>

                                            {/* Description */}
                                            <div>
                                                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Package Description <span className="text-white/20">(optional)</span></p>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Phone, shoes, documents..."
                                                    value={packageDesc}
                                                    onChange={e => setPackageDesc(e.target.value)}
                                                    className="w-full bg-white/[0.06] border border-white/[0.12] rounded-2xl px-4 py-3.5 text-white placeholder-white/30 text-sm font-medium outline-none focus:border-amber-500/60 transition-all"
                                                />
                                            </div>

                                            {/* Receiver */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Receiver&apos;s Name</p>
                                                    <input
                                                        type="text"
                                                        placeholder="Full name"
                                                        value={receiverName}
                                                        onChange={e => setReceiverName(e.target.value)}
                                                        className="w-full bg-white/[0.06] border border-white/[0.12] rounded-2xl px-4 py-3.5 text-white placeholder-white/30 text-sm font-medium outline-none focus:border-amber-500/60 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Receiver&apos;s Phone</p>
                                                    <input
                                                        type="tel"
                                                        placeholder="08012345678"
                                                        value={receiverPhone}
                                                        onChange={e => setReceiverPhone(e.target.value)}
                                                        className="w-full bg-white/[0.06] border border-white/[0.12] rounded-2xl px-4 py-3.5 text-white placeholder-white/30 text-sm font-medium outline-none focus:border-amber-500/60 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 3: Payment */}
                                    {step === 3 && (
                                        <div className="space-y-5">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                                                    <CreditCard className="w-5 h-5 text-emerald-400" />
                                                </div>
                                                <div>
                                                    <h2 className="text-white font-bold text-xl" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Payment</h2>
                                                    <p className="text-white/40 text-xs">How would you like to pay?</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {[
                                                    {
                                                        key: "wallet" as const,
                                                        label: "PAX Wallet",
                                                        desc: `Balance: ₦${walletBalance.toLocaleString()}`,
                                                        icon: Wallet,
                                                        color: "text-emerald-400",
                                                        bg: "bg-emerald-500/10 border-emerald-500/20",
                                                        active: "bg-emerald-500/15 border-emerald-500/30",
                                                    },
                                                    {
                                                        key: "cash" as const,
                                                        label: "Pay with Cash",
                                                        desc: "Pay rider directly on delivery",
                                                        icon: CreditCard,
                                                        color: "text-purple-400",
                                                        bg: "bg-purple-500/10 border-purple-500/20",
                                                        active: "bg-purple-500/15 border-purple-500/30",
                                                    },
                                                ].map(opt => (
                                                    <button key={opt.key} onClick={() => setPaymentMethod(opt.key)}
                                                        className={cn(
                                                            "w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all",
                                                            paymentMethod === opt.key
                                                                ? `${opt.active} ring-2 ring-white/10`
                                                                : "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07]"
                                                        )}>
                                                        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", opt.bg)}>
                                                            <opt.icon className={cn("w-5 h-5", opt.color)} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-white font-bold text-sm">{opt.label}</p>
                                                            <p className={cn("text-xs mt-0.5", opt.color)}>{opt.desc}</p>
                                                        </div>
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                            paymentMethod === opt.key ? "border-white bg-white" : "border-white/20"
                                                        )}>
                                                            {paymentMethod === opt.key && <div className="w-2 h-2 rounded-full bg-[#13131a]" />}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>

                                            {paymentMethod === "wallet" && walletBalance < estimatedPrice && (
                                                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                                    className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-red-400 text-xs font-bold">Insufficient balance</p>
                                                        <p className="text-white/50 text-xs mt-0.5">
                                                            You need ₦{estimatedPrice.toLocaleString()} but have ₦{walletBalance.toLocaleString()}.
                                                            <br />Switch to cash or fund your wallet first.
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}

                                    {/* STEP 4: Confirm */}
                                    {step === 4 && (
                                        <div className="space-y-5">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-purple-500/15 border border-purple-500/20 rounded-2xl flex items-center justify-center">
                                                    <Star className="w-5 h-5 text-purple-400" />
                                                </div>
                                                <div>
                                                    <h2 className="text-white font-bold text-xl" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Confirm Booking</h2>
                                                    <p className="text-white/40 text-xs">Review your delivery details</p>
                                                </div>
                                            </div>

                                            {[
                                                {
                                                    label: "Pickup", value: pickup?.address, icon: Navigation,
                                                    color: "text-red-400", bg: "bg-red-500/10"
                                                },
                                                {
                                                    label: "Dropoff", value: dropoff?.address, icon: MapPin,
                                                    color: "text-blue-400", bg: "bg-blue-500/10"
                                                },
                                                {
                                                    label: "Package", value: `${packageSize.charAt(0).toUpperCase() + packageSize.slice(1)} · ${weightKg} kg${packageDesc ? ` · ${packageDesc}` : ""}`, icon: Package,
                                                    color: "text-amber-400", bg: "bg-amber-500/10"
                                                },
                                                {
                                                    label: "Receiver", value: `${receiverName} · ${receiverPhone}`, icon: User,
                                                    color: "text-purple-400", bg: "bg-purple-500/10"
                                                },
                                                {
                                                    label: "Payment", value: paymentMethod === "wallet" ? "PAX Wallet" : "Cash on Delivery",
                                                    icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/10"
                                                },
                                            ].map(item => (
                                                <div key={item.label} className="flex items-start gap-3 p-4 bg-white/[0.04] border border-white/[0.07] rounded-2xl">
                                                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", item.bg)}>
                                                        <item.icon className={cn("w-4 h-4", item.color)} />
                                                    </div>
                                                    <div>
                                                        <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold">{item.label}</p>
                                                        <p className="text-white text-sm font-medium mt-0.5">{item.value}</p>
                                                    </div>
                                                </div>
                                            ))}

                                            {error && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                    className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                                    <p className="text-red-300 text-xs">{error}</p>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}

                                    {/* Navigation buttons */}
                                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.07]">
                                        <button
                                            onClick={() => setStep(s => Math.max(0, s - 1))}
                                            disabled={step === 0}
                                            className="flex items-center gap-2 text-white/40 hover:text-white/70 disabled:opacity-0 disabled:pointer-events-none transition-all font-semibold text-sm">
                                            <ChevronLeft className="w-4 h-4" /> Previous
                                        </button>

                                        {step < STEPS.length - 1 ? (
                                            <button
                                                onClick={() => setStep(s => s + 1)}
                                                disabled={!canProceed()}
                                                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-white/[0.06] disabled:text-white/20 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-500/20">
                                                Continue <ChevronRight className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleSubmit}
                                                disabled={loading || (paymentMethod === "wallet" && walletBalance < estimatedPrice)}
                                                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-white/[0.06] disabled:text-white/20 text-white px-8 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-500/20">
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                {loading ? "Booking..." : "Confirm & Find Rider"}
                                            </button>
                                        )}
                                    </div>

                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Right: Map + Price summary */}
                        <div className="lg:col-span-2 space-y-5">

                            {/* Map */}
                            <div className={cn(BOX, "overflow-hidden h-64 lg:h-80")}>
                                <MiniMap pickup={pickup} dropoff={dropoff} />
                            </div>

                            {/* Price Summary */}
                            {pickup && dropoff && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className={cn(BOX, "p-6")}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1.5 h-5 rounded-full bg-red-500" />
                                        <h3 className="text-white font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Price Estimate</h3>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between text-white/50">
                                            <span>Base fare</span>
                                            <span>₦500</span>
                                        </div>
                                        <div className="flex items-center justify-between text-white/50">
                                            <span>Distance ({distanceKm} km × ₦80)</span>
                                            <span>₦{(distanceKm * 80).toFixed(0)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-white/50">
                                            <span>Weight ({weightKg} kg × ₦50)</span>
                                            <span>₦{(weightKg * 50).toFixed(0)}</span>
                                        </div>
                                        <div className="h-px bg-white/[0.07]" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-white font-bold">Total</span>
                                            <span className="text-2xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                                                ₦{estimatedPrice.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2 text-white/30 text-xs">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>Expected: {distanceKm < 10 ? "30–45 mins" : distanceKm < 30 ? "45–90 mins" : "2–4 hours"}</span>
                                    </div>
                                </motion.div>
                            )}

                            {/* Features */}
                            <div className={cn(BOX, "p-5")}>
                                <div className="space-y-3">
                                    {[
                                        { icon: "🛡️", text: "All deliveries are insured" },
                                        { icon: "📍", text: "Live GPS tracking" },
                                        { icon: "⭐", text: "Rate your rider after delivery" },
                                        { icon: "📸", text: "Proof of delivery photo" },
                                    ].map(f => (
                                        <div key={f.text} className="flex items-center gap-3">
                                            <span className="text-base">{f.icon}</span>
                                            <p className="text-white/50 text-xs font-medium">{f.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Save this address shortcut */}
                            {(pickup || dropoff) && (
                                <button
                                    onClick={() => router.push("/account/addresses")}
                                    className="w-full flex items-center gap-3 p-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl hover:bg-white/[0.07] transition-all">
                                    <Plus className="w-4 h-4 text-white/40" />
                                    <span className="text-white/50 text-sm font-medium">Save addresses for quick reuse</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </APIProvider>
    );
}
