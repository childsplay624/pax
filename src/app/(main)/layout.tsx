import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingTracker from "@/components/FloatingTracker";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Navbar />
            <main>{children}</main>
            <Footer />
            <FloatingTracker />
        </>
    );
}
