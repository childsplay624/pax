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
                    rider_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    tracking_id: string;
                    status?: "pending" | "confirmed" | "collected" | "in_transit" | "at_hub" | "out_for_delivery" | "delivered" | "failed";
                    service_type: "same_day" | "standard" | "express" | "bulk";
                    sender_name?: string | null;
                    sender_phone?: string | null;
                    sender_address?: string | null;
                    sender_state?: string | null;
                    recipient_name?: string | null;
                    recipient_phone?: string | null;
                    recipient_address?: string | null;
                    recipient_state?: string | null;
                    origin_city?: string | null;
                    destination_city?: string | null;
                    weight_kg?: number | null;
                    declared_value?: number | null;
                    insured?: boolean;
                    special_instructions?: string | null;
                    estimated_delivery?: string | null;
                    rider_name?: string | null;
                    rider_phone?: string | null;
                    rider_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["shipments"]["Insert"]>;
            };
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
                Insert: {
                    id?: string;
                    shipment_id: string;
                    tracking_id: string;
                    event_title: string;
                    event_location?: string | null;
                    event_description?: string | null;
                    status: "done" | "current" | "upcoming";
                    event_date?: string | null;
                    event_time?: string | null;
                    sort_order?: number;
                    created_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["tracking_events"]["Insert"]>;
            };
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
                Insert: {
                    id?: string;
                    full_name: string;
                    email: string;
                    state?: string | null;
                    service?: string | null;
                    message?: string | null;
                    created_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["contact_messages"]["Insert"]>;
            };
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
                Insert: {
                    id?: string;
                    company_name?: string | null;
                    contact_name: string;
                    email: string;
                    phone?: string | null;
                    daily_volume?: string | null;
                    message?: string | null;
                    created_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["business_inquiries"]["Insert"]>;
            };
            profiles: {
                Row: {
                    id: string;
                    full_name: string | null;
                    phone: string | null;
                    state: string | null;
                    account_type: "personal" | "business";
                    created_at: string;
                    kyc_status: "verified" | "rejected" | "pending";
                    company_name: string | null;
                };
                Insert: {
                    id: string;
                    full_name?: string | null;
                    phone?: string | null;
                    state?: string | null;
                    account_type: "personal" | "business";
                    created_at?: string;
                    kyc_status?: "verified" | "rejected" | "pending";
                    company_name?: string | null;
                };
                Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
            };
            riders: {
                Row: {
                    id: string;
                    full_name: string;
                    phone: string;
                    vehicle_type: "bike" | "van" | "truck" | "drone";
                    status: "active" | "on_delivery" | "resting" | "offline";
                    current_city: string | null;
                    rating: number | null;
                    total_deliveries: number | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    full_name: string;
                    phone: string;
                    vehicle_type: "bike" | "van" | "truck" | "drone";
                    status?: "active" | "on_delivery" | "resting" | "offline";
                    current_city?: string | null;
                    rating?: number | null;
                    total_deliveries?: number | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["riders"]["Insert"]>;
            };
            merchant_api_keys: {
                Row: {
                    id: string;
                    user_id: string;
                    key_name: string;
                    public_key: string;
                    secret_hash: string;
                    last_used_at: string | null;
                    is_active: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    key_name?: string;
                    public_key: string;
                    secret_hash: string;
                    last_used_at?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["merchant_api_keys"]["Insert"]>;
            };
            merchant_webhooks: {
                Row: {
                    id: string;
                    user_id: string;
                    url: string;
                    secret: string;
                    events: string[];
                    is_active: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    url: string;
                    secret: string;
                    events?: string[];
                    is_active?: boolean;
                    created_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["merchant_webhooks"]["Insert"]>;
            };
        };
        Views: { [_ in never]: never };
        Functions: { [_ in never]: never };
        Enums: { [_ in never]: never };
    };
}

export type Shipment = Database["public"]["Tables"]["shipments"]["Row"];
export type TrackingEvent = Database["public"]["Tables"]["tracking_events"]["Row"];
export type ContactMessage = Database["public"]["Tables"]["contact_messages"]["Row"];
export type BusinessInquiry = Database["public"]["Tables"]["business_inquiries"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Rider = Database["public"]["Tables"]["riders"]["Row"];
export type MerchantApiKey = Database["public"]["Tables"]["merchant_api_keys"]["Row"];
export type MerchantWebhook = Database["public"]["Tables"]["merchant_webhooks"]["Row"];
