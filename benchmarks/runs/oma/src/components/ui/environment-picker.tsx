'use client';

import { motion } from 'framer-motion';
import { useWorldStore, ENVIRONMENT_PRESETS } from '@/lib/store/world-store';
import type { EnvironmentTheme } from '@/types/world';

const THEMES: { id: EnvironmentTheme; emoji: string; label: string }[] = [
  { id: 'meadow', emoji: '🌿', label: 'Meadow' },
  { id: 'ocean', emoji: '🌊', label: 'Ocean' },
  { id: 'space', emoji: '🚀', label: 'Space' },
  { id: 'desert', emoji: '🏜️', label: 'Desert' },
  { id: 'forest', emoji: '🌲', label: 'Forest' },
  { id: 'snow', emoji: '❄️', label: 'Snow' },
  { id: 'candy', emoji: '🍬', label: 'Candy' },
];

interface EnvironmentPickerProps {
  onClose?: () => void;
}

export function EnvironmentPicker({ onClose }: EnvironmentPickerProps) {
  const { world, setEnvironment } = useWorldStore();
  const current = world?.environment.theme;

  return (
    <div className="glass-panel rounded-[var(--radius-panel)] p-4 shadow-soft">
      <h3 className="font-bold text-charcoal mb-3 text-center">Pick Your World</h3>
      <div className="grid grid-cols-4 gap-2">
        {THEMES.map((theme) => (
          <motion.button
            key={theme.id}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              setEnvironment(theme.id);
              onClose?.();
            }}
            className={`
              tap-target flex flex-col items-center gap-1 p-3 rounded-2xl
              transition-colors cursor-pointer
              ${current === theme.id ? 'bg-sunshine ring-2 ring-coral' : 'hover:bg-white/60'}
            `}
          >
            <span className="text-2xl">{theme.emoji}</span>
            <span className="text-xs font-bold">{theme.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
