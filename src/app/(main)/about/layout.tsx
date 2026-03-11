import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About PAN African Express | Nigeria's Premier Courier",
    description: "Learn about PAN African Express — our mission to connect every Nigerian city with fast, reliable, and affordable parcel delivery and logistics services.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
