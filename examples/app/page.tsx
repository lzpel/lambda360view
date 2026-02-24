'use client';

import { useState, useEffect, useMemo } from 'react';
import { Lambda360View } from 'lambda360view';
import type { Annotation } from 'lambda360view';

export default function Home() {
    const [model, setModel] = useState<ArrayBuffer | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_PREFIX || ''}/hexapod.glb`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.arrayBuffer();
            })
            .then((buffer) => setModel(buffer))
            .catch((e) => setError(`Failed to load model: ${e}`));
    }, []);

    const annotations = useMemo<Annotation[]>(() => [
        {
            type: 'point',
            position: [152, 100, 44],
            label: 'Material: SUS304',
        },
        {
            type: 'distance',
            start: [-152, -87, -62],
            end: [152, -87, -62],
            label: '304mm',
        },
    ], []);

    if (error) {
        return (
            <main style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1a1a2e',
                color: '#fff'
            }}>
                <p>{error}</p>
            </main>
        );
    }

    if (!model) {
        return (
            <main style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1a1a2e',
                color: '#fff'
            }}>
                <p>Loading model...</p>
            </main>
        );
    }

    return (
        <main style={{ width: '100vw', height: '100vh' }}>
            <Lambda360View
                model={model}
                backgroundColor="#f0f0f0"
                edgeColor="#000000"
                showEdges={true}
                orthographic={true}
                upAxis="Z"
                showViewMenu={true}
                style={{ width: '100%', height: '100%' }}
                annotations={annotations}
                footer={
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px',
                        color: '#666',
                        fontSize: '12px',
                        fontFamily: 'sans-serif'
                    }}>
                        <span>lambda360view</span>
                        <span>powered by Surfic LLC</span>
                    </div>
                }
            />
        </main>
    );
}
