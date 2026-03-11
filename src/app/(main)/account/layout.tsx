import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "My Account | PAN African Express",
    description: "View and manage your PAN African Express shipments. Track active deliveries, view your history, and book new parcels from your personal dashboard.",
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
