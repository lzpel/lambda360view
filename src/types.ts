/**
 * Type definitions for hexapod.js format 3D model data
 */

import type { BufferGeometry } from 'three';

/** Shape data containing geometry information */
export interface ShapeData {
    vertices: Float32Array;
    normals: Float32Array;
    triangles: Uint32Array;
    edges: Float32Array;
    obj_vertices?: Float32Array;
    face_types?: Uint32Array;
    edge_types?: Uint32Array;
    triangles_per_face?: Uint32Array;
    segments_per_edge?: Uint32Array;
}

/** Location data: [position, quaternion] */
export type Location = [
    [number, number, number],
    [number, number, number, number]
];

/** Individual part in the model hierarchy */
export interface Part {
    id: string;
    name: string;
    type: string;
    subtype?: string;
    shape?: ShapeData;
    geometry?: BufferGeometry;
    edgeGeometry?: BufferGeometry;
    color?: string;
    alpha?: number;
    loc?: Location;
    scale?: [number, number, number];
    parts?: Part[];
    state?: number[];
    texture?: string | null;
    renderback?: boolean;
    accuracy?: number | null;
    bb?: BoundingBox | null;
    extras?: Record<string, unknown>;
}

/** Bounding box dimensions */
export interface BoundingBox {
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
    zmin: number;
    zmax: number;
}

/** Root model data structure */
export interface ModelData {
    version: number;
    parts: Part[];
    name: string;
    id: string;
    loc?: Location;
    normal_len?: number;
    bb: BoundingBox;
}

/** Annotation attached to a single point */
export interface PointAnnotation {
    type: 'point';
    position: [number, number, number];
    label: string;
}

/** Annotation indicating distance between two points */
export interface DistanceAnnotation {
    type: 'distance';
    start: [number, number, number];
    end: [number, number, number];
    label: string;
}

export type Annotation = PointAnnotation | DistanceAnnotation;

/** Props for Lambda360View component */
export interface Lambda360ViewProps {
    /** Model data to display (JSON format) */
    model?: ModelData;
    /** GLB file URL to load */
    glbUrl?: string;
    /** GLB binary data (ArrayBuffer) to load directly */
    glbData?: ArrayBuffer;
    /** Background color (default: #1a1a2e) */
    backgroundColor?: string;
    /** Edge color (default: #000000) */
    edgeColor?: string;
    /** Whether to show edges (default: true) */
    showEdges?: boolean;
    /** Canvas width (default: 100%) */
    width?: string | number;
    /** Canvas height (default: 100%) */
    height?: string | number;
    /** Additional className for container */
    className?: string;
    /** Additional style for container */
    style?: React.CSSProperties;
    /** Up axis direction: 'Y' (default), 'Z', or '-Y', '-Z' */
    upAxis?: 'Y' | 'Z' | '-Y' | '-Z';
    /** Use orthographic camera instead of perspective (default: false) */
    orthographic?: boolean;
    /** Show view control menu bar (default: false) */
    showViewMenu?: boolean;
    /** Footer content to display at the bottom of the viewer */
    footer?: React.ReactNode;
    /** Annotations to display */
    annotations?: Annotation[];
}

