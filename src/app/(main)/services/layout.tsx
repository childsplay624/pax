import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Our Services | PAN African Express",
    description: "Explore PAN African Express delivery services — same-day, express interstate, standard ground, and bulk freight. Covering all 36 Nigerian states.",
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
