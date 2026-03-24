import React, { useMemo, useState, useRef } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { Annotation, PointAnnotation, DistanceAnnotation } from '../types';
import { Label } from './Label';

const labelStyle: React.CSSProperties = {
    fontFamily: 'sans-serif',
    fontSize: '12px',
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #333',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
};

function Arrow(props: { start: number[], end: number[], both: boolean, size?: number }) {
    const arrowSize = props.size ?? 10;
    // カメラ位置をローカル空間に変換して毎フレーム追跡するで
    const { camera } = useThree();
    const groupRef = useRef<THREE.Group>(null);
    const [cameraLocalPos, setCameraLocalPos] = useState(() => camera.position.clone());
    useFrame(() => {
        if (groupRef.current) {
            const localCam = groupRef.current.worldToLocal(camera.position.clone());
            //useFrame は毎フレーム（60fps）走るから、if がないと setCameraPosが毎フレーム呼ばれてReactの再レンダリングが毎フレーム走ってしまう
            if (localCam.distanceToSquared(cameraLocalPos) > 0.01) setCameraLocalPos(localCam);
        }
    });
    //計算
    const startVec = useMemo(() => new THREE.Vector3(...props.start), [props.start]);
    const endVec = useMemo(() => new THREE.Vector3(...props.end), [props.end]);
    const center = useMemo(() => startVec.clone().add(endVec).multiplyScalar(0.5), [startVec, endVec]);
    const direction = useMemo(() => endVec.clone().sub(startVec).normalize(), [startVec, endVec]);
    const horizontal = useMemo(() => new THREE.Vector3().crossVectors(direction, center.clone().sub(cameraLocalPos)).normalize(), [direction, center, cameraLocalPos]);
    const arrow = useMemo(() => [
        endVec,
        endVec.clone().add(new THREE.Vector3((-direction.x + horizontal.x / 2) * arrowSize, (-direction.y + horizontal.y / 2) * arrowSize, (-direction.z + horizontal.z / 2) * arrowSize)),
        endVec.clone().add(new THREE.Vector3((-direction.x - horizontal.x / 2) * arrowSize, (-direction.y - horizontal.y / 2) * arrowSize, (-direction.z - horizontal.z / 2) * arrowSize)),
        endVec,
        startVec,
        startVec.clone().add(new THREE.Vector3((direction.x + horizontal.x / 2) * arrowSize, (direction.y + horizontal.y / 2) * arrowSize, (direction.z + horizontal.z / 2) * arrowSize)),
        startVec.clone().add(new THREE.Vector3((direction.x - horizontal.x / 2) * arrowSize, (direction.y - horizontal.y / 2) * arrowSize, (direction.z - horizontal.z / 2) * arrowSize)),
        startVec,
    ], [startVec, endVec, direction, horizontal, arrowSize]);
    return <group ref={groupRef}>
        {/* メインの線や */}
        <Line
            points={props.both ? arrow : arrow.slice(0,5)}
            color="black"
            lineWidth={1}
        />
    </group>
}

const PointAnnotationRenderer = (props: { annotation: PointAnnotation }) => {
    // ラベルのオフセットで引き出し線を可視化するんやで
    // 実際のCADアプリやったら、これは視点に依存するか手動で配置されるかもしれんな。
    // ここではシンプルにするために固定の垂直オフセットを使うで。
    const offsetHeight = 100;
    const endVec = useMemo(() => new THREE.Vector3(...props.annotation.position), [props.annotation.position]);
    const startVec = useMemo(() => endVec.clone().add(new THREE.Vector3(0, offsetHeight, 0)), [endVec]);
    return (
        <>
            <Arrow start={startVec.toArray() as [number, number, number]} end={endVec.toArray() as [number, number, number]} both={false} />
            <Label position={startVec.toArray() as [number, number, number]} text={props.annotation.label} style={labelStyle} />
        </>
    );
};

const DistanceAnnotationRenderer = ({ annotation }: { annotation: DistanceAnnotation }) => {
    const startVec = useMemo(() => new THREE.Vector3(...annotation.start), [annotation.start]);
    const endVec = useMemo(() => new THREE.Vector3(...annotation.end), [annotation.end]);
    const center = useMemo(() => startVec.clone().add(endVec).multiplyScalar(0.5), [startVec, endVec]);
    return (
        <>
            <Arrow start={startVec.toArray() as [number, number, number]} end={endVec.toArray() as [number, number, number]} both={true} />
            <Label position={center.toArray() as [number, number, number]} text={annotation.label} style={labelStyle} />
        </>
    );
};

export default function Annotations({ annotations }: { annotations: Annotation[] }) {
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
