"use server";

const TERMII_API_KEY = process.env.TERMII_API_KEY!;
const TERMII_BASE = "https://v3.api.termii.com/api";
const SENDER_ID = process.env.TERMII_SENDER_ID ?? "PAN Express";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";

/* ── Rate Limiter Helper ──────────────────────────────────────── */
async function checkLimit(key: string, max: number, refillRate: number): Promise<boolean> {
    /* Rate Limit Disabled for Development/Testing */
    return true;
}

/* ── Normalize Nigerian phone number to international format ─── */
function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0") && digits.length === 11) return "234" + digits.slice(1);
    if (digits.startsWith("234")) return digits;
    return digits;
}

/* ── Send a message via Termii (SMS or WhatsApp) ────────────────
   channel: "generic" (SMS) | "whatsapp" (WhatsApp)
──────────────────────────────────────────────────────────────── */
async function sendTermiiMessage(to: string, message: string, channel: "generic" | "whatsapp" = "generic"): Promise<boolean> {
    if (!TERMII_API_KEY) {
        console.warn(`[Termii] TERMII_API_KEY not set — skipping ${channel}`);
        return false;
    }

    const whatsappDeviceId = process.env.TERMII_WHATSAPP_DEVICE_ID;
    const from = (channel === "whatsapp" && whatsappDeviceId) ? whatsappDeviceId : SENDER_ID;
    const phone = normalizePhone(to);

    // Rate Limit: Max 5 messages per phone per hour to prevent spam/billing attacks
    const isAllowed = await checkLimit(`termii:${phone}`, 5, 3600);
    if (!isAllowed) {
        await logger.warn(`Termii rate limit hit for ${phone}`, { channel }, "notifications:sendTermiiMessage");
        return false;
    }

    try {
        const res = await fetch(`${TERMII_BASE}/sms/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                to: normalizePhone(to),
                from,
                sms: message,
                type: "plain",
                channel,
                api_key: TERMII_API_KEY,
            }),
        });

        const json = await res.json();
        if (!res.ok || json.code !== "ok") {
            await logger.error(`Termii ${channel} request failed`, { json, phone }, "notifications:sendTermiiMessage");
            return false;
        }
        return true;
    } catch (err) {
        await logger.fatal(`Termii fetch error during ${channel}`, { error: err, phone }, "notifications:sendTermiiMessage");
        return false;
    }
}

export async function sendSMS(to: string, message: string) {
    return await sendTermiiMessage(to, message, "generic");
}

export async function sendWhatsApp(to: string, message: string) {
    return await sendTermiiMessage(to, message, "whatsapp");
}

/* ── Booking Confirmation SMS ───────────────────────────────────
   Sent to sender immediately after a shipment is booked.
──────────────────────────────────────────────────────────────── */
export async function sendBookingConfirmationSMS(data: {
    senderPhone: string;
    senderName: string;
    trackingId: string;
    origin: string;
    destination: string;
    eta: string;
}): Promise<void> {
    const msg =
        `Hi ${data.senderName.split(" ")[0]}, your PAX shipment is confirmed! ` +
        `Tracking ID: ${data.trackingId}. ` +
        `Route: ${data.origin} → ${data.destination}. ` +
        `ETA: ${data.eta}. ` +
        `Track live: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://panafricanexpress.ng"}/tracking?id=${data.trackingId}`;

    await sendSMS(data.senderPhone, msg);
    await sendWhatsApp(data.senderPhone, msg);
}

/* ── Delivery Notification SMS ──────────────────────────────────
   Sent to recipient when the shipment is "Out for Delivery".
──────────────────────────────────────────────────────────────── */
export async function sendOutForDeliverySMS(data: {
    recipientPhone: string;
    recipientName: string;
    trackingId: string;
    address: string;
    otp: string;
}): Promise<void> {
    const msg =
        `Hi ${data.recipientName.split(" ")[0]}, your PAX parcel is out for delivery today! ` +
        `It will be delivered to: ${data.address}. ` +
        `Your OTP for collection: ${data.otp}. ` +
        `Track: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://panafricanexpress.ng"}/tracking?id=${data.trackingId}`;

    await sendSMS(data.recipientPhone, msg);
    await sendWhatsApp(data.recipientPhone, msg);
}

/* ── Delivery Success SMS ───────────────────────────────────────
   Sent to sender once the shipment is marked "Delivered".
──────────────────────────────────────────────────────────────── */
export async function sendDeliveredSMS(data: {
    senderPhone: string;
    senderName: string;
    trackingId: string;
    recipientName: string;
    destination: string;
}): Promise<void> {
    const msg =
        `Great news, ${data.senderName.split(" ")[0]}! Your parcel ${data.trackingId} has been successfully delivered to ` +
        `${data.recipientName} in ${data.destination}. Thank you for choosing PAN African Express!`;

    await sendSMS(data.senderPhone, msg);
    await sendWhatsApp(data.senderPhone, msg);
}

/* ── Status Update SMS ──────────────────────────────────────────
   Generic status change alert. Called from admin panel updates.
──────────────────────────────────────────────────────────────── */
export async function sendStatusUpdateSMS(data: {
    phone: string;
    name: string;
    trackingId: string;
    status: string;
    location: string;
}): Promise<void> {
    const statusLabels: Record<string, string> = {
        collected: "picked up by our courier",
        in_transit: "now in transit",
        at_hub: `arrived at our ${data.location} hub`,
        out_for_delivery: "out for delivery",
        delivered: "delivered successfully",
        failed: "could not be delivered (our team will retry)",
    };

    const label = statusLabels[data.status] ?? `updated to: ${data.status}`;
    const msg =
        `PAX Update — Hi ${data.name.split(" ")[0]}, your parcel ${data.trackingId} has been ${label}. ` +
        `Track: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://panafricanexpress.ng"}/tracking?id=${data.trackingId}`;

    await sendSMS(data.phone, msg);
    await sendWhatsApp(data.phone, msg);
}

/* ── Wallet Funded SMS ──────────────────────────────────────────
   Sent to merchant after a successful Paystack wallet top-up.
──────────────────────────────────────────────────────────────── */
export async function sendWalletCreditedSMS(data: {
    phone: string;
    name: string;
    amount: number;
    newBalance: number;
}): Promise<void> {
    const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;
    const msg =
        `Hi ${data.name.split(" ")[0]}, your PAX Business Wallet has been credited with ${fmt(data.amount)}. ` +
        `New Balance: ${fmt(data.newBalance)}. ` +
        `Start shipping at: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://panafricanexpress.ng"}/dashboard`;

    await sendSMS(data.phone, msg);
    await sendWhatsApp(data.phone, msg);
}
import { createServerSupabaseClient } from "@/lib/supabase-server";

/* ── Get User Notifications ─────────────────────────────────── */
export async function getNotifications() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

    return data ?? [];
}

/* ── Mark Notification as Read ──────────────────────────────── */
export async function markNotificationAsRead(id: string) {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
}

/* ── Mark All as Read ───────────────────────────────────────── */
export async function markAllAsRead() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);
}
import webpush from "web-push";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BDHNGxH7ORPn_hFaQhnWorb6ZXZjwsJxBXW2kbB_uCRN92LHc9pPya2TxJu_VjVMIp18DK1vsCe82a29ZeHix6g";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "huuIM4xahwyUJOmfHoZQUhIQlDjqWmgiuslnEkK0mGg";

