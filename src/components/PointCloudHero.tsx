import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

const ParticleCloud = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 5000;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const radius = 3;
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    // Rotate based on mouse
    const { mouse, clock } = state;
    pointsRef.current.rotation.x = mouse.y * 0.1;
    pointsRef.current.rotation.y = mouse.x * 0.1;
    
    // Subtle float
    pointsRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.1) * 0.05;
    
    // Animate colors
    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.color.setHSL(0.6 + mouse.x * 0.05, 0.8, 0.6);
  });

  return (
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
          <PointMaterial
            transparent
            vertexColors={false}
            size={0.02}
            sizeAttenuation={true}
            depthWrite={false}
            color="#3b82f6"
          />
        </Points>
      </Float>
  );
};

export const PointCloudHero = () => {
  return (
    <div className="w-full h-full min-h-[500px]">
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <ParticleCloud />
      </Canvas>
    </div>
  );
};
