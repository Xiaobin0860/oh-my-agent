'use client';

import { motion } from 'framer-motion';

const AVATARS = [
  { id: 'star', emoji: '⭐', label: 'Star' },
  { id: 'rocket', emoji: '🚀', label: 'Rocket' },
  { id: 'rainbow', emoji: '🌈', label: 'Rainbow' },
  { id: 'flower', emoji: '🌸', label: 'Flower' },
  { id: 'butterfly', emoji: '🦋', label: 'Butterfly' },
  { id: 'dolphin', emoji: '🐬', label: 'Dolphin' },
  { id: 'unicorn', emoji: '🦄', label: 'Unicorn' },
  { id: 'dragon', emoji: '🐲', label: 'Dragon' },
  { id: 'panda', emoji: '🐼', label: 'Panda' },
  { id: 'owl', emoji: '🦉', label: 'Owl' },
  { id: 'cat', emoji: '🐱', label: 'Cat' },
  { id: 'sun', emoji: '☀️', label: 'Sun' },
];

interface AvatarPickerProps {
  selected: string;
  onSelect: (id: string) => void;
}

export function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {AVATARS.map((avatar) => (
        <motion.button
          key={avatar.id}
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(avatar.id)}
          className={`
            tap-target flex flex-col items-center gap-1 p-3 rounded-2xl
            transition-colors cursor-pointer
            ${
              selected === avatar.id
                ? 'bg-sunshine ring-2 ring-coral shadow-soft'
                : 'bg-white hover:bg-cream-dark'
            }
          `}
          aria-label={avatar.label}
        >
          <span className="text-3xl" role="img" aria-hidden="true">{avatar.emoji}</span>
          <span className="text-xs font-semibold text-charcoal-light">{avatar.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

export function getAvatarEmoji(id: string): string {
  return AVATARS.find((a) => a.id === id)?.emoji || '⭐';
}
