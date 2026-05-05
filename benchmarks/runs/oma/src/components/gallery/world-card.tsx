'use client';

import { motion } from 'framer-motion';
import { Play, Pencil, Trash2, Box } from 'lucide-react';
import Link from 'next/link';
import { getAvatarEmoji } from '@/components/ui/avatar-picker';
import type { World } from '@/types/world';

const THEME_GRADIENTS: Record<string, string> = {
  meadow: 'from-green-300 to-sky-300',
  ocean: 'from-cyan-400 to-blue-500',
  space: 'from-indigo-900 to-purple-800',
  desert: 'from-amber-300 to-orange-400',
  forest: 'from-green-700 to-emerald-500',
  snow: 'from-blue-100 to-white',
  candy: 'from-pink-300 to-fuchsia-300',
};

interface WorldCardProps {
  world: World;
  onDelete?: (id: string) => void;
}

export function WorldCard({ world, onDelete }: WorldCardProps) {
  const gradient = THEME_GRADIENTS[world.environment.theme] || THEME_GRADIENTS.meadow;

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="bg-white rounded-[var(--radius-card)] shadow-soft overflow-hidden group"
    >
      {/* Preview area */}
      <div className={`h-36 bg-gradient-to-br ${gradient} relative flex items-center justify-center`}>
        <span className="text-5xl opacity-60">
          {world.environment.theme === 'meadow' && '🌿'}
          {world.environment.theme === 'ocean' && '🌊'}
          {world.environment.theme === 'space' && '🚀'}
          {world.environment.theme === 'desert' && '🏜️'}
          {world.environment.theme === 'forest' && '🌲'}
          {world.environment.theme === 'snow' && '❄️'}
          {world.environment.theme === 'candy' && '🍬'}
        </span>
        <div className="absolute bottom-2 right-2 bg-white/80 rounded-full px-2 py-0.5 text-xs font-bold text-charcoal flex items-center gap-1">
          <Box className="w-3 h-3" />
          {world.objects.length}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-charcoal truncate">{world.name}</h3>
        <p className="text-sm text-charcoal-light flex items-center gap-1 mt-1">
          <span>{getAvatarEmoji(world.avatarId)}</span>
          <span>{world.authorName}</span>
        </p>
        <p className="text-xs text-charcoal-light/60 mt-1">
          {new Date(world.updatedAt).toLocaleDateString()}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Link href={`/play/${world.id}`} className="flex-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="tap-target w-full flex items-center justify-center gap-1.5 py-2 bg-mint text-white font-bold text-sm rounded-xl cursor-pointer transition-colors hover:bg-mint-light"
            >
              <Play className="w-4 h-4" /> Play
            </motion.button>
          </Link>
          <Link href={`/create?load=${world.id}`} className="flex-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="tap-target w-full flex items-center justify-center gap-1.5 py-2 bg-sky text-white font-bold text-sm rounded-xl cursor-pointer transition-colors hover:bg-sky-light"
            >
              <Pencil className="w-4 h-4" /> Edit
            </motion.button>
          </Link>
          {onDelete && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(world.id)}
              className="tap-target w-10 flex items-center justify-center py-2 text-charcoal-light hover:text-coral rounded-xl cursor-pointer transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
