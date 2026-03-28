/* ── Shared Nigerian pricing utilities ──────────────────────────
   Pure functions — no server/client directive.
   Safe to import from both Client Components and Server Actions.
──────────────────────────────────────────────────────────────── */

export const NIGERIAN_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
    "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
    "Abuja (FCT)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
    "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
    "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const ZONES: Record<string, string> = {
    Lagos: "SW", Ogun: "SW", Oyo: "SW", Osun: "SW", Ondo: "SW", Ekiti: "SW",
    Rivers: "SS", Delta: "SS", Edo: "SS", Bayelsa: "SS", "Akwa Ibom": "SS", "Cross River": "SS",
    Anambra: "SE", Imo: "SE", Abia: "SE", Enugu: "SE", Ebonyi: "SE",
    "Abuja (FCT)": "NC", Benue: "NC", Kogi: "NC", Kwara: "NC", Nasarawa: "NC", Niger: "NC", Plateau: "NC",
    Kano: "NW", Kaduna: "NW", Katsina: "NW", Kebbi: "NW", Sokoto: "NW", Zamfara: "NW", Jigawa: "NW",
    Bauchi: "NE", Borno: "NE", Adamawa: "NE", Gombe: "NE", Taraba: "NE", Yobe: "NE",
};

const ZONE_ORDER = ["SW", "SS", "SE", "NC", "NW", "NE"];

export function calculatePrice(
    originState: string,
    destState: string,
    weightKg: number,
    serviceType: "standard" | "express" | "same_day" | "bulk"
): { 
    base: number; 
    weight: number; 
    service: number; 
    subtotal: number;
    vat: number;
    insurance: number;
    total: number; 
    eta: string 
} {
    const oz = ZONES[originState] ?? "NC";
    const dz = ZONES[destState] ?? "NC";

    let base = 1500;
    if (originState === destState) {
        base = serviceType === "same_day" ? 1500 : 1200;
    } else {
        const dist = Math.abs(ZONE_ORDER.indexOf(oz) - ZONE_ORDER.indexOf(dz));
        base = ([2500, 3500, 4500, 5500][Math.min(dist, 3)]) ?? 5500;
    }

    const weightCharge = Math.max(0, (Number(weightKg) || 1) - 1) * 500;
    const svcMultiplier = 
        serviceType === "express" ? 1.5 : 
        serviceType === "same_day" ? 2.0 : 
        serviceType === "bulk" ? 0.8 : 1.0;
    
    const serviceCharge = Math.round(base * (svcMultiplier - 1));
    const subtotal = Math.round((base + weightCharge + serviceCharge));
    
    // Corporate Financials
    const vat = Math.round(subtotal * 0.075); // 7.5% VAT
    const insurance = Math.round(subtotal * 0.01); // 1% Insurance
    const total = subtotal + vat + insurance;

    const etaMap: Record<string, string> = {
        same_day: "Same day (within 8hrs)", 
        express: "Next day arrival", 
        standard: "2–4 working days",
        bulk: "3–7 working days"
    };

    return {
        base,
        weight: weightCharge,
        service: serviceCharge,
        subtotal,
        vat,
        insurance,
        total,
        eta: etaMap[serviceType] ?? "3–5 days",
    };
}

/* ─── Haversine distance formula (km) ─────────────────────────── */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─── On-demand Price calculation ───────────────────────────────── */
const BASE_FARE = 500;
const PER_KM = 80;
const PER_KG = 50;
const SIZE_MULTIPLIER: Record<string, number> = {
    small: 1,
    medium: 1.3,
    large: 1.6,
    xl: 2,
};

export function calculateBookingPrice(
    distanceKm: number,
    weightKg: number,
    packageSize: "small" | "medium" | "large" | "xl"
): number {
    const base = BASE_FARE + distanceKm * PER_KM + weightKg * PER_KG;
    return Math.round(base * (SIZE_MULTIPLIER[packageSize] ?? 1));
}