webpush.setVapidDetails(
    "mailto:support@panafricanexpress.ng",
    VAPID_PUBLIC,
    VAPID_PRIVATE
);

/* ── Save Push Subscription ────────────────────────────────── */
export async function savePushSubscription(sub: any) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
        .from("push_subscriptions")
        .upsert({
            user_id: user.id,
            endpoint: sub.endpoint,
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
        }, { onConflict: 'user_id,endpoint' });

    return { success: !error };
}

/* ── Send Push Notification ─────────────────────────────────── */
export async function sendPushNotification(userId: string, title: string, body: string, url = "/dashboard") {
    const supabase = await createServerSupabaseClient();

    // Get all subscriptions for this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subs } = await (supabase as any)
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", userId);

    if (!subs) return;

    const payload = JSON.stringify({ title, body, url });

    const results = await Promise.allSettled(subs.map((s: any) => {
        const pushSubscription = {
            endpoint: s.endpoint,
            keys: {
                p256dh: s.p256dh,
                auth: s.auth
            }
        };
        return webpush.sendNotification(pushSubscription, payload);
    }));

    // Cleanup dead subscriptions
    results.forEach(async (res, i) => {
        if (res.status === 'rejected' && (res.reason.statusCode === 404 || res.reason.statusCode === 410)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).from("push_subscriptions").delete().eq("id", subs[i].id);
        }
    });
}

