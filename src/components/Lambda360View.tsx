'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Lambda360ViewProps, Annotation, Axis } from '../types';
import { Annotations } from './Annotations';
import { ViewMenu, ViewType } from './ViewMenu';
import { Grid } from './Grid';
import { OrbitSizeControls } from './OrbitSizeControls';

/** モデルの上方向軸からThree.jsのY-upに変換する回転を取得する */
function getUpAxisRotation(axisUp: Axis): THREE.Euler {
	switch (axisUp) {
		case 'Y': return new THREE.Euler(0, 0, 0);
		case 'Z': return new THREE.Euler(-Math.PI / 2, 0, 0);
		case 'X': return new THREE.Euler(0, 0, -Math.PI / 2);
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

	useEffect(() => {
		if (!edgePositions) return;
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
		const material = new THREE.LineBasicMaterial({ color: edgeColor, linewidth: 1 });
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

	useEffect(() => {
		if (edgeLineRef.current) {
			(edgeLineRef.current.material as THREE.LineBasicMaterial).color.set(edgeColor);
		}
	}, [edgeColor]);

	useEffect(() => {
		if (edgeLineRef.current) {
			edgeLineRef.current.visible = showEdges;
		}
	}, [showEdges]);

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

interface SceneManagerProps {
	model: ArrayBuffer | null;
	edgeColor: string;
	showEdges: boolean;
	axisUp: Axis;
	axisGround?: Axis;
	axisCenter?: Axis[];
	annotations?: Annotation[];
	showAxis: boolean;
	showGrid: boolean;
	viewRequest: { type: ViewType; ts: number } | null;
	orthographic: boolean;
}

function SceneManager({
	model,
	edgeColor,
	showEdges,
	axisUp,
	axisGround,
	axisCenter,
	annotations,
	showAxis,
	showGrid,
	viewRequest,
	orthographic,
}: SceneManagerProps) {
	const [displayScene, setDisplayScene] = useState<THREE.Group | null>(null);
	const [displayEdgePositions, setDisplayEdgePositions] = useState<Float32Array | null>(null);

	const prevSceneRef = useRef<THREE.Group | null>(null);

	// モデル読み込みとシームレス切り替え
	useEffect(() => {
		let cancelled = false;

		if (model === null) {
			if (prevSceneRef.current) {
				disposeScene(prevSceneRef.current);
				prevSceneRef.current = null;
			}
			setDisplayScene(null);
			setDisplayEdgePositions(null);
			return;
		}

		const loader = new GLTFLoader();

		loader.parse(
			model,
			'',
			(gltf) => {
				if (cancelled) return;

				const newScene = gltf.scene;
				const edgeAccessorIndex = gltf.userData?.edgeAccessor;

				const finalize = (edges: Float32Array | null) => {
					if (cancelled) return;

					if (prevSceneRef.current) {
						disposeScene(prevSceneRef.current);
					}

					prevSceneRef.current = newScene;
					setDisplayScene(newScene);
					setDisplayEdgePositions(edges);
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
			}
		);

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [model]);

	// アンマウント時のお片付け
	useEffect(() => {
		return () => {
			if (prevSceneRef.current) {
				disposeScene(prevSceneRef.current);
				prevSceneRef.current = null;
			}
		};
	}, []);

	const maxSize = useMemo(() => {
		if (!displayScene) return null;
		const box = new THREE.Box3().setFromObject(displayScene);
		const size = box.getSize(new THREE.Vector3());
		return Math.max(size.x, size.y, size.z);
	}, [displayScene]);

	// axisGround / axisCenter によるモデルオフセットをモデル空間で計算する
	const modelOffset = useMemo((): [number, number, number] => {
		if (!displayScene || (!axisGround && !axisCenter?.length)) return [0, 0, 0];
		const box = new THREE.Box3().setFromObject(displayScene);
		const center = box.getCenter(new THREE.Vector3());
		let ox = 0, oy = 0, oz = 0;

		if (axisCenter) {
			if (axisCenter.includes('X')) ox = -center.x;
			if (axisCenter.includes('Y')) oy = -center.y;
			if (axisCenter.includes('Z')) oz = -center.z;
		}

		if (axisGround === 'X') ox = -box.min.x;
		if (axisGround === 'Y') oy = -box.min.y;
		if (axisGround === 'Z') oz = -box.min.z;

		return [ox, oy, oz];
	}, [displayScene, axisGround, axisCenter]);

	const upAxisRotation = useMemo(() => getUpAxisRotation(axisUp), [axisUp]);

	if (!displayScene || !maxSize) return null;

	return (
		<>
			<OrbitSizeControls maxSize={maxSize} orthographic={orthographic} viewRequest={viewRequest} />

			<ambientLight intensity={0.6} />
			<directionalLight position={[10, 10, 5]} intensity={0.8} />
			<directionalLight position={[-10, -10, -5]} intensity={0.3} />

			<group rotation={upAxisRotation}>
				<group position={modelOffset}>
					<GlbScene
						scene={displayScene}
						edgeColor={edgeColor}
						showEdges={showEdges}
						edgePositions={displayEdgePositions}
					/>
					{annotations && <Annotations annotations={annotations} />}
				</group>
				{showAxis && (
					<axesHelper args={[maxSize * 0.75]} />
				)}
				{showGrid && (
					<Grid maxSize={maxSize} />
				)}
			</group>
		</>
	);
}

/**
 * Lambda360View - GLBモデルを表示してエッジも出せる3Dビューアーコンポーネントやで。
 *
 * シームレスなモデルの切り替えに対応しとるで：`model` プロパティが変わった時、
 * 新しいモデルが完全に解析されるまで、前のモデルが表示されたままになるんや。
 * カメラの状態（位置、ズーム、OrbitControlsのターゲット）はモデル切り替え時に維持されるで。
 */
export function Lambda360View({
	model,
	backgroundColor = '#1a1a2e',
	edgeColor = '#000000',
	showEdges = true,
	axisUp = 'Y',
	axisGround,
	axisCenter,
	orthographic = false,
	showViewMenu = false,
	nodeFooter,
	annotations,
	nodeCenter,
	...divProps
}: Lambda360ViewProps) {
	const [showAxis, setShowAxis] = useState(true);
	const [showGrid, setShowGrid] = useState(false);
	const [viewRequest, setViewRequest] = useState<{ type: ViewType; ts: number } | null>(null);

	const handleViewChange = (view: ViewType) => {
		setViewRequest({ type: view, ts: Date.now() });
	};

	const containerStyle: React.CSSProperties = {
		width: '100%',
		height: '100%',
		position: 'relative',
		...divProps.style,
	};

	return (
		<div {...divProps} style={containerStyle}>

			{nodeCenter && (
				<div style={{
					position: 'absolute',
					top: 0, left: 0, right: 0, bottom: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					pointerEvents: 'none',
					zIndex: 20
				}}>
					<div style={{ pointerEvents: 'auto' }}>
						{nodeCenter}
					</div>
				</div>
			)}

			{showViewMenu && (
				<ViewMenu
					onViewChange={handleViewChange}
					showAxisButton={true}
					showAxis={showAxis}
					onToggleAxis={() => setShowAxis(!showAxis)}
					showGridButton={true}
					showGrid={showGrid}
					onToggleGrid={() => setShowGrid(!showGrid)}
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
					edgeColor={edgeColor}
					showEdges={showEdges}
					axisUp={axisUp}
					axisGround={axisGround}
					axisCenter={axisCenter}
					annotations={annotations}
					showAxis={showAxis}
					showGrid={showGrid}
					viewRequest={viewRequest}
					orthographic={orthographic}
				/>
			</Canvas>

			{nodeFooter && (
				<div style={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					right: 0,
					pointerEvents: 'none',
					zIndex: 10
				}}>
					{nodeFooter}
				</div>
			)}
		</div>
	);
}
