import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Enterprise Logistics | PAN African Express Business",
    description: "Scalable corporate shipping solutions for businesses across Nigeria. API integration, bulk manifests, fleet dashboards, and dedicated support.",
};

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
