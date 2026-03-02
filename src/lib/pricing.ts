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
    serviceType: "standard" | "express" | "same_day"
): { base: number; weight: number; service: number; total: number; eta: string } {
    const oz = ZONES[originState] ?? "NC";
    const dz = ZONES[destState] ?? "NC";

    let base = 1500;
    if (originState === destState) {
        base = serviceType === "same_day" ? 1500 : 1200;
    } else {
        const dist = Math.abs(ZONE_ORDER.indexOf(oz) - ZONE_ORDER.indexOf(dz));
        base = ([2500, 3500, 4500, 5500][Math.min(dist, 3)]) ?? 5500;
    }

    const weightCharge = Math.max(0, weightKg - 1) * 500;
    const svcMultiplier = serviceType === "express" ? 1.5 : serviceType === "same_day" ? 2.0 : 1.0;
    const serviceCharge = base * (svcMultiplier - 1);

    const etaMap: Record<string, string> = {
        same_day: "Same day", express: "Next day", standard: "2–4 days",
    };

    return {
        base,
        weight: weightCharge,
        service: Math.round(serviceCharge),
        total: Math.round((base + weightCharge) * svcMultiplier),
        eta: etaMap[serviceType] ?? "3–5 days",
    };
}
