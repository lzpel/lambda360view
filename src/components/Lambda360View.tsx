'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Lambda360ViewProps } from '../types';
import { Annotations } from './Annotations';
import { ViewMenu, ViewType } from './ViewMenu';

/**
 * Get rotation to convert from model's up axis to Three.js Y-up
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

interface CameraHandle {
	setPosition: (pos: [number, number, number]) => void;
}

const CameraSetter = React.forwardRef<CameraHandle, {}>((_props, ref) => {
	const { camera } = useThree();

	React.useImperativeHandle(
		ref,
		() => ({
			setPosition: (pos: [number, number, number]) => {
				camera.position.set(pos[0], pos[1], pos[2]);
				camera.lookAt(0, 0, 0);
			},
		}),
		[camera]
	);

	return null;
});

/**
 * Component that renders a loaded GLB scene with edge overlays.
 * Runs inside Canvas context.
 */
function GlbScene({
	scene,
	edgeColor,
	showEdges,
}: {
	scene: THREE.Group;
	edgeColor: string;
	showEdges: boolean;
}) {
	const edgeLinesRef = useRef<THREE.LineSegments[]>([]);

	// Create edge LineSegments and attach to mesh parents
	useEffect(() => {
		const lines: THREE.LineSegments[] = [];
		scene.traverse((child) => {
			if (child instanceof THREE.Mesh && child.userData.edges) {
				const edgeData = new Float32Array(child.userData.edges);
				const geometry = new THREE.BufferGeometry();
				geometry.setAttribute(
					'position',
					new THREE.BufferAttribute(edgeData, 3)
				);
				const material = new THREE.LineBasicMaterial({
					color: edgeColor,
					linewidth: 1,
				});
				const lineSegments = new THREE.LineSegments(geometry, material);
				lineSegments.userData._isEdge = true;
				child.add(lineSegments);
				lines.push(lineSegments);
			}
		});
		edgeLinesRef.current = lines;

		return () => {
			lines.forEach((line) => {
				line.parent?.remove(line);
				line.geometry.dispose();
				(line.material as THREE.Material).dispose();
			});
		};
	}, [scene]);

	// Update edge color
	useEffect(() => {
		edgeLinesRef.current.forEach((line) => {
			(line.material as THREE.LineBasicMaterial).color.set(edgeColor);
		});
	}, [edgeColor]);

	// Update edge visibility
	useEffect(() => {
		edgeLinesRef.current.forEach((line) => {
			line.visible = showEdges;
		});
	}, [showEdges]);

	// Apply polygonOffset to all mesh materials for proper edge rendering
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

/**
 * Lambda360View - A 3D viewer component for GLB models with edge display
 */
export function Lambda360View({
	model,
	backgroundColor = '#1a1a2e',
	edgeColor = '#000000',
	showEdges = true,
	width = '100%',
	height = '100%',
	className,
	style,
	upAxis = 'Y',
	orthographic = false,
	showViewMenu = false,
	footer,
	annotations,
}: Lambda360ViewProps) {
	const cameraSetterRef = useRef<CameraHandle>(null);
	const [showAxis, setShowAxis] = useState(true);
	const [gltfScene, setGltfScene] = useState<THREE.Group | null>(null);

	// Parse GLB ArrayBuffer
	useEffect(() => {
		const loader = new GLTFLoader();
		loader.parse(
			model,
			'',
			(gltf) => {
				setGltfScene(gltf.scene);
			},
			(error) => {
				console.error('GLB parse error:', error);
			}
		);
	}, [model]);

	// Compute camera config from scene bounding box
	const cameraConfig = useMemo(() => {
		if (!gltfScene) return null;
		const box = new THREE.Box3().setFromObject(gltfScene);
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
	}, [gltfScene]);

	const handleViewChange = (view: ViewType) => {
		if (!cameraConfig) return;
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
		cameraSetterRef.current?.setPosition(positions[view]);
	};

	const upAxisRotation = useMemo(() => getUpAxisRotation(upAxis), [upAxis]);

	const containerStyle: React.CSSProperties = {
		width,
		height,
		position: 'relative',
		...style,
	};

	if (!gltfScene || !cameraConfig) {
		return (
			<div className={className} style={containerStyle}>
				<div style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: backgroundColor,
					color: '#fff',
					fontFamily: 'sans-serif',
				}}>
					Loading...
				</div>
			</div>
		);
	}

	return (
		<div className={className} style={containerStyle}>
			{showViewMenu && (
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

				<CameraSetter ref={cameraSetterRef} />

				<ambientLight intensity={0.6} />
				<directionalLight position={[10, 10, 5]} intensity={0.8} />
				<directionalLight position={[-10, -10, -5]} intensity={0.3} />

				<group rotation={upAxisRotation}>
					<GlbScene
						scene={gltfScene}
						edgeColor={edgeColor}
						showEdges={showEdges}
					/>
					{annotations && <Annotations annotations={annotations} />}
					{showAxis && (
						<axesHelper args={[cameraConfig.distance * 0.5]} />
					)}
				</group>

				<OrbitControls
					target={[0, 0, 0]}
					enableDamping
					dampingFactor={0.05}
				/>
			</Canvas>
			{footer && (
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
