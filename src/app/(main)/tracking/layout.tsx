import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Track Your Parcel | PAN African Express",
    description: "Get real-time updates on your PAN African Express shipment. Enter your PAX tracking number for live location, status, and estimated delivery time.",
};

export default function TrackingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
