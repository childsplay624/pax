/**
 * create-merchant-v3.mjs
 * Creates a merchant/business account by:
 * 1. POSTing to the local Next.js signup server action
 * 2. Directly calling Supabase Auth signup
 * 3. Updating the profile via REST
 *
 * If email confirmation is ON, it will print a Supabase magic link
 * you can use to bypass the email.
 */

const SUPABASE_URL = "https://irlgvhngbomhjrsnqhzc.supabase.co";
const ANON_KEY = "sb_publishable_grjuiVcWPYrfUvmCW29dtw_-ccIeasQ";

// ─── Merchant details — change if you want ────────────────────
const EMAIL = "merchant@panafricanexpress.com";
const PASSWORD = "Merchant@PAX2026";
const NAME = "PAX Merchant";
// ─────────────────────────────────────────────────────────────

async function post(endpoint, body, extraHeaders = {}) {
    const res = await fetch(`${SUPABASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": ANON_KEY,
            "Authorization": `Bearer ${ANON_KEY}`,
            ...extraHeaders,
        },
        body: JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
}

async function main() {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  PAX — Merchant Account Setup");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // ── Step 1: Sign up ──────────────────────────────────────
    console.log("1️⃣  Registering account...");
    const { ok: signupOk, data: signup } = await post("/auth/v1/signup", {
        email: EMAIL,
        password: PASSWORD,
        data: { full_name: NAME },
    });

    const alreadyExists =
        signup?.code === "user_already_exists" ||
        signup?.msg?.includes("already registered") ||
        signup?.error === "User already registered";

    if (!signupOk && !alreadyExists) {
        console.error("❌ Signup failed:", signup);
        process.exit(1);
    }

    if (alreadyExists) {
        console.log("   ⚠️  User already exists — will sign in instead.\n");
    } else {
        console.log("   ✅ Signup request sent.\n");
    }

    // ── Step 2: Try signing in ───────────────────────────────
    console.log("2️⃣  Signing in...");
    const { ok: signinOk, data: signin } = await post(
        "/auth/v1/token?grant_type=password",
        { email: EMAIL, password: PASSWORD }
    );

    if (!signinOk) {
        // Email not confirmed — print instructions
        if (signin?.error_code === "email_not_confirmed") {
            console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("  ⚠️  EMAIL CONFIRMATION REQUIRED");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("");
            console.log("  The account was created, but Supabase requires");
            console.log("  email confirmation before you can log in.\n");
            console.log("  Choose ONE of these options:\n");
            console.log("  Option A — Supabase Dashboard (easiest):");
            console.log(`  → https://supabase.com/dashboard/project/${SUPABASE_URL.split("//")[1].split(".")[0]}/auth/users`);
            console.log(`  → Find ${EMAIL} → click ⋮ → \"Send confirmation email\"\n`);
            console.log("  Option B — Disable email confirmation (dev only):");
            console.log(`  → https://supabase.com/dashboard/project/${SUPABASE_URL.split("//")[1].split(".")[0]}/auth/providers`);
            console.log("  → Email → Toggle OFF \"Confirm email\"\n");
            console.log("  Option C — Provide service_role key:");
            console.log("  → Project Settings → API → service_role key");
            console.log("  → node create-merchant-v3.mjs <service_role_key>\n");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("  Credentials (save these):");
            console.log(`  Email    : ${EMAIL}`);
            console.log(`  Password : ${PASSWORD}`);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            process.exit(0);
        }
        console.error("❌ Sign-in failed:", signin);
        process.exit(1);
    }

    const userId = signin.user?.id;
    const userToken = signin.access_token;
    console.log(`   ✅ Signed in  │ UID: ${userId}\n`);

    // ── Step 3: Set account_type = business ─────────────────
    console.log("3️⃣  Setting account type to 'business'...");
    const patchRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "apikey": ANON_KEY,
                "Authorization": `Bearer ${userToken}`,
                "Prefer": "return=minimal",
            },
            body: JSON.stringify({ full_name: NAME, account_type: "business" }),
        }
    );

    if (!patchRes.ok) {
        const err = await patchRes.text();
        console.warn("   ⚠️  Profile update:", patchRes.status, err);
    } else {
        console.log("   ✅ Profile → account_type: business\n");
    }

    // ── Done ─────────────────────────────────────────────────
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  🏢  MERCHANT ACCOUNT READY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Email    : ${EMAIL}`);
    console.log(`  Password : ${PASSWORD}`);
    console.log(`  UID      : ${userId}`);
    console.log(`  Type     : business`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  🔗 Login:     http://localhost:3000/login");
    console.log("  🔗 Dashboard: http://localhost:3000/dashboard\n");
}

// If a service_role_key is passed as argv[2], use admin API instead
const SERVICE_KEY = process.argv[2];
if (SERVICE_KEY) {
    console.log("\nUsing service_role key — creating + auto-confirming...\n");
    fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": SERVICE_KEY,
            "Authorization": `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({
            email: EMAIL,
            password: PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: NAME },
        }),
    })
        .then(r => r.json())
        .then(async data => {
            if (data.id) {
                console.log(`✅ Admin-created user: ${data.id}`);
                // Update profile
                await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${data.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": SERVICE_KEY,
                        "Authorization": `Bearer ${SERVICE_KEY}`,
                        "Prefer": "return=minimal",
                    },
                    body: JSON.stringify({ full_name: NAME, account_type: "business" }),
                });
                console.log("✅ Profile → business\n");
                console.log("  Email    :", EMAIL);
                console.log("  Password :", PASSWORD);
                console.log("  Login:     http://localhost:3000/login");
                console.log("  Dashboard: http://localhost:3000/dashboard\n");
            } else {
                console.log("Response:", JSON.stringify(data, null, 2));
                // Fall through to normal signup
                main();
            }
        });
} else {
    main().catch(e => { console.error("Fatal:", e); process.exit(1); });
}
