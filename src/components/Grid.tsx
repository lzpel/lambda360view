'use client';

import React from 'react';
import { Label } from './Label';

/** バウンディングボックスの最大辺からグリッド設定を計算する（private） */
function calcGrid(maxSize: number, maxDivisions = 20): { gridStep: number; gridDivisions: number; gridSize: number } {
    const rawStep = maxSize / maxDivisions;
    const exp = Math.floor(Math.log10(rawStep));
    const n = rawStep / Math.pow(10, exp);
    const niceFactor = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    const gridStep = niceFactor * Math.pow(10, exp);
    const rawDivisions = Math.ceil(maxSize / gridStep);
    // 偶数にする（中心線に対して左右対称になるよう）
    const gridDivisions = rawDivisions % 2 === 0 ? rawDivisions : rawDivisions + 1;
    const gridSize = gridDivisions * gridStep;
    return { gridStep, gridDivisions, gridSize };
}

const rulerLabelStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: '#aaa',
    pointerEvents: 'none',
    userSelect: 'none',
};

/**
 * グリッド平面のローカル座標 X・Z 軸上に目盛ラベルを描画する。
 * 親の rotation に従ってワールド座標へ変換される。
 */
function GridRuler({ gridSize, gridStep }: { gridSize: number; gridStep: number }) {
    const half = gridSize / 2;
    const count = Math.round(half / gridStep);
    const ticks: React.ReactNode[] = [];

    for (let i = 1; i <= count; i++) {
        const d = i * gridStep;
        const text = String(Math.round(d));
        // ローカル X 軸（正・負）
        ticks.push(<Label key={`x+${i}`} position={[d, 0, 0]} text={text} style={rulerLabelStyle} />);
        ticks.push(<Label key={`x-${i}`} position={[-d, 0, 0]} text={text} style={rulerLabelStyle} />);
    }

    return <>{ticks}</>;
}

/** XZ / XY / YZ の3平面グリッドと目盛ラベルを表示するコンポーネント */
export function Grid({ maxSize, maxDivisions }: { maxSize: number; maxDivisions?: number }) {
    const { gridSize, gridDivisions, gridStep } = calcGrid(maxSize, maxDivisions);
    return (
        <>
            {/* ZX 平面（デフォルト） */}
            <group>
                <gridHelper args={[gridSize, gridDivisions]} />
                <GridRuler gridSize={gridSize} gridStep={gridStep} />
            </group>
            {/* XY 平面 */}
            <group rotation={[Math.PI / 2, Math.PI / 2, 0]}>
                <gridHelper args={[gridSize, gridDivisions]} />
                <GridRuler gridSize={gridSize} gridStep={gridStep} />
            </group>
            {/* YZ 平面 */}
            <group rotation={[Math.PI / 2, Math.PI / 2, Math.PI / 2]}>
                <gridHelper args={[gridSize, gridDivisions]} />
                <GridRuler gridSize={gridSize} gridStep={gridStep} />
            </group>
        </>
    );
}
