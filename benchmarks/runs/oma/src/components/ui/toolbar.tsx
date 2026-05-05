'use client';

import { motion } from 'framer-motion';
import { MousePointer2, Move, RotateCw, Maximize2, Palette, Trash2, Undo2 } from 'lucide-react';
import { useWorldStore } from '@/lib/store/world-store';

const TOOLS = [
  { id: 'select' as const, icon: MousePointer2, label: 'Select' },
  { id: 'move' as const, icon: Move, label: 'Move' },
  { id: 'rotate' as const, icon: RotateCw, label: 'Rotate' },
  { id: 'scale' as const, icon: Maximize2, label: 'Resize' },
  { id: 'color' as const, icon: Palette, label: 'Color' },
  { id: 'delete' as const, icon: Trash2, label: 'Delete' },
];

export function Toolbar() {
  const { tool, setTool, undo, undoStack } = useWorldStore();

  return (
    <div className="glass-panel rounded-full px-2 py-2 flex items-center gap-1 shadow-soft">
      {TOOLS.map((t) => (
        <motion.button
          key={t.id}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setTool(t.id)}
          className={`
            tap-target flex flex-col items-center justify-center gap-0.5
            w-14 h-14 rounded-2xl transition-colors cursor-pointer
            ${tool === t.id ? 'bg-coral text-white' : 'text-charcoal hover:bg-white/60'}
          `}
          title={t.label}
        >
          <t.icon className="w-5 h-5" />
          <span className="text-[10px] font-bold">{t.label}</span>
        </motion.button>
      ))}

      <div className="w-px h-8 bg-charcoal/10 mx-1" />

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={undo}
        disabled={undoStack.length === 0}
        className="tap-target flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-2xl text-charcoal hover:bg-white/60 disabled:opacity-30 cursor-pointer transition-colors"
        title="Undo"
      >
        <Undo2 className="w-5 h-5" />
        <span className="text-[10px] font-bold">Undo</span>
      </motion.button>
    </div>
  );
}
