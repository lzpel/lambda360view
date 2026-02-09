import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { Lambda360ViewProps } from '../types';
import { ModelRenderer } from './ModelRenderer';
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

/**
 * Component that provides camera setter function via ref
 */
const CameraSetter: React.FC<{
	setCameraRef: React.MutableRefObject<((pos: [number, number, number]) => void) | null>;
}> = ({ setCameraRef }) => {
	const { camera } = useThree();

	setCameraRef.current = (pos: [number, number, number]) => {
		camera.position.set(pos[0], pos[1], pos[2]);
		camera.lookAt(0, 0, 0);
	};

	return null;
};

/**
 * Lambda360View - A 3D viewer component for CAD-like models with edge display
 */
export const Lambda360View: React.FC<Lambda360ViewProps> = ({
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
}) => {
	const setCameraRef = useRef<((pos: [number, number, number]) => void) | null>(null);
	const [showAxis, setShowAxis] = useState(true);
	const [mounted, setMounted] = useState(false);

	// Mount check for SSR compatibility
	useEffect(() => {
		setMounted(true);
	}, []);

	// Calculate camera position based on bounding box
	const cameraConfig = useMemo(() => {
		const bb = model.bb;
		const sizeX = bb.xmax - bb.xmin;
		const sizeY = bb.ymax - bb.ymin;
		const sizeZ = bb.zmax - bb.zmin;
		const maxSize = Math.max(sizeX, sizeY, sizeZ);
		const distance = maxSize * 1.5;

		return {
			position: [distance, distance * 0.5, distance] as [number, number, number],
			far: maxSize * 10,
			near: 0.1,
			zoom: 2,
			distance,
		};
	}, [model.bb]);

	// Handle view change from menu
	const handleViewChange = (view: ViewType) => {
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
		setCameraRef.current?.(positions[view]);
	};

	// Get rotation for up axis conversion
	const upAxisRotation = useMemo(() => getUpAxisRotation(upAxis), [upAxis]);

	const containerStyle: React.CSSProperties = {
		width,
		height,
		position: 'relative',
		...style,
	};

	const renderCanvas = () => (
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

			<CameraSetter setCameraRef={setCameraRef} />

			<ambientLight intensity={0.6} />
			<directionalLight position={[10, 10, 5]} intensity={0.8} />
			<directionalLight position={[-10, -10, -5]} intensity={0.3} />

			<group rotation={upAxisRotation}>
				<ModelRenderer
					model={model}
					edgeColor={edgeColor}
					showEdges={showEdges}
				/>
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
	);

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
			{mounted ? renderCanvas() : null}
		</div>
	);
};
