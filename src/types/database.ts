export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            /* ── Shipments ──────────────────────────────────────────── */
            shipments: {
                Row: {
                    id: string;
                    tracking_id: string;
                    status: "pending" | "confirmed" | "collected" | "in_transit" | "at_hub" | "out_for_delivery" | "delivered" | "failed";
                    service_type: "same_day" | "standard" | "express" | "bulk";
                    sender_name: string | null;
                    sender_phone: string | null;
                    sender_address: string | null;
                    sender_state: string | null;
                    recipient_name: string | null;
                    recipient_phone: string | null;
                    recipient_address: string | null;
                    recipient_state: string | null;
                    origin_city: string | null;
                    destination_city: string | null;
                    weight_kg: number | null;
                    declared_value: number | null;
                    insured: boolean;
                    special_instructions: string | null;
                    estimated_delivery: string | null;
                    rider_name: string | null;
                    rider_phone: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["shipments"]["Row"], "id" | "created_at" | "updated_at">;
                Update: Partial<Database["public"]["Tables"]["shipments"]["Insert"]>;
            };

            /* ── Tracking Events ───────────────────────────────────── */
            tracking_events: {
                Row: {
                    id: string;
                    shipment_id: string;
                    tracking_id: string;
                    event_title: string;
                    event_location: string | null;
                    event_description: string | null;
                    status: "done" | "current" | "upcoming";
                    event_date: string | null;
                    event_time: string | null;
                    sort_order: number;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["tracking_events"]["Row"], "id" | "created_at">;
                Update: Partial<Database["public"]["Tables"]["tracking_events"]["Insert"]>;
            };

            /* ── Contact Messages ──────────────────────────────────── */
            contact_messages: {
                Row: {
                    id: string;
                    full_name: string;
                    email: string;
                    state: string | null;
                    service: string | null;
                    message: string | null;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["contact_messages"]["Row"], "id" | "created_at">;
                Update: Partial<Database["public"]["Tables"]["contact_messages"]["Insert"]>;
            };

            /* ── Business Inquiries ────────────────────────────────── */
            business_inquiries: {
                Row: {
                    id: string;
                    company_name: string | null;
                    contact_name: string;
                    email: string;
                    phone: string | null;
                    daily_volume: string | null;
                    message: string | null;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["business_inquiries"]["Row"], "id" | "created_at">;
                Update: Partial<Database["public"]["Tables"]["business_inquiries"]["Insert"]>;
            };

            /* ── Profiles (extends Supabase auth.users) ────────────── */
            profiles: {
                Row: {
                    id: string;  // same as auth.users.id
                    full_name: string | null;
                    phone: string | null;
                    state: string | null;
                    account_type: "personal" | "business";
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at">;
                Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
            };
        };

        Views: { [_ in never]: never };
        Functions: { [_ in never]: never };
        Enums: { [_ in never]: never };
    };
}

/* ── Convenience row types ──────────────────────────────────── */
export type Shipment = Database["public"]["Tables"]["shipments"]["Row"];
export type TrackingEvent = Database["public"]["Tables"]["tracking_events"]["Row"];
export type ContactMessage = Database["public"]["Tables"]["contact_messages"]["Row"];
export type BusinessInquiry = Database["public"]["Tables"]["business_inquiries"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
