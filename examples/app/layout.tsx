import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Lambda360View Demo',
    description: '3D Viewer for CAD-like models with edge display',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ja">
            <body>{children}</body>
        </html>
    );
}
