import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PAN African Express | Nigeria's Premier Interstate Courier & Logistics",
  description: "PAN African Express — fast, reliable parcel delivery and logistics across all 36 Nigerian states and the FCT. Expanding across Africa.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geistMono.variable} antialiased bg-surface-0 text-ink-900`}>
        {children}
      </body>
    </html>
  );
}
