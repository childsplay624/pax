import { Metadata } from 'next';
import RiderClientLayout from './RiderClientLayout';

export const metadata: Metadata = {
    title: 'PAX Rider Hub',
    description: "PAN African Express — Rider Operations Dashboard. Manage dispatches, track deliveries and monitor performance.",
    manifest: '/rider-manifest.json',
    themeColor: '#eb0000',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'PAX Rider',
    },
    applicationName: 'PAX Rider',
    viewport: 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, viewport-fit=cover',
    other: {
        'mobile-web-app-capable': 'yes',
        'msapplication-TileColor': '#eb0000',
        'msapplication-TileImage': '/rider-icon-192.png',
    }
};

export default function RiderLayout({ children }: { children: React.ReactNode }) {
    return <RiderClientLayout>{children}</RiderClientLayout>;
}
