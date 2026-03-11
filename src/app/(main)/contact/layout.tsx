import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact Us | PAN African Express",
    description: "Get in touch with PAN African Express. We're available 24/7 to assist with your delivery, tracking, and logistics questions across Nigeria.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
