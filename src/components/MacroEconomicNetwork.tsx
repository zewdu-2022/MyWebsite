import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

const NODES = [
  { id: 1, name: "GDP", position: [0, 0, 0] },
  { id: 2, name: "Inflation", position: [2, 2, 0] },
  { id: 3, name: "Employment", position: [-2, 2, 0] },
  { id: 4, name: "Investment", position: [2, -2, 0] },
  { id: 5, name: "Trade Balance", position: [-2, -2, 0] },
];

const LINKS = [
  [NODES[0], NODES[1]],
  [NODES[0], NODES[2]],
  [NODES[0], NODES[3]],
  [NODES[0], NODES[4]],
  [NODES[1], NODES[2]],
  [NODES[3], NODES[4]],
];

const Node = ({ position, name }: { position: [number, number, number]; name: string }) => {
  return (
    <group position={new THREE.Vector3(...position)}>
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
      </mesh>
      <Text position={[0, 0.5, 0]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
        {name}
      </Text>
    </group>
  );
};

const Link = ({ start, end }: { start: [number, number, number]; end: [number, number, number] }) => {
  const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
  return (
    <line>
      <bufferGeometry attach="geometry" setFromPoints={points} />
      <lineBasicMaterial attach="material" color="#64748b" transparent opacity={0.5} />
    </line>
  );
};

const Network = () => {
    const groupRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if(groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
            groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.2) * 0.1;
        }
    });

    return (
        <group ref={groupRef}>
            {NODES.map((node) => (
                <Node key={node.id} position={node.position as [number, number, number]} name={node.name} />
            ))}
            {LINKS.map((link, index) => (
                <Link key={index} start={link[0].position as [number, number, number]} end={link[1].position as [number, number, number]} />
            ))}
        </group>
    );
};

export const MacroEconomicNetwork = () => {
  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Network />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};
