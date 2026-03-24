import type { Metadata } from 'next';
import { CSSProperties } from 'react';

export const metadata: Metadata = {
    title: 'Lambda360View Demo',
    description: '3D Viewer for CAD-like models with edge display',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const full: CSSProperties = {
        width: '100%',
        height: '100%',
    }
    return (
        <html lang="ja" style={full}>
            <body style={full}>{children}</body>
        </html>
    );
}
