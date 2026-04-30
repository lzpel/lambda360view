'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { ViewType } from './ViewMenu';

interface OrbitSizeControlsProps {
	maxSize: number;
	orthographic: boolean;
	viewRequest: { type: ViewType; ts: number } | null;
	clipNear: number;
	clipPlane: THREE.Plane;
}

/**
 * カメラのサイズ・距離管理・ビュー切り替えとOrbitControlsを集約するコンポーネント。
 *
 * 内部でカメラとOrbitControlsをレンダリングする。OrbitControlsがmakeDefaultで
 * fiberストアにcontrolsを登録すると、useThree()のサブスクリプションが発火して
 * 親であるこのコンポーネントが再レンダーされ、effectが正しいcontrols値で再実行される。
 *
 * - 初回またはカメラ切り替え時: 初期位置をセット
 * - maxSize変化時（モデルスワップ）: カメラ方向を保ったまま距離をスケール
 * - viewRequest変化時: 指定ビューにカメラを移動
 */
export function OrbitSizeControls({ maxSize, orthographic, viewRequest, clipNear, clipPlane }: OrbitSizeControlsProps) {
	const { camera, size } = useThree();
	const controls = useThree(state => state.controls);
	const prevCameraRef = useRef<THREE.Camera | null>(null);

	useEffect(() => {
		if (controls) {
			const distance = maxSize * 1.5;
			const isNewCamera = camera !== prevCameraRef.current;
			prevCameraRef.current = camera;
			if (isNewCamera) {
				camera.position.set(distance, distance * 0.5, distance);
				// r3fのデフォルトでleft=-width/2,right=width/2,top=height/2,bottom=-height/2（ワールド単位=px）に設定される。
			// left/rightはwidth、top/bottomはheightに比例するのでアスペクト比（width/height）が自動で保たれる。
			// zoom倍率をZにすると実際に見える縦方向のワールド単位数 = height / Z になる。
			// モデル全体（maxSize）を画面に収めるには Z = height / maxSize が必要。
			// 0.75は余白を持たせるための係数（モデルが画面の75%の高さに収まる）。
			if (orthographic) (camera as THREE.OrthographicCamera).zoom = size.height / maxSize * 0.75;
			} else {
				const len = camera.position.length();
				if (len > 0) camera.position.multiplyScalar(distance / len);
			}

			camera.near = 0.1;
			camera.far = maxSize * 10;
			camera.updateProjectionMatrix();
		}
	}, [maxSize, controls, camera, orthographic]);
	// 指定した方向に向ける。これらのpropsは子に渡らないため再描画は無いはず
	useEffect(() => {
		if (viewRequest && controls) {
			const distance = maxSize * 1.5;
			const positions: Record<ViewType, [number, number, number]> = {
				iso: [distance, distance, distance],
				front: [0, 0, distance],
				back: [0, 0, -distance],
				top: [0, distance, 0],
				bottom: [0, -distance, 0],
				left: [-distance, 0, 0],
				right: [distance, 0, 0],
			};
			const pos = positions[viewRequest.type];
			camera.position.set(pos[0], pos[1], pos[2]);
			camera.lookAt(0, 0, 0);
			camera.updateProjectionMatrix();
		};

	}, [viewRequest, maxSize, controls, camera]);

	// clipNear: 0=全体表示 / 0.5=中央断面 / 1=完全クリップ。
	// カメラからターゲット方向を法線とする平面を、カメラから clipDist の位置に置く。
	// material.clippingPlanes で参照されるので、Grid/Annotation/Axes は影響を受けず model のみがクリップされる。
	// 1.5倍はバウンディングボックス対角（最大 √3/2*maxSize ≒ 0.87*maxSize）を確実にカバーするマージン。
	const tmpNormal = useMemo(() => new THREE.Vector3(), []);
	const tmpCoplanar = useMemo(() => new THREE.Vector3(), []);
	useFrame(() => {
		if (!controls) return;
		const target = (controls as unknown as { target: THREE.Vector3 }).target;
		const D = camera.position.distanceTo(target);
		const clipDist = D + (clipNear * 2 - 1) * maxSize * 1.5;

		tmpNormal.subVectors(target, camera.position).normalize();
		tmpCoplanar.copy(camera.position).addScaledVector(tmpNormal, clipDist);
		clipPlane.setFromNormalAndCoplanarPoint(tmpNormal, tmpCoplanar);
	});

	return (
		<>
			{orthographic ? (
				<OrthographicCamera makeDefault />
			) : (
				<PerspectiveCamera makeDefault fov={50} />
			)}
			<OrbitControls makeDefault target={[0, 0, 0]} enableDamping dampingFactor={0.05} />
		</>
	);
}
