import { supabaseAdmin } from "./supabase-admin";

type LogLevel = "info" | "warn" | "error" | "fatal";

interface LogParams {
    message: string;
    level?: LogLevel;
    context?: any;
    source?: string;
    userId?: string | null;
}

/**
 * Centralized Logger for PAN African Express
 * Persists important system events and errors to the database.
 */
export const logger = {
    async log({ message, level = "info", context = {}, source = "server_action", userId = null }: LogParams) {
        // Prepare context: Sanitize sensitive data if necessary
        const sanitizedContext = { ...context };
        if (sanitizedContext.password) sanitizedContext.password = "[REDACTED]";
        if (sanitizedContext.api_key) sanitizedContext.api_key = "[REDACTED]";

        try {
            const { error } = await (supabaseAdmin as any).from("system_logs").insert({
                level,
                message,
                context: sanitizedContext,
                source,
                user_id: userId
            });

            if (error) {
                console.error("🚨 Failed to save to system_logs table:", error);
            }
        } catch (err) {
            console.error("🚨 Critical failure in logger utility:", err);
        }

        // Also output to console for local development visibility
        const emoji = { info: "🔹", warn: "⚠️", error: "🚨", fatal: "💀" }[level];
        console.log(`${emoji} [${source.toUpperCase()}] ${message}`, level === "error" ? sanitizedContext : "");
    },

    async info(message: string, context?: any, source?: string, userId?: string | null) {
        return this.log({ message, level: "info", context, source, userId });
    },

    async warn(message: string, context?: any, source?: string, userId?: string | null) {
        return this.log({ message, level: "warn", context, source, userId });
    },

    async error(message: string, context?: any, source?: string, userId?: string | null) {
        return this.log({ message, level: "error", context, source, userId });
    },

    async fatal(message: string, context?: any, source?: string, userId?: string | null) {
        return this.log({ message, level: "fatal", context, source, userId });
    }
};
