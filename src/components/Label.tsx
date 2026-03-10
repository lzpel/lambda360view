'use client';

import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * react-dom/client を使わずに3D座標にDOMラベルを配置する軽量コンポーネント。
 * drei の Html が ReactDOM.createRoot を必要とする問題を回避するために自前で実装。
 */
export const Label = ({ position, text, style }: {
    position: [number, number, number] | THREE.Vector3;
    text: string;
    style?: React.CSSProperties;
}) => {
    const elRef = useRef<HTMLDivElement | null>(null);
    const groupRef = useRef<THREE.Group>(null);
    const { camera, size, gl } = useThree();
    const vec = useRef(new THREE.Vector3());

    useEffect(() => {
        const el = document.createElement('div');
        el.textContent = text;
        Object.assign(el.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            pointerEvents: 'none',
            willChange: 'transform',
            ...style,
        });
        gl.domElement.parentElement!.appendChild(el);
        elRef.current = el;
        return () => { el.remove(); };
    }, [text, gl, style]);

    useFrame(() => {
        if (!elRef.current || !groupRef.current) return;
        // シーングラフ上のワールド座標を取得（親groupのrotation等が反映される）
        groupRef.current.getWorldPosition(vec.current);
        vec.current.project(camera);
        const x = (vec.current.x * 0.5 + 0.5) * size.width;
        const y = (-vec.current.y * 0.5 + 0.5) * size.height;
        elRef.current.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px)`;
    });

    // シーングラフに参加させて親の変換を継承する
    return <group ref={groupRef} position={position} />;
};
