import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { Lambda360ViewProps } from '../types';
import { ModelRenderer } from './ModelRenderer';
import { ViewMenu, ViewType } from './ViewMenu';

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
 * Camera controller component that handles smooth camera position transitions
 */
const CameraController: React.FC<{
    targetPosition: [number, number, number] | null;
    lookAt: [number, number, number];
}> = ({ targetPosition, lookAt }) => {
    const { camera } = useThree();
    const targetRef = useRef<THREE.Vector3 | null>(null);
    const isAnimating = useRef(false);

    useEffect(() => {
        if (targetPosition) {
            targetRef.current = new THREE.Vector3(...targetPosition);
            isAnimating.current = true;
        }
    }, [targetPosition]);

    useFrame(() => {
        if (isAnimating.current && targetRef.current) {
            const currentPos = camera.position;
            const target = targetRef.current;
            currentPos.lerp(target, 0.1);
            if (currentPos.distanceTo(target) < 0.1) {
                currentPos.copy(target);
                isAnimating.current = false;
            }
            camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
        }
    });

    return null;
};

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
    orthographic = false,
    showViewMenu = false,
}) => {
    const [cameraTarget, setCameraTarget] = useState<[number, number, number] | null>(null);
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
            zoom: 2,
            distance,
        };
    }, [model.bb]);

    // Handle view change from menu
    const handleViewChange = (view: ViewType) => {
        const distance = cameraConfig.distance;
        const positions: Record<ViewType, [number, number, number]> = {
            iso: [distance, distance, distance],
            front: [0, 0, distance],
            back: [0, 0, -distance],
            top: [0, distance, 0],
            bottom: [0, -distance, 0],
            left: [-distance, 0, 0],
            right: [distance, 0, 0],
        };
        setCameraTarget(positions[view]);
    };

    // Get rotation for up axis conversion
    const upAxisRotation = useMemo(() => getUpAxisRotation(upAxis), [upAxis]);

    const containerStyle: React.CSSProperties = {
        width,
        height,
        position: 'relative',
        ...style,
    };

    return (
        <div className={className} style={containerStyle}>
            {showViewMenu && (
                <ViewMenu
                    onViewChange={handleViewChange}
                    showAxisButton={false}
                />
            )}
            <Canvas
                gl={{
                    antialias: true,
                    toneMapping: THREE.NoToneMapping,
                }}
                style={{ background: backgroundColor }}
            >
                {orthographic ? (
                    <OrthographicCamera
                        makeDefault
                        position={cameraConfig.position}
                        zoom={cameraConfig.zoom}
                        near={cameraConfig.near}
                        far={cameraConfig.far}
                    />
                ) : (
                    <PerspectiveCamera
                        makeDefault
                        position={cameraConfig.position}
                        fov={50}
                        near={cameraConfig.near}
                        far={cameraConfig.far}
                    />
                )}

                <CameraController
                    targetPosition={cameraTarget}
                    lookAt={cameraConfig.target}
                />

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
