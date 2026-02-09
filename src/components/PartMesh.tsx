import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import type { ShapeData } from '../types';

interface PartMeshProps {
    shape: ShapeData;
    color: string;
    alpha: number;
    edgeColor: string;
    showEdges: boolean;
}

/**
 * Renders a single part with mesh and edges
 */
export const PartMesh: React.FC<PartMeshProps> = ({
    shape,
    color,
    alpha,
    edgeColor,
    showEdges,
}) => {
    // Create buffer geometry for the mesh
    const meshGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();

        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(shape.vertices, 3)
        );

        if (shape.normals && shape.normals.length > 0) {
            geometry.setAttribute(
                'normal',
                new THREE.BufferAttribute(shape.normals, 3)
            );
        }

        if (shape.triangles && shape.triangles.length > 0) {
            geometry.setIndex(new THREE.BufferAttribute(shape.triangles, 1));
        }

        if (!shape.normals || shape.normals.length === 0) {
            geometry.computeVertexNormals();
        }

        return geometry;
    }, [shape.vertices, shape.normals, shape.triangles]);

    // Create line geometry for edges
    const edgeGeometry = useMemo(() => {
        if (!shape.edges || shape.edges.length === 0) {
            return null;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(shape.edges, 3)
        );

        return geometry;
    }, [shape.edges]);

    // Dispose old geometries when they change or on unmount
    useEffect(() => {
        return () => { meshGeometry.dispose(); };
    }, [meshGeometry]);

    useEffect(() => {
        return () => { edgeGeometry?.dispose(); };
    }, [edgeGeometry]);

    const meshColor = useMemo(() => new THREE.Color(color), [color]);
    const lineColor = useMemo(() => new THREE.Color(edgeColor), [edgeColor]);

    return (
        <group>
            <mesh geometry={meshGeometry}>
                <meshBasicMaterial
                    color={meshColor}
                    transparent={alpha < 1}
                    opacity={alpha}
                    side={THREE.DoubleSide}
                    polygonOffset={true}
                    polygonOffsetFactor={1}
                    polygonOffsetUnits={1}
                />
            </mesh>

            {showEdges && edgeGeometry && (
                <lineSegments geometry={edgeGeometry}>
                    <lineBasicMaterial
                        color={lineColor}
                        linewidth={1}
                    />
                </lineSegments>
            )}
        </group>
    );
};
