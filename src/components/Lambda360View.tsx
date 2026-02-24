'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Lambda360ViewProps, Annotation } from '../types';
import { Annotations } from './Annotations';
import { ViewMenu, ViewType } from './ViewMenu';

/**
 * モデルの上方向軸からThree.jsのY-upに変換する回転を取得するで
 */
function getUpAxisRotation(upAxis: 'Y' | 'Z' | '-Y' | '-Z'): THREE.Euler {
	switch (upAxis) {
		case 'Y':
			return new THREE.Euler(0, 0, 0);
		case '-Y':
			return new THREE.Euler(Math.PI, 0, 0);
		case 'Z':
			return new THREE.Euler(-Math.PI / 2, 0, 0);
		case '-Z':
			return new THREE.Euler(Math.PI / 2, 0, 0);
		default:
			return new THREE.Euler(0, 0, 0);
	}
}

function disposeScene(scene: THREE.Group) {
	scene.traverse((child: any) => {
		if (child.geometry) {
			child.geometry.dispose();
		}

		if (child.material) {
			if (Array.isArray(child.material)) {
				child.material.forEach((m: THREE.Material) => m.dispose());
			} else {
				child.material.dispose();
			}
		}
	});
}

/**
 * エッジのオーバーレイと一緒にロードされたGLBシーンをレンダリングするコンポーネントや。
 * Canvasコンテキストの中で動くで。
 */
function GlbScene({
	scene,
	edgeColor,
	showEdges,
	edgePositions,
}: {
	scene: THREE.Group;
	edgeColor: string;
	showEdges: boolean;
	edgePositions: Float32Array | null;
}) {
	const edgeLineRef = useRef<THREE.LineSegments | null>(null);

	// 孤立したアクセサーデータからエッジのLineSegmentsを作るで
	useEffect(() => {
		if (!edgePositions) return;
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			'position',
			new THREE.BufferAttribute(edgePositions, 3)
		);
		const material = new THREE.LineBasicMaterial({
			color: edgeColor,
			linewidth: 1,
		});
		const lineSegments = new THREE.LineSegments(geometry, material);
		lineSegments.userData._isEdge = true;
		scene.add(lineSegments);
		edgeLineRef.current = lineSegments;

		return () => {
			scene.remove(lineSegments);
			geometry.dispose();
			material.dispose();
			edgeLineRef.current = null;
		};
	}, [scene, edgePositions]);

	// エッジの色を更新するで
	useEffect(() => {
		if (edgeLineRef.current) {
			(edgeLineRef.current.material as THREE.LineBasicMaterial).color.set(edgeColor);
		}
	}, [edgeColor]);

	// エッジの表示・非表示を切り替えるで
	useEffect(() => {
		if (edgeLineRef.current) {
			edgeLineRef.current.visible = showEdges;
		}
	}, [showEdges]);

	// エッジがちゃんと描画されるように、全てのメッシュのマテリアルにpolygonOffsetを適用するで
	useEffect(() => {
		scene.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				const mat = child.material as THREE.Material;
				mat.polygonOffset = true;
				mat.polygonOffsetFactor = 1;
				mat.polygonOffsetUnits = 1;
			}
		});
	}, [scene]);

	return <primitive object={scene} />;
}

// ------ 新しい SceneManager の実装 ------
interface SceneManagerProps {
	model: ArrayBuffer;
	preserveCamera: boolean;
	edgeColor: string;
	showEdges: boolean;
	upAxisRotation: THREE.Euler;
	annotations?: Annotation[];
	showAxis: boolean;
	viewRequest: { type: ViewType; ts: number } | null;
	orthographic: boolean;
	onLoading: (loading: boolean) => void;
}

