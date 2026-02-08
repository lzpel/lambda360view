'use client';

import { useState, useEffect } from 'react';
import { Lambda360View } from 'lambda360view';
import type { ModelData } from 'lambda360view';

export default function Home() {
    const [model, setModel] = useState<ModelData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Load hexapod.js dynamically
        const loadModel = async () => {
            try {
                // hexapod.js exports a global variable 'hexapod'
                // We need to load it as a script and access the global
                const script = document.createElement('script');
                script.src = '/hexapod.js';
                script.onload = () => {
                    // @ts-ignore - hexapod is defined in the loaded script
                    if (typeof window.hexapod !== 'undefined') {
                        // @ts-ignore
                        setModel(window.hexapod as ModelData);
                    } else {
                        setError('Failed to load model: hexapod variable not found');
                    }
                };
                script.onerror = () => {
                    setError('Failed to load hexapod.js');
                };
                document.head.appendChild(script);
            } catch (e) {
                setError(`Failed to load model: ${e}`);
            }
        };

        loadModel();
    }, []);

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
                upAxis="Z"
                width="100%"
                height="100%"
            />
        </main>
    );
}
