/**
 * Type definitions for lambda360view GLB-based 3D viewer
 */

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
    /** GLB binary data (ArrayBuffer) to load directly */
    model: ArrayBuffer;
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
    /** Preserve camera position/zoom/OrbitControls state when model changes (default: true) */
    preserveCamera?: boolean;
}
