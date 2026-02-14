/**
 * Type definitions for hexapod.js format 3D model data
 */

import type { BufferGeometry } from 'three';

/** Shape data containing geometry information */
export interface ShapeData {
    /** メッシュ頂点座標。フラット配列 [x1,y1,z1, x2,y2,z2, ...] */
    vertices: Float32Array;
    /** 頂点法線ベクトル。フラット配列 [nx1,ny1,nz1, ...] 空の場合はcomputeVertexNormalsで自動計算 */
    normals: Float32Array;
    /** 三角形インデックス。3つ組で1三角形 [i1,i2,i3, i4,i5,i6, ...] verticesへの参照 */
    triangles: Uint32Array;
    /** エッジ線分の頂点座標。2頂点で1線分 [x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4, ...] */
    edges: Float32Array;
}

/** Location data: [position, quaternion] */
export type Location = [
    [number, number, number],
    [number, number, number, number]
];

/** Individual part in the model hierarchy */
export interface Part {
    /** パーツの一意識別子 */
    id: string;
    /** パーツ名 */
    name: string;
    /** パーツ種別 (例: "solid") */
    type: string;
    /** パーツ副種別 */
    subtype?: string;
    /** メッシュ形状データ (JSON渡し時に使用) */
    shape?: ShapeData;
    /** パース済みBufferGeometry (GLB渡し時に使用) */
    geometry?: BufferGeometry;
    /** パース済みエッジBufferGeometry (GLB渡し時に使用) */
    edgeGeometry?: BufferGeometry;
    /** 表示色 (CSS hex文字列 例: "#808080") */
    color?: string;
    /** 不透明度 0.0〜1.0 (デフォルト: 1) */
    alpha?: number;
    /** ローカル座標変換 [position, quaternion] */
    loc?: Location;
    /** ローカルスケール [sx, sy, sz] (デフォルト: [1,1,1]) */
    scale?: [number, number, number];
    /** 子パーツ (再帰的な木構造) */
    parts?: Part[];
    /** パーツ単位のバウンディングボックス */
    bb?: BoundingBox | null;
    /** GLBのextras等から取得した任意メタデータ */
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