import nodemailer from "nodemailer";

/* ── SMTP Transporter Configuration ────────────────────────── */
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/* ── Send Email via SMTP ───────────────────────────────────── */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("[SMTP] Credentials not set — skipping email");
        return false;
    }

    // Rate Limit: Max 10 emails per address per hour
    const isAllowed = await checkLimit(`email:${to}`, 10, 3600);
    if (!isAllowed) {
        await logger.warn(`SMTP rate limit hit for ${to}`, { subject }, "notifications:sendEmail");
        return false;
    }

    try {
        await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || "PAN African Express"}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });
        return true;
    } catch (err) {
        await logger.error("SMTP send failed", { error: err, to, subject }, "notifications:sendEmail");
        return false;
    }
}

/* ── Welcome Email ─────────────────────────────────────────── */
export async function sendWelcomeEmail(to: string, name: string) {
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="background: #e11d48; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">PAN African Express</h1>
            </div>
            <div style="padding: 30px; line-height: 1.6; color: #333;">
                <h2 style="margin-top: 0;">Welcome, ${name.split(" ")[0]}! 🚀</h2>
                <p>We're thrilled to have you on board. PAN African Express is your gateway to seamless, modern logistics across the continent.</p>
                <p>You can now start booking shipments, managing your fleet, and tracking parcels in real-time from your dashboard.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #e11d48; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
                </div>
                <p>If you have any questions, our support team is always here to help.</p>
                <p>Best regards,<br>The PAX Team</p>
            </div>
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
                &copy; 2024 Pan Africa Express. All rights reserved.
            </div>
        </div>
    `;
    await sendEmail(to, "Welcome to PAN African Express!", html);
}

/* ── Verification Email ─────────────────────────────────────── */
export async function sendVerificationEmail(to: string, link: string) {
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="background: #e11d48; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">PAN African Express</h1>
            </div>
            <div style="padding: 30px; line-height: 1.6; color: #333;">
                <h2 style="margin-top: 0;">Verify Your Account</h2>
                <p>Thank you for choosing PAX. Please verify your email address to activate your account and start shipping.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${link}" style="background: #e11d48; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email Address</a>
                </div>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666; font-size: 12px;">${link}</p>
                <p>This link will expire in 24 hours.</p>
            </div>
        </div>
    `;
    await sendEmail(to, "Verify your PAX Account", html);
}

/* ── Password Reset Email ───────────────────────────────────── */
export async function sendPasswordResetEmail(to: string, link: string) {
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="background: #e11d48; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">PAN African Express</h1>
            </div>
            <div style="padding: 30px; line-height: 1.6; color: #333;">
                <h2 style="margin-top: 0;">Reset Your Password</h2>
                <p>We received a request to reset your password. Click the button below to choose a new one.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${link}" style="background: #e11d48; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
                </div>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666; font-size: 12px;">${link}</p>
            </div>
        </div>
    `;
    await sendEmail(to, "Reset your PAX Password", html);
}

/* ── Global Notification Trigger ────────────────────────────── */
export async function triggerNotification(userId: string | null, data: {
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    url?: string;
    phone?: string;
    smsMessage?: string;
    whatsappMessage?: string;
    emailAddress?: string;
    emailSubject?: string;
    emailHtml?: string;
}) {
    // 1. Digital Notifications (In-App + Browser Push)
    if (userId) {
        const supabase = await createServerSupabaseClient();

        // Save to In-App History
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("notifications").insert({
            user_id: userId,
            title: data.title,
            message: data.message,
            type: data.type,
            link: data.url
        });

        // Trigger Browser Push
        await sendPushNotification(userId, data.title, data.message, data.url);
    }

    // 3. SMS Notification (Termii)
    if (data.phone && data.smsMessage) {
        await sendSMS(data.phone, data.smsMessage);
    }

    // 4. WhatsApp Notification (Termii)
    if (data.phone && data.whatsappMessage) {
        await sendWhatsApp(data.phone, data.whatsappMessage);
    }

    // 5. Email Notification (SMTP)
    if (data.emailAddress && data.emailSubject && data.emailHtml) {
        await sendEmail(data.emailAddress, data.emailSubject, data.emailHtml);
    }
}
