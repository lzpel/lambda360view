'use client';

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { ViewType } from './ViewMenu';

interface OrbitSizeControlsProps {
	maxSize: number;
	orthographic: boolean;
	viewRequest: { type: ViewType; ts: number } | null;
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
export function OrbitSizeControls({ maxSize, orthographic, viewRequest }: OrbitSizeControlsProps) {
	const { camera } = useThree();
	const controls = useThree(state => state.controls);
	const prevCameraRef = useRef<THREE.Camera | null>(null);

	useEffect(() => {
		if (controls) {
			const distance = maxSize * 1.5;
			const isNewCamera = camera !== prevCameraRef.current;
			prevCameraRef.current = camera;
			if (isNewCamera) {
				camera.position.set(distance, distance * 0.5, distance);
				if (orthographic) (camera as THREE.OrthographicCamera).zoom = 2;
			} else {
				const len =
					camera.position.length();
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
