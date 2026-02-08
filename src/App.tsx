import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { Hexapod } from './Hexapod';
import { getHexapodData } from './data';

const hexapodData = getHexapodData();

function App() {
    return (
        <div style={{ width: '100vw', height: '100vh', background: '#f0f0f0' }}>
            <Canvas shadows camera={{ position: [200, 200, 200], fov: 50 }}>
                <Stage environment="city" intensity={0.5} contactShadow={false}>
                    <Hexapod data={hexapodData} />
                </Stage>
                <OrbitControls makeDefault />
            </Canvas>
        </div>
    );
}

export default App;
