'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Lambda360ViewProps, Annotation, Axis } from '../types';
import Annotations from './Annotations';
import { ViewMenu, ViewType } from './ViewMenu';
import { Grid } from './Grid';
import { OrbitSizeControls } from './OrbitSizeControls';
import Axes from './Axes';

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

interface LoadedItem {
	scene: THREE.Group;
	edgePositions: Float32Array | null;
}

interface SceneManagerProps {
	model: ArrayBuffer[];
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
	const [items, setItems] = useState<LoadedItem[]>([]);
	const prevItemsRef = useRef<LoadedItem[]>([]);

	// モデル読み込みとシームレス切り替え
	useEffect(() => {
		let cancelled = false;

		if (!model || model.length === 0) {
			for (const item of prevItemsRef.current) disposeScene(item.scene);
			prevItemsRef.current = [];
			setItems([]);
			return;
		}

		const loader = new GLTFLoader();

		Promise.all(
			model.map(
				(buf) =>
					new Promise<LoadedItem>((resolve, reject) => {
						loader.parse(
							buf,
							'',
							(gltf) => {
								const edgeAccessorIndex = gltf.userData?.edgeAccessor;
								if (edgeAccessorIndex !== undefined) {
									gltf.parser
										.getDependency('accessor', edgeAccessorIndex)
										.then((attr: THREE.BufferAttribute) => {
											resolve({ scene: gltf.scene, edgePositions: attr.array as Float32Array });
										})
										.catch(reject);
								} else {
									resolve({ scene: gltf.scene, edgePositions: null });
								}
							},
							reject
						);
					})
			)
		)
			.then((loaded) => {
				if (cancelled) {
					for (const item of loaded) disposeScene(item.scene);
					return;
				}
				for (const item of prevItemsRef.current) disposeScene(item.scene);
				prevItemsRef.current = loaded;
				setItems(loaded);
			})
			.catch((error) => {
				console.error('GLB parse error:', error);
			});

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [model]);

	// アンマウント時のお片付け
	useEffect(() => {
		return () => {
			for (const item of prevItemsRef.current) disposeScene(item.scene);
			prevItemsRef.current = [];
		};
	}, []);

	const unionBox = useMemo(() => {
		if (items.length === 0) return null;
		const box = new THREE.Box3();
		for (const item of items) {
			item.scene.updateMatrixWorld(true);
			box.expandByObject(item.scene);
		}
		return box.isEmpty() ? null : box;
	}, [items]);

	const maxSize = useMemo(() => {
		if (!unionBox) return null;
		const size = unionBox.getSize(new THREE.Vector3());
		return Math.max(size.x, size.y, size.z);
	}, [unionBox]);

	// axisGround / axisCenter によるモデルオフセットをモデル空間で計算する
	const modelOffset = useMemo((): [number, number, number] => {
		if (!unionBox || (!axisGround && !axisCenter?.length)) return [0, 0, 0];
		const center = unionBox.getCenter(new THREE.Vector3());
		let ox = 0, oy = 0, oz = 0;

		if (axisCenter) {
			if (axisCenter.includes('X')) ox = -center.x;
			if (axisCenter.includes('Y')) oy = -center.y;
			if (axisCenter.includes('Z')) oz = -center.z;
		}

		if (axisGround === 'X') ox = -unionBox.min.x;
		if (axisGround === 'Y') oy = -unionBox.min.y;
		if (axisGround === 'Z') oz = -unionBox.min.z;

		return [ox, oy, oz];
	}, [unionBox, axisGround, axisCenter]);

	const upAxisRotation = useMemo(() => getUpAxisRotation(axisUp), [axisUp]);

	if (items.length === 0 || !maxSize) return null;

	return (
		<>
			<OrbitSizeControls maxSize={maxSize} orthographic={orthographic} viewRequest={viewRequest} />

			<ambientLight intensity={0.6} />
			<directionalLight position={[10, 10, 5]} intensity={0.8} />
			<directionalLight position={[-10, -10, -5]} intensity={0.3} />

			<group rotation={upAxisRotation}>
				<group position={modelOffset}>
					{items.map((item, i) => (
						<GlbScene
							key={i}
							scene={item.scene}
							edgeColor={edgeColor}
							showEdges={showEdges}
							edgePositions={item.edgePositions}
						/>
					))}
					{annotations && <Annotations annotations={annotations} />}
				</group>
				{showAxis && (
					<Axes maxSize={maxSize} />
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
export default function Lambda360View({
	model,
	backgroundColor = 'transparent',
	edgeColor = '#000000',
	showEdges = true,
	axisUp = 'Y',
	axisGround,
	axisCenter,
	orthographic = false,
	showViewMenu = false,
	onDownloadStep,
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
			{/* nodeCenter */}
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
			{/* Menu */}
			{showViewMenu && (
				<ViewMenu
					onViewChange={handleViewChange}
					showAxisButton={true}
					showAxis={showAxis}
					onToggleAxis={() => setShowAxis(!showAxis)}
					showGridButton={true}
					showGrid={showGrid}
					onToggleGrid={() => setShowGrid(!showGrid)}
					onDownloadStep={onDownloadStep}
				/>
			)}
			{/* Canvas */}
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
			{/* nodeFooter */}
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
