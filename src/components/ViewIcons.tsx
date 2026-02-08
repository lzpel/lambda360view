import React from 'react';
const HIDDEN_DASH = '2 1.5';

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

// --------------------
// 既存: 座標軸
// --------------------
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

// --------------------
// 既存: アイソメトリック
// --------------------
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

type CubeFace = 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right';

interface CubeViewIconProps extends IconProps {
  highlightFace: CubeFace;
}

export const CubeViewIcon: React.FC<CubeViewIconProps> = ({ size = 24, highlightFace }) => {
  const frontFill = highlightFace === 'front' ? COLORS.fill : 'none';
  const backFill = highlightFace === 'back' ? COLORS.fill : 'none';
  const topFill = highlightFace === 'top' ? COLORS.fill : 'none';
  const bottomFill = highlightFace === 'bottom' ? COLORS.fill : 'none';
  const leftFill = highlightFace === 'left' ? COLORS.fill : 'none';
  const rightFill = highlightFace === 'right' ? COLORS.fill : 'none';

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* ========= 最背面: 隠線3本（必ず青面より後ろ） ========= */}
      <g
        stroke={COLORS.stroke}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={HIDDEN_DASH}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      >
        {/* 背面の左縦 */}
        <line x1="7" y1="2" x2="7" y2="16" />
        {/* 背面の下横 */}
        <line x1="7" y1="16" x2="21" y2="16" />
        {/* 背面の右縦 */}
        <line x1="21" y1="2" x2="21" y2="16" />
      </g>

      {/* ========= 面（青塗り対象含む） ========= */}
      {/* 背面 */}
      <path
        d="M7 2 L21 2 L21 16 L7 16 Z"
        fill={backFill}
        stroke={COLORS.stroke}
        strokeWidth={STROKE_WIDTH}
      />

      {/* 上面 */}
      <path
        d="M3 6 L7 2 L21 2 L17 6 Z"
        fill={topFill}
        stroke={COLORS.stroke}
        strokeWidth={STROKE_WIDTH}
      />

      {/* 下面 */}
      <path
        d="M3 20 L17 20 L21 16 L7 16 Z"
        fill={bottomFill}
        stroke={COLORS.stroke}
        strokeWidth={STROKE_WIDTH}
      />

      {/* 左面 */}
      <path
        d="M3 6 L7 2 L7 16 L3 20 Z"
        fill={leftFill}
        stroke={COLORS.stroke}
        strokeWidth={STROKE_WIDTH}
      />

      {/* 右面 */}
      <path
        d="M17 6 L21 2 L21 16 L17 20 Z"
        fill={rightFill}
        stroke={COLORS.stroke}
        strokeWidth={STROKE_WIDTH}
      />

      {/* 前面 */}
      <rect
        x="3"
        y="6"
        width="14"
        height="14"
        fill={frontFill}
        stroke={COLORS.stroke}
        strokeWidth={STROKE_WIDTH}
      />

      {/* ========= 前面エッジ（実線） ========= */}
      <g stroke={COLORS.stroke} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="7" y2="2" />
        <line x1="17" y1="6" x2="21" y2="2" />
        <line x1="3" y1="20" x2="7" y2="16" />
        <line x1="17" y1="20" x2="21" y2="16" />
      </g>
    </svg>
  );
};

// 互換エクスポート
export const CubeFrontIcon: React.FC<IconProps> = (props) => <CubeViewIcon {...props} highlightFace="front" />;
export const CubeBackIcon: React.FC<IconProps> = (props) => <CubeViewIcon {...props} highlightFace="back" />;
export const CubeTopIcon: React.FC<IconProps> = (props) => <CubeViewIcon {...props} highlightFace="top" />;
export const CubeBottomIcon: React.FC<IconProps> = (props) => <CubeViewIcon {...props} highlightFace="bottom" />;
export const CubeLeftIcon: React.FC<IconProps> = (props) => <CubeViewIcon {...props} highlightFace="left" />;
export const CubeRightIcon: React.FC<IconProps> = (props) => <CubeViewIcon {...props} highlightFace="right" />;
