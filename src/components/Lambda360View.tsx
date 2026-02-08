import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Lambda360ViewProps, ModelData } from '../types';
import { ModelRenderer } from './ModelRenderer';

/**
 * Lambda360View - A 3D viewer component for CAD-like models with edge display
 */
export const Lambda360View: React.FC<Lambda360ViewProps> = ({
    model,
    backgroundColor = '#1a1a2e',
    edgeColor = '#000000',
    showEdges = true,
    width = '100%',
    height = '100%',
    className,
    style,
}) => {
    // Calculate camera position based on bounding box
    const cameraConfig = useMemo(() => {
        const bb = model.bb;
        const centerX = (bb.xmin + bb.xmax) / 2;
        const centerY = (bb.ymin + bb.ymax) / 2;
        const centerZ = (bb.zmin + bb.zmax) / 2;

        const sizeX = bb.xmax - bb.xmin;
        const sizeY = bb.ymax - bb.ymin;
        const sizeZ = bb.zmax - bb.zmin;
        const maxSize = Math.max(sizeX, sizeY, sizeZ);

        // Position camera to see the entire model
        const distance = maxSize * 1.5;

        return {
            position: [distance, distance * 0.5, distance] as [number, number, number],
            target: [centerX, centerY, centerZ] as [number, number, number],
            far: maxSize * 10,
            near: 0.1,
        };
    }, [model.bb]);

    const containerStyle: React.CSSProperties = {
        width,
        height,
        ...style,
    };

    return (
        <div className={className} style={containerStyle}>
            <Canvas
                camera={{
                    position: cameraConfig.position,
                    fov: 50,
                    near: cameraConfig.near,
                    far: cameraConfig.far,
                }}
                gl={{ antialias: true }}
                style={{ background: backgroundColor }}
            >
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 5]} intensity={0.8} />
                <directionalLight position={[-10, -10, -5]} intensity={0.3} />

                <ModelRenderer
                    model={model}
                    edgeColor={edgeColor}
                    showEdges={showEdges}
                />

                <OrbitControls
                    target={cameraConfig.target}
                    enableDamping
                    dampingFactor={0.05}
                />
            </Canvas>
        </div>
    );
};
