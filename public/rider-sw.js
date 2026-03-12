// PAX Rider Hub — Standalone Service Worker (no build step required)
// Handles caching, offline fallback, and push notifications for /rider

const CACHE_NAME = "pax-rider-v1";
const OFFLINE_URL = "/rider";

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
    "/rider",
    "/rider/dispatch",
    "/rider/performance",
    "/rider/profile",
    "/rider-manifest.json",
    "/rider-icon-192.png",
    "/rider-icon-512.png",
];

// ── Install: pre-cache core shell ─────────────────────────────
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn("[PAX SW] Pre-cache partial failure (expected in dev):", err);
            });
        })
    );
    self.skipWaiting();
});

// ── Activate: clean old caches ────────────────────────────────
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// ── Fetch: Network-first for API/auth, Cache-first for assets ─
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== "GET") return;

    // 🚨 ONLY intercept requests for our own origin or Supabase
    // This prevents interference with browser extensions, dev tools, and external scripts
    const isInternal = url.origin === self.location.origin;
    const isSupabase = url.hostname.includes("supabase.co");

    if (!isInternal && !isSupabase) return;

    // Skip Supabase auth/realtime (always live)
    if (isSupabase && url.pathname.includes("/auth/")) return;

    // Network-first for rider pages and Supabase REST/Storage
    if (
        url.pathname.startsWith("/rider") ||
        isSupabase
    ) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache a copy of successful responses
                    if (response && response.status === 200 && response.type !== "opaque") {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() =>
                    caches.match(request).then(
                        (cached) => cached || caches.match(OFFLINE_URL)
                    )
                )
        );
        return;
    }

    // Cache-first for static assets (CSS, JS, Fonts, App Icons)
    event.respondWith(
        caches.match(request).then(
            (cached) => cached || fetch(request).catch(() => caches.match(OFFLINE_URL))
        )
    );
});

// ── Push Notifications ────────────────────────────────────────
self.addEventListener("push", (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || "PAX Rider — New Assignment";
    const options = {
        body: data.body || "You have a new dispatch. Tap to view.",
        icon: "/rider-icon-192.png",
        badge: "/rider-icon-192.png",
        tag: "pax-dispatch",
        requireInteraction: true,
        vibrate: [200, 100, 200],
        actions: [
            { action: "view", title: "📦 View Dispatch" },
            { action: "dismiss", title: "Dismiss" },
        ],
        data: { url: data.url || "/rider/dispatch" },
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    if (event.action === "dismiss") return;
    const target = event.notification.data?.url || "/rider/dispatch";
    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes("/rider") && "focus" in client) {
                        client.navigate(target);
                        return client.focus();
                    }
                }
                return clients.openWindow(target);
            })
    );
});
