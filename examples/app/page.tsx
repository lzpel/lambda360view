import Link from 'next/link';

export default function Home() {
    return (
        <main style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1a2e',
            color: '#fff',
            fontFamily: 'sans-serif',
        }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: 28, marginBottom: 32 }}>lambda360view Examples</h1>
                <div style={{ display: 'flex', gap: 24 }}>
                    <Link
                        href="/json"
                        style={{
                            display: 'block',
                            padding: '24px 32px',
                            border: '1px solid #555',
                            borderRadius: 8,
                            color: '#fff',
                            textDecoration: 'none',
                            fontSize: 18,
                        }}
                    >
                        JSON Example
                        <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
                            ModelData (hexapod.js)
                        </p>
                    </Link>
                    <Link
                        href="/glb"
                        style={{
                            display: 'block',
                            padding: '24px 32px',
                            border: '1px solid #555',
                            borderRadius: 8,
                            color: '#fff',
                            textDecoration: 'none',
                            fontSize: 18,
                        }}
                    >
                        GLB Example
                        <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
                            glbUrl / glbData
                        </p>
                    </Link>
                </div>
            </div>
        </main>
    );
}
