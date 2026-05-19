import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MAX_STARS = 2000;

export function SkyBackground({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const starsData = useMemo(() => {
    const data = [];
    for (let i = 0; i < MAX_STARS; i++) {
      data.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 20
        ),
        speed: 0.01 + Math.random() * 0.02,
        // Parallax speed modifier based on depth (z)
        depthModifier: 0.5 + Math.random(),
        phase: Math.random() * Math.PI * 2,
        size: Math.random() * 0.05 + 0.02,
        color: new THREE.Color(0xffffff).lerp(new THREE.Color(0x4488ff), Math.random())
      });
    }
    return data;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Smoothly apply scroll effect
    const scrollFactor = scrollProgress.current;
    
    for (let i = 0; i < MAX_STARS; i++) {
        const star = starsData[i];
        
        // Drift from bottom-left to top-right
        star.position.x += star.speed * delta * 2;
        star.position.y += star.speed * delta * 2;
        
        // Parallax layer effect based on scroll
        const parallaxOffset = scrollFactor * 5 * star.depthModifier;
        
        // Organic wobble
        const wobbleX = Math.sin(state.clock.elapsedTime * 0.5 + star.phase) * 0.1;
        const wobbleY = Math.cos(state.clock.elapsedTime * 0.3 + star.phase) * 0.1;
        
        // Wrap around
        if (star.position.x > 20) star.position.x = -20;
        if (star.position.y > 20) star.position.y = -20;
        
        dummy.position.set(
            star.position.x + wobbleX,
            (star.position.y - parallaxOffset) + wobbleY,
            star.position.z
        );
        dummy.scale.set(star.size, star.size, star.size);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, star.color);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_STARS]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial transparent opacity={0.3} />
    </instancedMesh>
  );
}
