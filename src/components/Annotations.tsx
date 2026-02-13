import React, { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Annotation, PointAnnotation, DistanceAnnotation } from '../types';

const PointAnnotationRenderer = ({ annotation }: { annotation: PointAnnotation }) => {
    const { position, label } = annotation;

    // Offset for the label to visualize a leader line
    // In a real CAD app, this might be view-dependent or manually positioned.
    // Here we'll use a fixed vertical offset for simplicity.
    const offsetHeight = 50;
    const endPosition: [number, number, number] = [position[0], position[1] + offsetHeight, position[2]];

    return (
        <group>
            {/* Marker at the point */}
            <mesh position={position}>
                <sphereGeometry args={[2]} />
                <meshBasicMaterial color="#ff0000" />
            </mesh>

            {/* Leader Line */}
            <Line
                points={[position, endPosition]}
                color="black"
                lineWidth={1}
            />

            <Html position={endPosition} style={{ pointerEvents: 'none' }} center>
                <div style={{
                    fontFamily: 'sans-serif',
                    fontSize: '12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #333',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    {label}
                </div>
            </Html>
        </group>
    );
};

const DistanceAnnotationRenderer = ({ annotation }: { annotation: DistanceAnnotation }) => {
    const { start, end, label } = annotation;
    const startVec = useMemo(() => new THREE.Vector3(...start), [start]);
    const endVec = useMemo(() => new THREE.Vector3(...end), [end]);
    const midPoint = useMemo(() => startVec.clone().add(endVec).multiplyScalar(0.5), [startVec, endVec]);
    const direction = useMemo(() => endVec.clone().sub(startVec).normalize(), [startVec, endVec]);
    const length = useMemo(() => startVec.distanceTo(endVec), [startVec, endVec]);

    // Calculate rotation for arrowheads
    const quaternion = useMemo(() => {
        const dummy = new THREE.Object3D();
        dummy.lookAt(direction); // default lookAt is +z
        // Cone geometry points up (+y) by default? No, usually +y.
        // We need to align the cone with the line.
        // Let's rely on LookAt appearing correct.
        return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    }, [direction]);

    return (
        <group>
            {/* Main Line */}
            <Line
                points={[start, end]}
                color="black"
                lineWidth={1}
            />

            {/* End Markers (Vertical Ticks) */}
            {/* To draw ticks perpendicular to the line is hard without a reference up vector. 
                We'll skip ticks for now and just use arrows or dots.
                Let's use small spheres at the endpoints.
            */}
            <mesh position={start}>
                <sphereGeometry args={[1]} />
                <meshBasicMaterial color="black" />
            </mesh>
            <mesh position={end}>
                <sphereGeometry args={[1]} />
                <meshBasicMaterial color="black" />
            </mesh>

            <Html position={midPoint.toArray()} style={{ pointerEvents: 'none' }} center>
                <div style={{
                    fontFamily: 'sans-serif',
                    fontSize: '12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid #333',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                    {label}
                </div>
            </Html>
        </group>
    );
};

export const Annotations = ({ annotations }: { annotations: Annotation[] }) => {
    return (
        <group>
            {annotations.map((ann, i) => {
                if (ann.type === 'point') {
                    return <PointAnnotationRenderer key={i} annotation={ann} />;
                }
                if (ann.type === 'distance') {
                    return <DistanceAnnotationRenderer key={i} annotation={ann} />;
                }
                return null;
            })}
        </group>
    );
};
