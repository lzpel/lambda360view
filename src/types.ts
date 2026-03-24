import React from 'react';

/**
 * Type definitions for lambda360view GLB-based 3D viewer
 */

/** Axis identifier */
export type Axis = 'X' | 'Y' | 'Z';

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
	unit?: string;
}

export type Annotation = PointAnnotation | DistanceAnnotation;

/** Props for Lambda360View component */
export interface Lambda360ViewProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
	/** GLB binary data (ArrayBuffer) to load directly, or null for empty state */
	model: ArrayBuffer | null;
	/** React node to display in the center (e.g. loading spinner, error message) */
	nodeCenter?: React.ReactNode;
	/** Footer content to display at the bottom of the viewer */
	nodeFooter?: React.ReactNode;
	/** Background color (default: #1a1a2e) */
	backgroundColor?: string;
	/** Edge color (default: #000000) */
	edgeColor?: string;
	/** Whether to show edges (default: true) */
	showEdges?: boolean;

	/** Up axis of the model coordinate system (default: 'Y') */
	axisUp?: Axis;
	/** Align model so that the bounding box minimum on this axis is at 0 */
	axisGround?: Axis;
	/** Center the model on these axes */
	axisCenter?: Axis[];

	/** Use orthographic camera instead of perspective (default: false) */
	orthographic?: boolean;
	/** Show view control menu bar (default: false) */
	showViewMenu?: boolean;
	/** Callback to download STEP file; if provided, a download button appears in the view menu */
	onDownloadStep?: () => void;
	/** Annotations to display */
	annotations?: Annotation[];
}
