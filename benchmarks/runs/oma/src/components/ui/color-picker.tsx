'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const COLORS = [
  { name: 'Coral', value: '#FF6B6B' },
  { name: 'Sky', value: '#87CEEB' },
  { name: 'Mint', value: '#98D8C8' },
  { name: 'Sunshine', value: '#FFD93D' },
  { name: 'Lavender', value: '#C3ACD0' },
  { name: 'Candy', value: '#FFB5E8' },
  { name: 'Orange', value: '#FF9F43' },
  { name: 'Forest', value: '#2D5016' },
  { name: 'Ocean', value: '#1A535C' },
  { name: 'Brown', value: '#D4A574' },
  { name: 'Gray', value: '#95A5A6' },
  { name: 'White', value: '#FFFFFF' },
];

interface ColorPickerProps {
  selected: string;
  onSelect: (color: string) => void;
}

export function ColorPicker({ selected, onSelect }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {COLORS.map((color) => (
        <motion.button
          key={color.value}
          type="button"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(color.value)}
          className="tap-target w-10 h-10 rounded-full border-2 border-white shadow-soft flex items-center justify-center cursor-pointer"
          style={{ backgroundColor: color.value }}
          aria-label={color.name}
          title={color.name}
        >
          {selected === color.value && (
            <Check className="w-5 h-5" style={{ color: isLight(color.value) ? '#2D3436' : '#FFFFFF' }} />
          )}
        </motion.button>
      ))}
    </div>
  );
}

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}
