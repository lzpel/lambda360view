import React, { useMemo } from 'react';
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
export function PartMesh({
    shape,
    color,
    alpha,
    edgeColor,
    showEdges,
}: PartMeshProps) {
    // Create buffer geometry for the mesh
    const meshGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();

        // Vertices are stored as flat array [x1, y1, z1, x2, y2, z2, ...]
        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(shape.vertices, 3)
        );

        // Normals
        if (shape.normals && shape.normals.length > 0) {
            geometry.setAttribute(
                'normal',
                new THREE.BufferAttribute(shape.normals, 3)
            );
        }

        // Triangle indices
        if (shape.triangles && shape.triangles.length > 0) {
            geometry.setIndex(new THREE.BufferAttribute(shape.triangles, 1));
        }

        // Compute normals if not provided
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

    // Parse color
    const meshColor = useMemo(() => new THREE.Color(color), [color]);
    const lineColor = useMemo(() => new THREE.Color(edgeColor), [edgeColor]);

    return (
        <group>
            {/* Main mesh - using BasicMaterial for flat CAD-style colors without lighting */}
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

            {/* Edges */}
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
}
