import React from 'react';

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
export interface Lambda360ViewProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
    /** GLB binary data (ArrayBuffer) to load directly, or null for empty state */
    model: ArrayBuffer | null;
    /** Arbitrary React node to display in the center (e.g. loading spinner, error message) */
    center?: React.ReactNode;
    /** Background color (default: #1a1a2e) */
    backgroundColor?: string;
    /** Edge color (default: #000000) */
    edgeColor?: string;
    /** Whether to show edges (default: true) */
    showEdges?: boolean;

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
