'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useWorldStore } from '@/lib/store/world-store';

interface GroundProps {
  color: string;
}

export function Ground({ color }: GroundProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const addObject = useWorldStore((s) => s.addObject);
  const tool = useWorldStore((s) => s.tool);

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (tool === 'select') return;
    // If clicking ground in move/rotate/scale mode, just deselect
  };

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
      onClick={handleClick}
    >
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}
