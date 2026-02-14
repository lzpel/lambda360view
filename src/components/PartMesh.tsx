import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { ShapeData } from '../types';

interface PartMeshProps {
    shape?: ShapeData;
    geometry?: THREE.BufferGeometry;
    edgeGeometry?: THREE.BufferGeometry;
    color: string;
    alpha: number;
    edgeColor: string;
    showEdges: boolean;
}

/**
 * Renders a single part with mesh and edges.
 * Supports two input paths:
 *   - shape (ShapeData): builds BufferGeometry from raw arrays (JSON pipeline)
 *   - geometry (BufferGeometry): uses pre-built geometry directly (GLB pipeline)
 */
export function PartMesh({
    shape,
    geometry,
    edgeGeometry,
    color,
    alpha,
    edgeColor,
    showEdges,
}: PartMeshProps) {
    // Create buffer geometry for the mesh
    const meshGeometry = useMemo(() => {
        // GLB path: use pre-built geometry directly
        if (geometry) return geometry;

        // JSON path: build geometry from ShapeData
        if (!shape) return null;

        const geo = new THREE.BufferGeometry();

        // Vertices are stored as flat array [x1, y1, z1, x2, y2, z2, ...]
        geo.setAttribute(
            'position',
            new THREE.BufferAttribute(shape.vertices, 3)
        );

        // Normals
        if (shape.normals && shape.normals.length > 0) {
            geo.setAttribute(
                'normal',
                new THREE.BufferAttribute(shape.normals, 3)
            );
        }

        // Triangle indices
        if (shape.triangles && shape.triangles.length > 0) {
            geo.setIndex(new THREE.BufferAttribute(shape.triangles, 1));
        }

        // Compute normals if not provided
        if (!shape.normals || shape.normals.length === 0) {
            geo.computeVertexNormals();
        }

        return geo;
    }, [geometry, shape?.vertices, shape?.normals, shape?.triangles]);

    // Create line geometry for edges
    const resolvedEdgeGeometry = useMemo(() => {
        // GLB path: use pre-built edge geometry
        if (edgeGeometry) return edgeGeometry;

        // JSON path: build from ShapeData edges
        if (!shape?.edges || shape.edges.length === 0) {
            return null;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute(
            'position',
            new THREE.BufferAttribute(shape.edges, 3)
        );

        return geo;
    }, [edgeGeometry, shape?.edges]);

    // Parse color
    const meshColor = useMemo(() => new THREE.Color(color), [color]);
    const lineColor = useMemo(() => new THREE.Color(edgeColor), [edgeColor]);

    if (!meshGeometry) return null;

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
            {showEdges && resolvedEdgeGeometry && (
                <lineSegments geometry={resolvedEdgeGeometry}>
                    <lineBasicMaterial
                        color={lineColor}
                        linewidth={1}
                    />
                </lineSegments>
            )}
        </group>
    );
}
