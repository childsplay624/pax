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
            booking_requests: {
                Row: {
                    id: string;
                    customer_id: string;
                    rider_id: string | null;
                    pickup_address: string;
                    pickup_lat: number | null;
                    pickup_lng: number | null;
                    dropoff_address: string;
                    dropoff_lat: number | null;
                    dropoff_lng: number | null;
                    package_description: string | null;
                    package_size: "small" | "medium" | "large" | "xl";
                    estimated_weight_kg: number | null;
                    receiver_name: string | null;
                    receiver_phone: string | null;
                    distance_km: number | null;
                    estimated_price: number;
                    final_price: number | null;
                    payment_method: "wallet" | "cash";
                    status: "searching" | "accepted" | "rider_arriving" | "picked_up" | "in_transit" | "delivered" | "cancelled" | "failed";
                    proof_of_delivery_url: string | null;
                    customer_rating: number | null;
                    customer_comment: string | null;
                    rating_given_at: string | null;
                    accepted_at: string | null;
                    picked_up_at: string | null;
                    delivered_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    customer_id: string;
                    rider_id?: string | null;
                    pickup_address: string;
                    pickup_lat?: number | null;
                    pickup_lng?: number | null;
                    dropoff_address: string;
                    dropoff_lat?: number | null;
                    dropoff_lng?: number | null;
                    package_description?: string | null;
                    package_size?: "small" | "medium" | "large" | "xl";
                    estimated_weight_kg?: number | null;
                    receiver_name?: string | null;
                    receiver_phone?: string | null;
                    distance_km?: number | null;
                    estimated_price: number;
                    final_price?: number | null;
                    payment_method?: "wallet" | "cash";
                    status?: "searching" | "accepted" | "rider_arriving" | "picked_up" | "in_transit" | "delivered" | "cancelled" | "failed";
                    proof_of_delivery_url?: string | null;
                    customer_rating?: number | null;
                    customer_comment?: string | null;
                };
                Update: Partial<Database["public"]["Tables"]["booking_requests"]["Insert"]>;
            };
            saved_addresses: {
                Row: {
                    id: string;
                    user_id: string;
                    label: string;
                    address: string;
                    lat: number | null;
                    lng: number | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    label: string;
                    address: string;
                    lat?: number | null;
                    lng?: number | null;
                };
                Update: Partial<Database["public"]["Tables"]["saved_addresses"]["Insert"]>;
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
export type BookingRequest = Database["public"]["Tables"]["booking_requests"]["Row"];
export type SavedAddress = Database["public"]["Tables"]["saved_addresses"]["Row"];
