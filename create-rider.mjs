/**
 * create-rider.mjs
 * Creates a PAX Rider auth account + riders table row.
 * Usage: node create-rider.mjs <service_role_key>
 */

const SUPABASE_URL = "https://irlgvhngbomhjrsnqhzc.supabase.co";
const ANON_KEY = "sb_publishable_grjuiVcWPYrfUvmCW29dtw_-ccIeasQ";

// ── Rider details ─────────────────────────────────────────────
const EMAIL = "tnege@wcccgroup.us";
const PASSWORD = "Brenda624.";
const FULL_NAME = "Tiza Nege";
const PHONE = "+2348174634585";
const VEHICLE_TYPE = "bike";
const CITY = "Abuja";
// ─────────────────────────────────────────────────────────────

const SERVICE_KEY = process.argv[2];

async function adminPost(path, body) {
    const key = SERVICE_KEY || ANON_KEY;
    const res = await fetch(`${SUPABASE_URL}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": key,
            "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
}

async function restPatch(path, body, token) {
    const key = SERVICE_KEY || token;
    const res = await fetch(`${SUPABASE_URL}${path}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "apikey": SERVICE_KEY || ANON_KEY,
            "Authorization": `Bearer ${key}`,
            "Prefer": "return=minimal",
        },
        body: JSON.stringify(body),
    });
    return res.ok;
}

async function restInsert(path, body, token) {
    const key = SERVICE_KEY || token;
    const res = await fetch(`${SUPABASE_URL}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": SERVICE_KEY || ANON_KEY,
            "Authorization": `Bearer ${key}`,
            "Prefer": "return=representation",
        },
        body: JSON.stringify(body),
    });
    return { ok: res.ok, data: await res.json() };
}

async function restSelect(path, token) {
    const key = SERVICE_KEY || token;
    const res = await fetch(`${SUPABASE_URL}${path}`, {
        headers: {
            "apikey": SERVICE_KEY || ANON_KEY,
            "Authorization": `Bearer ${key}`,
        },
    });
    return { ok: res.ok, data: await res.json() };
}

async function main() {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  PAX — Rider Account Setup");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    let userId, userToken;

    if (SERVICE_KEY) {
        // ── Admin path (auto-confirms email) ────────────────
        console.log("🔑  Using service_role key → auto-confirming email...\n");
        const { ok, data } = await adminPost("/auth/v1/admin/users", {
            email: EMAIL,
            password: PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: FULL_NAME },
        });

        if (!ok || !data.id) {
            if (data.msg?.includes("already been registered") || data.code === "email_exists") {
                console.log("⚠️  User already exists — signing in to get UID...");
            } else {
                console.error("❌ Admin create failed:", JSON.stringify(data, null, 2));
                process.exit(1);
            }
        } else {
            userId = data.id;
            console.log(`✅ Auth user created  │ UID: ${userId}`);
        }
    }

    // ── Sign in to get token + UID (fallback / refresh) ────
    if (!userId) {
        console.log("1️⃣  Signing up (anon)...");
        await adminPost("/auth/v1/signup", {
            email: EMAIL, password: PASSWORD,
            data: { full_name: FULL_NAME },
        });
    }

    console.log("2️⃣  Signing in...");
    const { ok: sinOk, data: sin } = await adminPost("/auth/v1/token?grant_type=password", {
        email: EMAIL, password: PASSWORD,
    });

    if (!sinOk) {
        if (sin?.error_code === "email_not_confirmed") {
            const proj = SUPABASE_URL.split("//")[1].split(".")[0];
            console.log("\n⚠️  EMAIL CONFIRMATION REQUIRED");
            console.log(`   → https://supabase.com/dashboard/project/${proj}/auth/users`);
            console.log(`   Find ${EMAIL} → ⋮ → "Send confirmation email"`);
            console.log("\n   OR re-run with your service_role key:");
            console.log("   node create-rider.mjs <service_role_key>\n");
            console.log(`   Credentials → Email: ${EMAIL}  Password: ${PASSWORD}`);
        } else {
            console.error("❌ Sign-in failed:", JSON.stringify(sin, null, 2));
        }
        process.exit(1);
    }

    userId = sin.user?.id;
    userToken = sin.access_token;
    console.log(`   ✅ Signed in  │ UID: ${userId}\n`);

    // ── Check if rider row already exists ──────────────────
    console.log("3️⃣  Checking riders table...");
    const { data: existing } = await restSelect(
        `/rest/v1/riders?phone=eq.${encodeURIComponent(PHONE)}&select=id,user_id`,
        userToken
    );

    if (Array.isArray(existing) && existing.length > 0) {
        const rid = existing[0];
        console.log(`   Found existing rider row (id: ${rid.id})`);
        if (!rid.user_id) {
            // Link it
            const patchRes = await restPatch(
                `/rest/v1/riders?id=eq.${rid.id}`,
                { user_id: userId },
                userToken
            );
            console.log(patchRes ? "   ✅ Linked user_id to existing rider row" : "   ⚠️  Link failed (may need service_role key)");
        } else {
            console.log("   ✅ Already linked — no changes needed.");
        }
    } else {
        // Insert a brand-new rider row
        console.log("   No existing row found — inserting...");
        const { ok: insOk, data: insData } = await restInsert(
            "/rest/v1/riders",
            {
                full_name: FULL_NAME,
                phone: PHONE,
                vehicle_type: VEHICLE_TYPE,
                status: "active",
                current_city: CITY,
                rating: 5.0,
                total_deliveries: 0,
                user_id: userId,
            },
            userToken
        );

        if (insOk) {
            const rid = Array.isArray(insData) ? insData[0]?.id : insData?.id;
            console.log(`   ✅ Rider row created  │ Rider ID: ${rid}`);
        } else {
            console.warn("   ⚠️  Insert response:", JSON.stringify(insData, null, 2));
            console.log("   Tip: Run the rider_auth_migration.sql first in Supabase SQL Editor");
        }
    }

    // ── Done ──────────────────────────────────────────────
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  🏍️  RIDER ACCOUNT READY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Name     : ${FULL_NAME}`);
    console.log(`  Email    : ${EMAIL}`);
    console.log(`  Password : ${PASSWORD}`);
    console.log(`  Phone    : ${PHONE}`);
    console.log(`  Vehicle  : ${VEHICLE_TYPE}  |  City: ${CITY}`);
    console.log(`  UID      : ${userId}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  🔗 Login :  /login");
    console.log("  🔗 Hub   :  /rider\n");
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
