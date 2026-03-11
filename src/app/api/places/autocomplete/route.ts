import { NextRequest, NextResponse } from "next/server";

const MAPS_KEY = process.env.GOOGLE_MAPS_SERVER_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

/* ── Proxy: Google Places Autocomplete (Nigeria-restricted) ──── */
export async function GET(request: NextRequest) {
    const input = request.nextUrl.searchParams.get("input");

    if (!input || input.length < 3) {
        return NextResponse.json({ predictions: [] });
    }

    if (!MAPS_KEY) {
        return NextResponse.json(
            { predictions: [], error: "Google Maps API key not configured" },
            { status: 503 }
        );
    }

    const params = new URLSearchParams({
        input,
        key: MAPS_KEY,
        components: "country:ng",           // 🇳🇬 Nigeria only
        language: "en",
        types: "address|establishment|geocode",
    });

    try {
        const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`,
            { next: { revalidate: 60 } }    // Cache for 60s to save quota
        );

        if (!res.ok) {
            throw new Error(`Google Places returned ${res.status}`);
        }

        const json = await res.json();

        if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
            console.error("[Places] API error:", json.status, json.error_message);
            return NextResponse.json({ predictions: [] });
        }

        return NextResponse.json({ predictions: json.predictions ?? [] });
    } catch (err) {
        console.error("[Places] Fetch failed:", err);
        return NextResponse.json({ predictions: [] }, { status: 500 });
    }
}
