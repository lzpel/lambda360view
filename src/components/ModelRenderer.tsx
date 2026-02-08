import React from 'react';
import * as THREE from 'three';
import type { ModelData, Part, Location } from '../types';
import { PartMesh } from './PartMesh';

interface ModelRendererProps {
    model: ModelData;
    edgeColor: string;
    showEdges: boolean;
}

/**
 * Renders the model hierarchy recursively
 */
export const ModelRenderer: React.FC<ModelRendererProps> = ({
    model,
    edgeColor,
    showEdges,
}) => {
    return (
        <group>
            {model.parts.map((part, index) => (
                <PartGroup
                    key={part.id || index}
                    part={part}
                    edgeColor={edgeColor}
                    showEdges={showEdges}
                />
            ))}
        </group>
    );
};

interface PartGroupProps {
    part: Part;
    edgeColor: string;
    showEdges: boolean;
}

/**
 * Renders a part and its children with proper transforms
 */
const PartGroup: React.FC<PartGroupProps> = ({ part, edgeColor, showEdges }) => {
    // Parse location data
    const position = part.loc?.[0] || [0, 0, 0];
    const quaternionArray = part.loc?.[1] || [0, 0, 0, 1];

    // Create quaternion from array [x, y, z, w]
    const quaternion = new THREE.Quaternion(
        quaternionArray[0],
        quaternionArray[1],
        quaternionArray[2],
        quaternionArray[3]
    );

    return (
        <group
            position={position}
            quaternion={quaternion}
        >
            {/* Render this part's mesh if it has shape data */}
            {part.shape && (
                <PartMesh
                    shape={part.shape}
                    color={part.color || '#808080'}
                    alpha={part.alpha ?? 1}
                    edgeColor={edgeColor}
                    showEdges={showEdges}
                />
            )}

            {/* Recursively render child parts */}
            {part.parts?.map((childPart, index) => (
                <PartGroup
                    key={childPart.id || index}
                    part={childPart}
                    edgeColor={edgeColor}
                    showEdges={showEdges}
                />
            ))}
        </group>
    );
};
