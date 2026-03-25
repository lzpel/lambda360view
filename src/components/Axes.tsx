'use client';

import React from 'react';
import { Line } from '@react-three/drei';
import { Label } from './Label';

const X_COLOR = '#ff2020';
const Y_COLOR = '#20ff20';
const Z_COLOR = '#2020ff';

const labelStyle = (color: string): React.CSSProperties => ({
    fontFamily: 'sans-serif',
    fontSize: '12px',
    fontWeight: 'bold',
    color,
});

export default function Axes(props: { maxSize: number }) {
    const length = props.maxSize * 0.5;
    const length_label = length * 1.1;
    return (
        <group>
            <Line points={[[0, 0, 0], [length, 0, 0]]} color={X_COLOR} lineWidth={1} />
            <Line points={[[0, 0, 0], [0, length, 0]]} color={Y_COLOR} lineWidth={1} />
            <Line points={[[0, 0, 0], [0, 0, length]]} color={Z_COLOR} lineWidth={1} />
            <Label position={[length_label, 0, 0]} text="X" style={labelStyle(X_COLOR)} />
            <Label position={[0, length_label, 0]} text="Y" style={labelStyle(Y_COLOR)} />
            <Label position={[0, 0, length_label]} text="Z" style={labelStyle(Z_COLOR)} />
        </group>
    );
}
