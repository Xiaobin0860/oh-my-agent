'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useWorldStore } from '@/lib/store/world-store';
import type { WorldObject } from '@/types/world';

interface SceneObjectProps {
  object: WorldObject;
}

export function SceneObject({ object }: SceneObjectProps) {
  const meshRef = useRef<THREE.Mesh | THREE.Group>(null);
  const selectedId = useWorldStore((s) => s.selectedObjectId);
  const selectObject = useWorldStore((s) => s.selectObject);
  const updateObject = useWorldStore((s) => s.updateObject);
  const removeObject = useWorldStore((s) => s.removeObject);
  const tool = useWorldStore((s) => s.tool);
  const isSelected = selectedId === object.id;
  const [hovered, setHovered] = useState(false);

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (tool === 'delete') {
      removeObject(object.id);
      return;
    }
    selectObject(object.id);
  };

  // Gentle hover animation for selected object
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (isSelected) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  const geometry = getGeometry(object.type);
  const isCompound = ['tree', 'house', 'character', 'animal', 'flower', 'mushroom'].includes(object.type);

  return (
    <group
      position={[object.position.x, object.position.y, object.position.z]}
      rotation={[object.rotation.x, object.rotation.y, object.rotation.z]}
      scale={[object.scale.x, object.scale.y, object.scale.z]}
    >
      {isCompound ? (
        <group
          ref={meshRef as React.Ref<THREE.Group>}
          onClick={handleClick}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
          onPointerOut={() => setHovered(false)}
        >
          <CompoundObject type={object.type} color={object.color} />
          {isSelected && <SelectionIndicator />}
        </group>
      ) : (
        <mesh
          ref={meshRef as React.Ref<THREE.Mesh>}
          castShadow
          receiveShadow
          onClick={handleClick}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
          onPointerOut={() => setHovered(false)}
        >
          {geometry}
          <meshStandardMaterial
            color={isSelected ? '#FFD93D' : object.color}
            emissive={hovered ? object.color : '#000000'}
            emissiveIntensity={hovered ? 0.15 : 0}
            roughness={0.6}
            metalness={0.1}
          />
          {isSelected && <SelectionIndicator />}
        </mesh>
      )}
    </group>
  );
}

function getGeometry(type: string) {
  switch (type) {
    case 'sphere': return <sphereGeometry args={[0.5, 32, 32]} />;
    case 'cylinder': return <cylinderGeometry args={[0.4, 0.4, 1, 32]} />;
    case 'cone': return <coneGeometry args={[0.5, 1, 32]} />;
    case 'torus': return <torusGeometry args={[0.4, 0.15, 16, 32]} />;
    case 'rock': return <dodecahedronGeometry args={[0.5, 0]} />;
    case 'crystal': return <octahedronGeometry args={[0.5, 0]} />;
    case 'cloud': return <sphereGeometry args={[0.6, 16, 16]} />;
    default: return <boxGeometry args={[1, 1, 1]} />;
  }
}

function CompoundObject({ type, color }: { type: string; color: string }) {
  switch (type) {
    case 'tree':
      return (
        <>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 1, 8]} />
            <meshStandardMaterial color="#8B4513" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.4, 0]} castShadow>
            <coneGeometry args={[0.7, 1.2, 8]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.9, 0]} castShadow>
            <coneGeometry args={[0.5, 0.8, 8]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        </>
      );
    case 'house':
      return (
        <>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[1.2, 1, 1]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.2, 0]} castShadow>
            <coneGeometry args={[0.9, 0.7, 4]} />
            <meshStandardMaterial color="#C0392B" roughness={0.7} />
          </mesh>
          <mesh position={[0.3, 0.5, 0.51]} castShadow>
            <boxGeometry args={[0.25, 0.25, 0.05]} />
            <meshStandardMaterial color="#87CEEB" roughness={0.3} metalness={0.1} />
          </mesh>
          <mesh position={[-0.15, 0.3, 0.51]}>
            <boxGeometry args={[0.3, 0.5, 0.05]} />
            <meshStandardMaterial color="#6D4C41" roughness={0.8} />
          </mesh>
        </>
      );
    case 'character':
      return (
        <>
          <mesh position={[0, 0.4, 0]} castShadow>
            <capsuleGeometry args={[0.25, 0.4, 8, 16]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
          <mesh position={[0, 1, 0]} castShadow>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial color="#FFDAB9" roughness={0.5} />
          </mesh>
          <mesh position={[0.08, 1.05, 0.2]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#2D3436" />
          </mesh>
          <mesh position={[-0.08, 1.05, 0.2]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#2D3436" />
          </mesh>
        </>
      );
    case 'animal':
      return (
        <>
          <mesh position={[0, 0.35, 0]} castShadow>
            <capsuleGeometry args={[0.2, 0.5, 8, 16]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh position={[0.35, 0.45, 0]} castShadow>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh position={[0.35, 0.55, 0.1]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#2D3436" />
          </mesh>
          <mesh position={[0.42, 0.6, -0.05]}>
            <coneGeometry args={[0.06, 0.12, 8]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh position={[0.42, 0.6, 0.05]}>
            <coneGeometry args={[0.06, 0.12, 8]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </>
      );
    case 'flower':
      return (
        <>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 0.6, 8]} />
            <meshStandardMaterial color="#2D5016" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.65, 0]} castShadow>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#FFD93D" roughness={0.5} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh
              key={i}
              position={[
                Math.cos((i * Math.PI * 2) / 5) * 0.18,
                0.65,
                Math.sin((i * Math.PI * 2) / 5) * 0.18,
              ]}
              castShadow
            >
              <sphereGeometry args={[0.1, 12, 12]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
          ))}
        </>
      );
    case 'mushroom':
      return (
        <>
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.15, 0.5, 8]} />
            <meshStandardMaterial color="#F5F5DC" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.55, 0]} castShadow>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        </>
      );
    default:
      return (
        <mesh castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      );
  }
}

function SelectionIndicator() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 2;
    }
  });
  return (
    <mesh ref={ref} position={[0, 1.8, 0]}>
      <octahedronGeometry args={[0.12, 0]} />
      <meshStandardMaterial color="#FFD93D" emissive="#FFD93D" emissiveIntensity={0.5} />
    </mesh>
  );
}
