'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import { Suspense } from 'react';
import { useWorldStore } from '@/lib/store/world-store';
import { SceneObjects } from './scene-objects';
import { Ground } from './ground';

export function WorldCanvas() {
  const world = useWorldStore((s) => s.world);
  const isPlaying = useWorldStore((s) => s.isPlaying);
  const selectObject = useWorldStore((s) => s.selectObject);

  if (!world) return null;

  const env = world.environment;
  const isSpace = env.theme === 'space';

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [8, 6, 8], fov: 50 }}
        onPointerMissed={() => selectObject(null)}
      >
        <color attach="background" args={[env.skyColor]} />

        {env.fogDensity > 0 && <fog attach="fog" args={[env.skyColor, 10, 80]} />}

        <ambientLight intensity={env.ambientLight} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.3} />

        {isSpace ? <Stars radius={100} depth={50} count={3000} factor={4} /> : <Sky sunPosition={[100, 20, 100]} />}

        <Suspense fallback={null}>
          <Ground color={env.groundColor} />
          <SceneObjects />
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.1}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={3}
          maxDistance={40}
          enabled={!isPlaying}
        />
      </Canvas>
    </div>
  );
}
