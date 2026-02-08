import React from 'react';

interface IconProps {
    size?: number;
}

// 共通カラー定数
const COLORS = {
    stroke: '#333',
    fill: '#42a5f5',
    axisX: '#e53935',
    axisY: '#43a047',
    axisZ: '#1e88e5',
} as const;

const STROKE_WIDTH = 0.8;

// 座標軸アイコン - シンプルなRGB線
export const AxisIcon: React.FC<IconProps> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* X軸 (赤) */}
        <line x1="12" y1="12" x2="22" y2="12" stroke={COLORS.axisX} strokeWidth="2" />
        {/* Y軸 (緑) */}
        <line x1="12" y1="12" x2="6" y2="18" stroke={COLORS.axisY} strokeWidth="2" />
        {/* Z軸 (青) */}
        <line x1="12" y1="12" x2="12" y2="2" stroke={COLORS.axisZ} strokeWidth="2" />
    </svg>
);

// 立方体アイソメトリック（45度）- 線のみ + 中央に青い円
export const CubeIsoIcon: React.FC<IconProps> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 立方体のアウトライン */}
        {/* 上面 */}
        <path d="M12 2 L22 7 L12 12 L2 7 Z" fill="none" stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
        {/* 左面 */}
        <path d="M2 7 L12 12 L12 22 L2 17 Z" fill="none" stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
        {/* 右面 */}
        <path d="M22 7 L12 12 L12 22 L22 17 Z" fill="none" stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
        {/* 中央の青い円 */}
        <circle cx="12" cy="12" r="6" fill={COLORS.fill} />
    </svg>
);

// 前面ビュー - 3Dパースペクティブで前面を青く強調
export const CubeFrontIcon: React.FC<IconProps> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 前面（青で塗りつぶし） */}
        <rect x="3" y="6" width="14" height="14" fill={COLORS.fill} stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
        {/* 上面（線のみ） */}
        <path d="M3 6 L7 2 L21 2 L17 6" fill="none" stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
        {/* 右面（線のみ） */}
        <path d="M17 6 L21 2 L21 16 L17 20" fill="none" stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
    </svg>
);

// 背面ビュー - 3Dパースペクティブで背面を青く強調
export const CubeBackIcon: React.FC<IconProps> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 前面のワイヤーフレーム */}
        <rect x="3" y="6" width="14" height="14" fill="none" stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
        {/* 背面（青で塗りつぶし） */}
        <path d="M7 2 L21 2 L21 16 L17 20 L17 6 L7 6 Z" fill={COLORS.fill} stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
        {/* 接続線 */}
        <line x1="3" y1="6" x2="7" y2="2" stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
    </svg>
);

// 上面ビュー - 3Dパースペクティブで上面を青く強調
export const CubeTopIcon: React.FC<IconProps> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 上面（青で塗りつぶし） */}
        <path d="M3 6 L7 2 L21 2 L17 6 Z" fill={COLORS.fill} stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
        {/* 前面（線のみ） */}
        <rect x="3" y="6" width="14" height="14" fill="none" stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
        {/* 右面（線のみ） */}
        <path d="M17 6 L21 2 L21 16 L17 20" fill="none" stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
    </svg>
);

// 下面ビュー - 3Dパースペクティブで下面を青く強調
export const CubeBottomIcon: React.FC<IconProps> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 上面（線のみ） */}
        <path d="M3 6 L7 2 L21 2 L17 6 Z" fill="none" stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
        {/* 前面（線のみ） */}
        <rect x="3" y="6" width="14" height="14" fill="none" stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
        {/* 右面（線のみ） */}
        <path d="M17 6 L21 2 L21 16 L17 20" fill="none" stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
        {/* 下面（青で塗りつぶし） */}
        <path d="M3 20 L17 20 L21 16 L7 16 Z" fill={COLORS.fill} stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
    </svg>
);

// 左面ビュー - 3Dパースペクティブで左面を青く強調
export const CubeLeftIcon: React.FC<IconProps> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 左面（青で塗りつぶし） */}
        <rect x="3" y="6" width="14" height="14" fill={COLORS.fill} stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
        {/* 上面（線のみ） */}
        <path d="M3 6 L7 2 L21 2 L17 6" fill="none" stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
        {/* 右面（線のみ） */}
        <path d="M17 6 L21 2 L21 16 L17 20" fill="none" stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
    </svg>
);

// 右面ビュー - 3Dパースペクティブで右面を青く強調
export const CubeRightIcon: React.FC<IconProps> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 前面（線のみ） */}
        <rect x="3" y="6" width="14" height="14" fill="none" stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
        {/* 上面（線のみ） */}
        <path d="M3 6 L7 2 L21 2 L17 6" fill="none" stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
        {/* 右面（青で塗りつぶし） */}
        <path d="M17 6 L21 2 L21 16 L17 20 Z" fill={COLORS.fill} stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} />
    </svg>
);
