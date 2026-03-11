import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Shipping Rate Calculator | PAN African Express",
    description: "Get instant ₦-denominated shipping quotes for any route in Nigeria. Calculate express, same-day, and standard delivery rates by state and weight.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
