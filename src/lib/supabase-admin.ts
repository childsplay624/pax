import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

// This client has admin privileges (service role)
// USE WITH EXTREME CAUTION — ONLY IN SERVER ACTIONS
export const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        // Provide a dummy client or throw a more descriptive error during runtime
        // but avoid crashing the module import during build if possible
        console.warn("[SupabaseAdmin] Missing keys — client initialization deferred.");
    }

    return createClient<Database>(
        supabaseUrl || "https://placeholder.supabase.co",
        supabaseServiceKey || "placeholder-key",
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
};

// For backward compatibility if needed, but better to update callsites
export const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key",
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);