function SceneManager({
	model,
	preserveCamera,
	edgeColor,
	showEdges,
	upAxisRotation,
	annotations,
	showAxis,
	viewRequest,
	orthographic,
	onLoading
}: SceneManagerProps) {
	const { camera, controls } = useThree();

	const [displayScene, setDisplayScene] = useState<THREE.Group | null>(null);
	const [displayEdgePositions, setDisplayEdgePositions] = useState<Float32Array | null>(null);

	const prevSceneRef = useRef<THREE.Group | null>(null);

	// モデル読み込みとシームレス切り替え
	useEffect(() => {
		let cancelled = false;
		const loader = new GLTFLoader();

		// 前回のシーンが存在していて、preserveCamera が true ならカメラ状態を記憶
		const hasPrevScene = prevSceneRef.current !== null;
		const savedCameraState = hasPrevScene && preserveCamera
			? {
				position: camera.position.clone(),
				zoom: (camera as any).zoom ?? 1,
				target: (controls as any)?.target?.clone() ?? new THREE.Vector3(0, 0, 0),
			}
			: null;

		// 最初の読み込み時だけローディングを出す
		if (!hasPrevScene) onLoading(true);

		loader.parse(
			model,
			'',
			(gltf) => {
				if (cancelled) return;

				const newScene = gltf.scene;
				const edgeAccessorIndex = gltf.userData?.edgeAccessor;

				const finalize = (edges: Float32Array | null) => {
					if (cancelled) return;

					// 前のシーンのリソースをお片付けするで
					if (prevSceneRef.current) {
						disposeScene(prevSceneRef.current);
					}

					prevSceneRef.current = newScene;
					setDisplayScene(newScene);
					setDisplayEdgePositions(edges);

					// スワップした後にカメラの状態を元に戻すで
					if (savedCameraState) {
						// 完全にレンダリングされてからカメラを復元する
						requestAnimationFrame(() => {
							if (!cancelled) {
								camera.position.copy(savedCameraState.position);
								(camera as any).zoom = savedCameraState.zoom;
								camera.updateProjectionMatrix();
								const orbitControls = controls as any;
								if (orbitControls?.target) {
									orbitControls.target.copy(savedCameraState.target);
									orbitControls.update?.();
								}
							}
						});
					}

					if (!hasPrevScene) onLoading(false);
				};

				if (edgeAccessorIndex !== undefined) {
					gltf.parser.getDependency('accessor', edgeAccessorIndex).then((attr: THREE.BufferAttribute) => {
						finalize(attr.array as Float32Array);
					});
				} else {
					finalize(null);
				}
			},
			(error) => {
				console.error('GLB parse error:', error);
				if (!hasPrevScene) onLoading(false);
			}
		);

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [model]); // モデル本体が変わった時だけ発火させる

	// アンマウント時のお片付けや
	useEffect(() => {
		return () => {
			if (prevSceneRef.current) {
				disposeScene(prevSceneRef.current);
				prevSceneRef.current = null;
			}
		};
	}, []);

	// シーンのバウンディングボックスからカメラ設定と距離を計算するで
	const cameraConfig = useMemo(() => {
		if (!displayScene) return null;
		const box = new THREE.Box3().setFromObject(displayScene);
		const size = box.getSize(new THREE.Vector3());
		const maxSize = Math.max(size.x, size.y, size.z);
		const distance = maxSize * 1.5;

		return {
			position: [distance, distance * 0.5, distance] as [number, number, number],
			far: maxSize * 10,
			near: 0.1,
			zoom: 2,
			distance,
		};
	}, [displayScene]);

	// ビュー切り替えの処理や
	useEffect(() => {
		if (!viewRequest || !cameraConfig || !camera) return;
		const distance = cameraConfig.distance;
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

		const orbitControls = controls as any;
		if (orbitControls?.target) {
			orbitControls.target.set(0, 0, 0);
			orbitControls.update?.();
		}
	}, [viewRequest, cameraConfig, camera, controls]);

	if (!displayScene || !cameraConfig) return null;

	return (
		<>
			{orthographic ? (
				<OrthographicCamera
					makeDefault
					position={cameraConfig.position}
					zoom={cameraConfig.zoom}
					near={cameraConfig.near}
					far={cameraConfig.far}
				/>
			) : (
				<PerspectiveCamera
					makeDefault
					position={cameraConfig.position}
					fov={50}
					near={cameraConfig.near}
					far={cameraConfig.far}
				/>
			)}

			<ambientLight intensity={0.6} />
			<directionalLight position={[10, 10, 5]} intensity={0.8} />
			<directionalLight position={[-10, -10, -5]} intensity={0.3} />

			<group rotation={upAxisRotation}>
				<GlbScene
					scene={displayScene}
					edgeColor={edgeColor}
					showEdges={showEdges}
					edgePositions={displayEdgePositions}
				/>
				{annotations && <Annotations annotations={annotations} />}
				{showAxis && (
					<axesHelper args={[cameraConfig.distance * 0.5]} />
				)}
			</group>

			<OrbitControls
				makeDefault
				target={[0, 0, 0]}
				enableDamping
				dampingFactor={0.05}
			/>
		</>
	);
}

/**
 * Lambda360View - GLBモデルを表示してエッジも出せる3Dビューアーコンポーネントやで。
 *
 * シームレスなモデルの切り替えに対応しとるで：`model` プロパティが変わった時、
 * 新しいモデルが完全に解析されるまで、前のモデルが表示されたままになるんや。
 * カメラの状態（位置、ズーム、OrbitControlsのターゲット）はデフォルトで保持されるで。
 * モデルが変わるたびにカメラをリセットしたい時は `preserveCamera={false}` にしたってな。
 */
export function Lambda360View({
	model,
	backgroundColor = '#1a1a2e',
	edgeColor = '#000000',
	showEdges = true,
	upAxis = 'Y',
	orthographic = false,
	showViewMenu = false,
	footer,
	annotations,
	preserveCamera = true,
	...divProps
}: Lambda360ViewProps) {
	const [showAxis, setShowAxis] = useState(true);
	const [isLoading, setIsLoading] = useState(true);
	const [viewRequest, setViewRequest] = useState<{ type: ViewType; ts: number } | null>(null);

	const handleViewChange = (view: ViewType) => {
		// 同じビューでも再度クリックしたらカメラをリセットできるようにタイムスタンプ付きでリクエスト
		setViewRequest({ type: view, ts: Date.now() });
	};

	const upAxisRotation = useMemo(() => getUpAxisRotation(upAxis), [upAxis]);

	const containerStyle: React.CSSProperties = {
		width: '100%',
		height: '100%',
		position: 'relative',
		...divProps.style,
	};

	return (
		<div {...divProps} style={containerStyle}>
			{isLoading && (
				<div style={{
					position: 'absolute',
					top: 0, left: 0, right: 0, bottom: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: backgroundColor,
					color: '#fff',
					fontFamily: 'sans-serif',
					zIndex: 20
				}}>
					Loading...
				</div>
			)}

			{!isLoading && showViewMenu && (
				<ViewMenu
					onViewChange={handleViewChange}
					showAxisButton={true}
					axisEnabled={showAxis}
					onToggleAxis={() => setShowAxis(!showAxis)}
				/>
			)}

			<Canvas
				gl={{
					antialias: true,
					toneMapping: THREE.NoToneMapping,
				}}
				style={{ background: backgroundColor }}
			>
				<SceneManager
					model={model}
					preserveCamera={preserveCamera}
					edgeColor={edgeColor}
					showEdges={showEdges}
					upAxisRotation={upAxisRotation}
					annotations={annotations}
					showAxis={showAxis}
					viewRequest={viewRequest}
					orthographic={orthographic}
					onLoading={setIsLoading}
				/>
			</Canvas>

			{!isLoading && footer && (
				<div style={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					right: 0,
					pointerEvents: 'none',
					zIndex: 10
				}}>
					{footer}
				</div>
			)}
		</div>
	);
}
