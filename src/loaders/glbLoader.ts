import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ModelData, Part, BoundingBox, Location } from '../types';

/**
 * Load a GLB file from a URL and convert it to ModelData format.
 */
export async function loadGlb(url: string): Promise<ModelData> {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    return gltfToModelData(gltf);
}

/**
 * Load a GLB file from an ArrayBuffer and convert it to ModelData format.
 */
export async function loadGlbFromBuffer(buffer: ArrayBuffer): Promise<ModelData> {
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
        loader.parse(
            buffer,
            '',
            (gltf) => resolve(gltfToModelData(gltf)),
            (error) => reject(error),
        );
    });
}

/**
 * Convert a parsed GLTF result to ModelData.
 */
function gltfToModelData(gltf: GLTF): ModelData {
    const scene = gltf.scene;

    // Extract parts from the scene hierarchy
    const parts = convertChildren(scene);

    // Compute bounding box from the entire scene
    const box = new THREE.Box3().setFromObject(scene);
    const bb = boxToBoundingBox(box);

    // Try to get metadata from scene-level extras
    const sceneExtras = (scene.userData ?? {}) as Record<string, unknown>;

    return {
        version: 2,
        parts,
        name: (sceneExtras.name as string) ?? scene.name ?? 'glb_model',
        id: (sceneExtras.id as string) ?? scene.uuid,
        bb,
    };
}

/**
 * Recursively convert THREE.Object3D children into Part[].
 */
function convertChildren(parent: THREE.Object3D): Part[] {
    const parts: Part[] = [];

    for (const child of parent.children) {
        const part = convertObject3D(child);
        if (part) {
            parts.push(part);
        }
    }

    return parts;
}

/**
 * Convert a single THREE.Object3D (and its descendants) into a Part.
 */
function convertObject3D(obj: THREE.Object3D): Part | null {
    const extras = (obj.userData ?? {}) as Record<string, unknown>;

    // Extract location
    const loc: Location = [
        [obj.position.x, obj.position.y, obj.position.z],
        [obj.quaternion.x, obj.quaternion.y, obj.quaternion.z, obj.quaternion.w],
    ];

    // Find geometry from this object (if it's a Mesh)
    let geometry: THREE.BufferGeometry | undefined;
    let edgeGeometry: THREE.BufferGeometry | undefined;

    if (obj instanceof THREE.Mesh && obj.geometry) {
        geometry = obj.geometry;

        // Restore edge data from extras if available
        edgeGeometry = restoreEdgeGeometry(extras);
    }

    // Recurse into children
    const childParts = convertChildren(obj);

    // Skip empty nodes that have no geometry and no children
    if (!geometry && childParts.length === 0) {
        // But still include if it has meaningful extras
        if (Object.keys(extras).length === 0) {
            return null;
        }
    }

    // Extract scale (only store if non-default)
    const s = obj.scale;
    const hasNonDefaultScale = s.x !== 1 || s.y !== 1 || s.z !== 1;

    const part: Part = {
        id: (extras.id as string) ?? obj.uuid,
        name: (extras.name as string) ?? obj.name ?? '',
        type: (extras.type as string) ?? 'solid',
        color: extractColor(obj, extras),
        alpha: extractAlpha(obj, extras),
        loc,
        ...(hasNonDefaultScale && { scale: [s.x, s.y, s.z] as [number, number, number] }),
        extras,
    };

    if (extras.subtype) {
        part.subtype = extras.subtype as string;
    }

    if (geometry) {
        part.geometry = geometry;
    }

    if (edgeGeometry) {
        part.edgeGeometry = edgeGeometry;
    }

    if (childParts.length > 0) {
        part.parts = childParts;
    }

    return part;
}

/**
 * Restore edge geometry from extras (Base64-encoded Float32Array).
 */
function restoreEdgeGeometry(extras: Record<string, unknown>): THREE.BufferGeometry | undefined {
    const edgesData = extras.edges;
    if (!edgesData) return undefined;

    let edgePositions: Float32Array | undefined;

    if (typeof edgesData === 'string') {
        // Base64-encoded Float32Array
        const binary = atob(edgesData);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        edgePositions = new Float32Array(bytes.buffer);
    } else if (Array.isArray(edgesData)) {
        // Plain array of numbers
        edgePositions = new Float32Array(edgesData as number[]);
    }

    if (!edgePositions || edgePositions.length === 0) return undefined;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
    return geometry;
}

/**
 * Extract color from extras or material.
 */
function extractColor(obj: THREE.Object3D, extras: Record<string, unknown>): string {
    // Prefer extras
    if (typeof extras.color === 'string') {
        return extras.color;
    }

    // Fall back to material color
    if (obj instanceof THREE.Mesh && obj.material) {
        const mat = obj.material as THREE.MeshStandardMaterial;
        if (mat.color) {
            return '#' + mat.color.getHexString();
        }
    }

    return '#808080';
}

/**
 * Extract alpha from extras or material.
 */
function extractAlpha(obj: THREE.Object3D, extras: Record<string, unknown>): number {
    if (typeof extras.alpha === 'number') {
        return extras.alpha;
    }

    if (obj instanceof THREE.Mesh && obj.material) {
        const mat = obj.material as THREE.MeshStandardMaterial;
        return mat.opacity ?? 1;
    }

    return 1;
}

/**
 * Convert THREE.Box3 to BoundingBox interface.
 */
function boxToBoundingBox(box: THREE.Box3): BoundingBox {
    if (box.isEmpty()) {
        return { xmin: -1, xmax: 1, ymin: -1, ymax: 1, zmin: -1, zmax: 1 };
    }
    return {
        xmin: box.min.x,
        xmax: box.max.x,
        ymin: box.min.y,
        ymax: box.max.y,
        zmin: box.min.z,
        zmax: box.max.z,
    };
}
