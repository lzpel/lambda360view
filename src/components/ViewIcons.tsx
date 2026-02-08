import React from 'react';

interface IconProps {
    size?: number;
}

// 座標軸アイコン - シンプルなRGB線
export const AxisIcon: React.FC<IconProps> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* X軸 (赤) */}
        <line x1="12" y1="12" x2="22" y2="12" stroke="#e53935" strokeWidth="2" />
        {/* Y軸 (緑) */}
        <line x1="12" y1="12" x2="6" y2="18" stroke="#43a047" strokeWidth="2" />
        {/* Z軸 (青) */}
        <line x1="12" y1="12" x2="12" y2="2" stroke="#1e88e5" strokeWidth="2" />
    </svg>
);

// 立方体アイソメトリック（45度）
export const CubeIsoIcon: React.FC<IconProps> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 上面（青で塗りつぶし） */}
        <path d="M12 2 L22 7 L12 12 L2 7 Z" fill="#42a5f5" stroke="#333" strokeWidth="1" />
        {/* 左面 */}
        <path d="M2 7 L12 12 L12 22 L2 17 Z" fill="#e0e0e0" stroke="#333" strokeWidth="1" />
        {/* 右面 */}
        <path d="M22 7 L12 12 L12 22 L22 17 Z" fill="#bdbdbd" stroke="#333" strokeWidth="1" />
    </svg>
);

// 前面ビュー
export const CubeFrontIcon: React.FC<IconProps> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" fill="#42a5f5" stroke="#333" strokeWidth="1" />
    </svg>
);

// 背面ビュー
export const CubeBackIcon: React.FC<IconProps> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" fill="#e0e0e0" stroke="#333" strokeWidth="1" />
        <line x1="4" y1="4" x2="20" y2="20" stroke="#333" strokeWidth="1" />
        <line x1="20" y1="4" x2="4" y2="20" stroke="#333" strokeWidth="1" />
    </svg>
);

// 上面ビュー
export const CubeTopIcon: React.FC<IconProps> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 4 L20 8 L12 12 L4 8 Z" fill="#42a5f5" stroke="#333" strokeWidth="1" />
        <line x1="4" y1="8" x2="4" y2="16" stroke="#333" strokeWidth="1" />
        <line x1="20" y1="8" x2="20" y2="16" stroke="#333" strokeWidth="1" />
        <line x1="12" y1="12" x2="12" y2="20" stroke="#333" strokeWidth="1" />
        <path d="M4 16 L12 20 L20 16" fill="none" stroke="#333" strokeWidth="1" />
    </svg>
);

// 下面ビュー
export const CubeBottomIcon: React.FC<IconProps> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 4 L20 8 L12 12 L4 8 Z" fill="none" stroke="#333" strokeWidth="1" />
        <line x1="4" y1="8" x2="4" y2="16" stroke="#333" strokeWidth="1" />
        <line x1="20" y1="8" x2="20" y2="16" stroke="#333" strokeWidth="1" />
        <line x1="12" y1="12" x2="12" y2="20" stroke="#333" strokeWidth="1" />
        <path d="M4 16 L12 20 L20 16 Z" fill="#42a5f5" stroke="#333" strokeWidth="1" />
    </svg>
);

// 左面ビュー
export const CubeLeftIcon: React.FC<IconProps> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M4 6 L12 2 L12 18 L4 22 Z" fill="#42a5f5" stroke="#333" strokeWidth="1" />
        <path d="M12 2 L20 6 L20 22 L12 18 Z" fill="#e0e0e0" stroke="#333" strokeWidth="1" />
    </svg>
);

// 右面ビュー
export const CubeRightIcon: React.FC<IconProps> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M4 6 L12 2 L12 18 L4 22 Z" fill="#e0e0e0" stroke="#333" strokeWidth="1" />
        <path d="M12 2 L20 6 L20 22 L12 18 Z" fill="#42a5f5" stroke="#333" strokeWidth="1" />
    </svg>
);
