/**
 * Type definitions for hexapod.js format 3D model data
 */

/** Shape data containing geometry information */
export interface ShapeData {
    /** 頂点座標 (BufferGeometry の position 属性に使用) */
    vertices: Float32Array;
    /** 法線ベクトル (ライティング計算に使用。未指定時は自動計算) */
    normals: Float32Array;
    /** 三角形インデックス (BufferGeometry の index に使用) */
    triangles: Uint32Array;
    /** エッジ頂点座標 (LineSegments の描画に使用) */
    edges: Float32Array;
}

/** Location data: [position, quaternion] */
export type Location = [
    [number, number, number],
    [number, number, number, number]
];

/** Individual part in the model hierarchy */
export interface Part {
    /** パーツの一意識別子 (React の key として使用) */
    id: string;
    /** シェイプデータ (メッシュ・エッジの描画に使用) */
    shape?: ShapeData;
    /** 面の色 (デフォルト: #808080) */
    color?: string;
    /** 透明度 (0-1、デフォルト: 1) */
    alpha?: number;
    /** 位置・回転 [position, quaternion] */
    loc?: Location;
    /** 子パーツの配列 (階層構造) */
    parts?: Part[];
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
    /** パーツ配列 (ModelRenderer で描画対象として走査) */
    parts: Part[];
    /** バウンディングボックス (カメラ位置の自動計算に使用) */
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
    /** Model data to display */
    model: ModelData;
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

