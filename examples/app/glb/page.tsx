'use client';

import { useState, useCallback } from 'react';
import { Lambda360View } from 'lambda360view';

export default function GlbDemo() {
    const defaultGlbUrl = `${process.env.NEXT_PUBLIC_PREFIX}/low_poly_mccree.glb`;
    const [glbData, setGlbData] = useState<ArrayBuffer | null>(null);
    const [glbUrl, setGlbUrl] = useState<string>(defaultGlbUrl);
    const [mode, setMode] = useState<'url' | 'file' | null>('url');

    // Handle file drop / selection
    const handleFile = useCallback((file: File) => {
        file.arrayBuffer().then((buffer) => {
            setGlbData(buffer);
            setGlbUrl('');
            setMode('file');
        });
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
            handleFile(file);
        }
    }, [handleFile]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    // Handle URL input
    const handleUrlSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (glbUrl.trim()) {
            setGlbData(null);
            setMode('url');
        }
    }, [glbUrl]);

    // Show viewer if we have a source
    if (mode === 'url' && glbUrl) {
        return (
            <main style={{ width: '100vw', height: '100vh' }}>
                <Lambda360View
                    glbUrl={glbUrl}
                    backgroundColor="#f0f0f0"
                    showEdges={true}
                    showViewMenu={true}
                    width="100%"
                    height="100%"
                    footer={
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px',
                            color: '#666',
                            fontSize: '12px',
                            fontFamily: 'sans-serif'
                        }}>
                            <span>lambda360view - GLB (URL)</span>
                            <button
                                onClick={() => { setMode(null); setGlbUrl(defaultGlbUrl); }}
                                style={{
                                    pointerEvents: 'auto',
                                    padding: '4px 12px',
                                    cursor: 'pointer',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    background: '#fff',
                                }}
                            >
                                Back
                            </button>
                        </div>
                    }
                />
            </main>
        );
    }

    if (mode === 'file' && glbData) {
        return (
            <main style={{ width: '100vw', height: '100vh' }}>
                <Lambda360View
                    glbData={glbData}
                    backgroundColor="#f0f0f0"
                    showEdges={true}
                    showViewMenu={true}
                    width="100%"
                    height="100%"
                    footer={
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px',
                            color: '#666',
                            fontSize: '12px',
                            fontFamily: 'sans-serif'
                        }}>
                            <span>lambda360view - GLB (ArrayBuffer)</span>
                            <button
                                onClick={() => { setMode(null); setGlbData(null); }}
                                style={{
                                    pointerEvents: 'auto',
                                    padding: '4px 12px',
                                    cursor: 'pointer',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    background: '#fff',
                                }}
                            >
                                Back
                            </button>
                        </div>
                    }
                />
            </main>
        );
    }

    // Landing: choose input method
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
            <div style={{ maxWidth: 480, width: '100%', padding: 24 }}>
                <h1 style={{ fontSize: 24, marginBottom: 24 }}>GLB Viewer Demo</h1>

                {/* URL input */}
                <section style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 16, marginBottom: 8, color: '#aaa' }}>Load from URL</h2>
                    <form onSubmit={handleUrlSubmit} style={{ display: 'flex', gap: 8 }}>
                        <input
                            type="text"
                            placeholder="https://example.com/model.glb"
                            value={glbUrl}
                            onChange={(e) => setGlbUrl(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: 4,
                                border: '1px solid #555',
                                backgroundColor: '#2a2a3e',
                                color: '#fff',
                                fontSize: 14,
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                padding: '8px 16px',
                                borderRadius: 4,
                                border: 'none',
                                backgroundColor: '#4a9eff',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: 14,
                            }}
                        >
                            Load
                        </button>
                    </form>
                </section>

                {/* File drop / select */}
                <section>
                    <h2 style={{ fontSize: 16, marginBottom: 8, color: '#aaa' }}>Load from file</h2>
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        style={{
                            border: '2px dashed #555',
                            borderRadius: 8,
                            padding: 32,
                            textAlign: 'center',
                            color: '#888',
                            cursor: 'pointer',
                        }}
                        onClick={() => document.getElementById('glb-file-input')?.click()}
                    >
                        <p>Drop a .glb file here or click to select</p>
                        <input
                            id="glb-file-input"
                            type="file"
                            accept=".glb,.gltf"
                            onChange={handleFileInput}
                            style={{ display: 'none' }}
                        />
                    </div>
                </section>
            </div>
        </main>
    );
}
