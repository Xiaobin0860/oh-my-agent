'use client';

import { motion } from 'framer-motion';
import { useWorldStore } from '@/lib/store/world-store';
import type { ObjectType } from '@/types/world';

const OBJECT_CATEGORIES = [
  {
    label: 'Shapes',
    items: [
      { type: 'cube' as ObjectType, emoji: '🟥', label: 'Cube' },
      { type: 'sphere' as ObjectType, emoji: '🔵', label: 'Ball' },
      { type: 'cylinder' as ObjectType, emoji: '🟡', label: 'Tube' },
      { type: 'cone' as ObjectType, emoji: '🔺', label: 'Cone' },
      { type: 'torus' as ObjectType, emoji: '🍩', label: 'Ring' },
    ],
  },
  {
    label: 'Nature',
    items: [
      { type: 'tree' as ObjectType, emoji: '🌲', label: 'Tree' },
      { type: 'flower' as ObjectType, emoji: '🌸', label: 'Flower' },
      { type: 'rock' as ObjectType, emoji: '🪨', label: 'Rock' },
      { type: 'mushroom' as ObjectType, emoji: '🍄', label: 'Mushroom' },
      { type: 'crystal' as ObjectType, emoji: '💎', label: 'Crystal' },
      { type: 'cloud' as ObjectType, emoji: '☁️', label: 'Cloud' },
    ],
  },
  {
    label: 'Things',
    items: [
      { type: 'house' as ObjectType, emoji: '🏠', label: 'House' },
      { type: 'character' as ObjectType, emoji: '🧑', label: 'Person' },
      { type: 'animal' as ObjectType, emoji: '🐾', label: 'Animal' },
    ],
  },
];

interface ObjectPaletteProps {
  onClose?: () => void;
}

export function ObjectPalette({ onClose }: ObjectPaletteProps) {
  const addObject = useWorldStore((s) => s.addObject);

  const handleAdd = (type: ObjectType) => {
    const offset = (Math.random() - 0.5) * 6;
    const offsetZ = (Math.random() - 0.5) * 6;
    addObject(type, { x: offset, y: type === 'cloud' ? 4 + Math.random() * 2 : 0.5, z: offsetZ });
  };

  return (
    <div className="glass-panel rounded-[var(--radius-panel)] p-4 shadow-soft max-h-[70vh] overflow-y-auto">
      <h3 className="font-bold text-charcoal mb-3 text-center">Add to World</h3>
      {OBJECT_CATEGORIES.map((cat) => (
        <div key={cat.label} className="mb-4">
          <p className="text-xs font-bold text-charcoal-light mb-2">{cat.label}</p>
          <div className="grid grid-cols-3 gap-2">
            {cat.items.map((item) => (
              <motion.button
                key={item.type}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleAdd(item.type)}
                className="tap-target flex flex-col items-center gap-1 p-3 rounded-2xl bg-white/60 hover:bg-white transition-colors cursor-pointer"
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-xs font-bold">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
