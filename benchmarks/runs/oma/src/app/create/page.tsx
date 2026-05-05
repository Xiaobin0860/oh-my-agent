'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, Blocks, Mountain, Play, Square, Check,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Toolbar } from '@/components/ui/toolbar';
import { ObjectPalette } from '@/components/canvas/object-palette';
import { EnvironmentPicker } from '@/components/ui/environment-picker';
import { ColorPicker } from '@/components/ui/color-picker';
import { CompanionPanel } from '@/components/ai/companion-panel';
import { useWorldStore } from '@/lib/store/world-store';
import { useUserStore } from '@/lib/store/user-store';
import { saveWorld, loadWorld } from '@/lib/db/storage';
import { getAvatarEmoji } from '@/components/ui/avatar-picker';

// Dynamic import for 3D canvas to avoid SSR issues
const WorldCanvas = dynamic(
  () => import('@/components/canvas/world-canvas').then((m) => ({ default: m.WorldCanvas })),
  { ssr: false, loading: () => <div className="w-full h-full bg-sky-light/30 flex items-center justify-center"><span className="text-4xl animate-pulse">🌍</span></div> }
);

function CreatePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profile = useUserStore((s) => s.profile);
  const { world, selectedObjectId, tool, isPlaying, createWorld, loadWorld: loadWorldToStore, setWorldName, updateObject, setPlaying } = useWorldStore();

  const [showPalette, setShowPalette] = useState(false);
  const [showEnvPicker, setShowEnvPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');

  // Initialize world
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load profile from localStorage if not in store
    if (!profile) {
      const saved = localStorage.getItem('worldie-user');
      if (saved) {
        try {
          useUserStore.getState().setProfile(JSON.parse(saved));
        } catch {
          router.push('/start');
          return;
        }
      } else {
        router.push('/start');
        return;
      }
    }

    const loadId = searchParams.get('load');
    if (loadId) {
      const existing = loadWorld(loadId);
      if (existing) {
        loadWorldToStore(existing);
        return;
      }
    }

    if (!world) {
      const p = profile || useUserStore.getState().profile;
      createWorld(
        'My World',
        p?.name || 'Creator',
        p?.avatarId || 'star'
      );
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!world) return;
    setSaveStatus('saving');
    saveWorld(world);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [world]);

  const handleNameSubmit = () => {
    if (editName.trim()) {
      setWorldName(editName.trim());
    }
    setIsEditingName(false);
  };

  const selectedObject = world?.objects.find((o) => o.id === selectedObjectId);

  // Show color picker when color tool is active and object is selected
  useEffect(() => {
    setShowColorPicker(tool === 'color' && !!selectedObjectId);
  }, [tool, selectedObjectId]);

  if (!world) return null;

  if (isPlaying) {
    return (
      <div className="w-screen h-screen relative">
        <WorldCanvas />
        <div className="absolute top-6 left-6 z-30">
          <Button
            variant="ghost"
            size="md"
            onClick={() => setPlaying(false)}
            icon={<Square className="w-4 h-4" />}
          >
            Stop Playing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-charcoal">
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <WorldCanvas />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="flex items-center justify-between">
          {/* Left: back + name */}
          <div className="flex items-center gap-3">
            <Link href="/gallery">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="tap-target w-10 h-10 rounded-full glass-panel flex items-center justify-center cursor-pointer shadow-soft"
              >
                <ArrowLeft className="w-5 h-5 text-charcoal" />
              </motion.button>
            </Link>

            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNameSubmit(); if (e.key === 'Escape') setIsEditingName(false); }}
                  onBlur={handleNameSubmit}
                  maxLength={30}
                  className="px-3 py-1.5 rounded-xl bg-white text-charcoal font-bold outline-none ring-2 ring-coral/40 text-sm"
                />
              </div>
            ) : (
              <button
                onClick={() => { setEditName(world.name); setIsEditingName(true); }}
                className="glass-panel px-4 py-2 rounded-xl cursor-pointer hover:bg-white/90 transition-colors"
              >
                <span className="font-bold text-charcoal text-sm">{world.name}</span>
              </button>
            )}
          </div>

          {/* Right: env + play + save */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { setShowEnvPicker(!showEnvPicker); setShowPalette(false); }}
              className="tap-target w-10 h-10 rounded-full glass-panel flex items-center justify-center cursor-pointer shadow-soft"
              title="Environment"
            >
              <Mountain className="w-5 h-5 text-charcoal" />
            </motion.button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPlaying(true)}
              icon={<Play className="w-4 h-4" />}
            >
              Play
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              icon={saveStatus === 'saved' ? <Check className="w-4 h-4 text-green-600" /> : <Save className="w-4 h-4" />}
            >
              {saveStatus === 'saved' ? 'Saved!' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Left: Add Objects Button + Palette */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
        <div className="flex flex-col items-start gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { setShowPalette(!showPalette); setShowEnvPicker(false); }}
            className={`tap-target w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer shadow-soft transition-colors ${showPalette ? 'bg-coral text-white' : 'glass-panel text-charcoal'}`}
            title="Add objects"
          >
            <Blocks className="w-6 h-6" />
          </motion.button>

          <AnimatePresence>
            {showPalette && (
              <motion.div
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.9 }}
                className="w-64"
              >
                <ObjectPalette onClose={() => setShowPalette(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Environment Picker Dropdown */}
      <AnimatePresence>
        {showEnvPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 right-4 z-30 w-72"
          >
            <EnvironmentPicker onClose={() => setShowEnvPicker(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom: Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <Toolbar />
      </div>

      {/* Color Picker (above toolbar when color tool active) */}
      <AnimatePresence>
        {showColorPicker && selectedObject && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 glass-panel rounded-[var(--radius-panel)] p-4 shadow-soft"
          >
            <p className="text-xs font-bold text-charcoal-light mb-2 text-center">
              Color for {selectedObject.name}
            </p>
            <ColorPicker
              selected={selectedObject.color}
              onSelect={(color) => updateObject(selectedObject.id, { color })}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Object Info */}
      <AnimatePresence>
        {selectedObject && tool !== 'color' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 glass-panel rounded-xl px-4 py-2 shadow-soft"
          >
            <p className="text-sm font-bold text-charcoal text-center">{selectedObject.name}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Companion */}
      <CompanionPanel />
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-cream flex items-center justify-center"><span className="text-4xl animate-pulse">🌍</span></div>}>
      <CreatePageInner />
    </Suspense>
  );
}
