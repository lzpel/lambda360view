import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Lambda360ViewProps, ModelData } from '../types';
import { ModelRenderer } from './ModelRenderer';

/**
 * Get rotation to convert from model's up axis to Three.js Y-up
 */
function getUpAxisRotation(upAxis: 'Y' | 'Z' | '-Y' | '-Z'): THREE.Euler {
    switch (upAxis) {
        case 'Y':
            return new THREE.Euler(0, 0, 0);
        case '-Y':
            return new THREE.Euler(Math.PI, 0, 0);
        case 'Z':
            return new THREE.Euler(-Math.PI / 2, 0, 0);
        case '-Z':
            return new THREE.Euler(Math.PI / 2, 0, 0);
        default:
            return new THREE.Euler(0, 0, 0);
    }
}

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
    upAxis = 'Y',
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

    // Get rotation for up axis conversion
    const upAxisRotation = useMemo(() => getUpAxisRotation(upAxis), [upAxis]);

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

                <group rotation={upAxisRotation}>
                    <ModelRenderer
                        model={model}
                        edgeColor={edgeColor}
                        showEdges={showEdges}
                    />
                </group>

                <OrbitControls
                    target={cameraConfig.target}
                    enableDamping
                    dampingFactor={0.05}
                />
            </Canvas>
        </div>
    );
};
