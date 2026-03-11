import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Book a Shipment | PAN African Express",
    description: "Book a parcel delivery online with PAN African Express. Choose same-day, express, or standard service to any of Nigeria's 36 states and the FCT.",
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
