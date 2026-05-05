'use client';

import { useWorldStore } from '@/lib/store/world-store';
import { SceneObject } from './scene-object';

export function SceneObjects() {
  const objects = useWorldStore((s) => s.world?.objects ?? []);

  return (
    <>
      {objects.map((obj) => (
        <SceneObject key={obj.id} object={obj} />
      ))}
    </>
  );
}
