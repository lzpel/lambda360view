import React, { useEffect, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { Annotation, PointAnnotation, DistanceAnnotation } from '../types';

/**
 * react-dom/client を使わずに3D座標にDOMラベルを配置する軽量コンポーネント。
 * drei の Html が ReactDOM.createRoot を必要とする問題を回避するために自前で実装。
 */
const Label = ({ position, text, style }: {
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

const labelStylePoint: React.CSSProperties = {
    fontFamily: 'sans-serif',
    fontSize: '12px',
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #333',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
};

const labelStyleDistance: React.CSSProperties = {
    fontFamily: 'sans-serif',
    fontSize: '12px',
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #333',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
};

const PointAnnotationRenderer = ({ annotation }: { annotation: PointAnnotation }) => {
    const { position, label } = annotation;

    // ラベルのオフセットで引き出し線を可視化するんやで
    // 実際のCADアプリやったら、これは視点に依存するか手動で配置されるかもしれんな。
    // ここではシンプルにするために固定の垂直オフセットを使うで。
    const offsetHeight = 50;
    const endPosition: [number, number, number] = [position[0], position[1] + offsetHeight, position[2]];

    return (
        <group>
            {/* ポイントのマーカーや */}
            <mesh position={position}>
                <sphereGeometry args={[2]} />
                <meshBasicMaterial color="#ff0000" />
            </mesh>

            {/* 引き出し線やで */}
            <Line
                points={[position, endPosition]}
                color="black"
                lineWidth={1}
            />

            <Label position={endPosition} text={label} style={labelStylePoint} />
        </group>
    );
};

const DistanceAnnotationRenderer = ({ annotation }: { annotation: DistanceAnnotation }) => {
    const { start, end, label } = annotation;
    const startVec = useMemo(() => new THREE.Vector3(...start), [start]);
    const endVec = useMemo(() => new THREE.Vector3(...end), [end]);
    const midPoint = useMemo(() => startVec.clone().add(endVec).multiplyScalar(0.5), [startVec, endVec]);
    const direction = useMemo(() => endVec.clone().sub(startVec).normalize(), [startVec, endVec]);
    const length = useMemo(() => startVec.distanceTo(endVec), [startVec, endVec]);

    // 矢印の回転を計算するで
    const quaternion = useMemo(() => {
        const dummy = new THREE.Object3D();
        // デフォルトのlookAtは+zやで
        // コーンジオメトリのデフォルトの向きは上(+y)か？いや、たぶん+yやな。
        // コーンを線に沿わせる必要があるんや。
        // LookAtが賢くやってくれるのを信じよか。
        return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    }, [direction]);

    return (
        <group>
            {/* メインの線や */}
            <Line
                points={[start, end]}
                color="black"
                lineWidth={1}
            />

            {/* 端点のマーカー（垂直な短い線）や */}
            {/* 線に対して垂直な短い線を引くのは、基準となる上方向ベクトルがないと難しいんや。
                とりあえず今は短い線はスキップして、矢印かドットを使うことにするで。
                端点に小さな球を置くことにしよか。
            */}
            <mesh position={start}>
                <sphereGeometry args={[1]} />
                <meshBasicMaterial color="black" />
            </mesh>
            <mesh position={end}>
                <sphereGeometry args={[1]} />
                <meshBasicMaterial color="black" />
            </mesh>

            <Label position={midPoint.toArray() as [number, number, number]} text={label} style={labelStyleDistance} />
        </group>
    );
};

export const Annotations = ({ annotations }: { annotations: Annotation[] }) => {
    return (
        <group>
            {annotations.map((ann, i) => {
                if (ann.type === 'point') {
                    return <PointAnnotationRenderer key={i} annotation={ann} />;
                }
                if (ann.type === 'distance') {
                    return <DistanceAnnotationRenderer key={i} annotation={ann} />;
                }
                return null;
            })}
        </group>
    );
};
