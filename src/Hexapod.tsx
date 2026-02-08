import React, { useMemo } from 'react';
import * as THREE from 'three';
import { HexapodData, HexapodPart } from './data';

interface PartProps {
    part: HexapodPart;
}

const Part: React.FC<PartProps> = ({ part }) => {
    const geometry = useMemo(() => {
        if (!part.shape) return null;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(part.shape.vertices, 3));
        geo.setIndex(new THREE.BufferAttribute(part.shape.triangles, 1));
        geo.computeVertexNormals();
        return geo;
    }, [part]);

    if (!geometry) return null;

    return (
        <group>
            <mesh geometry={geometry}>
                <meshStandardMaterial color="#ffa500" roughness={0.3} metalness={0.2} />
            </mesh>
            <lineSegments>
                <edgesGeometry args={[geometry, 15]} />
                <lineBasicMaterial color="black" linewidth={1} />
            </lineSegments>
        </group>
    );
};

export const Hexapod: React.FC<{ data: HexapodData }> = ({ data }) => {
    return (
        <group>
            {data.parts
                .filter((part) => !!part.shape)
                .map((part) => (
                    <Part key={part.id} part={part} />
                ))}
        </group>
    );
};
