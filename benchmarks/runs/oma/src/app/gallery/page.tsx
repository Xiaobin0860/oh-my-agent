'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WorldCard } from '@/components/gallery/world-card';
import { loadAllWorlds, deleteWorld } from '@/lib/db/storage';
import type { World } from '@/types/world';

export default function GalleryPage() {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setWorlds(loadAllWorlds());
  }, []);

  const handleDelete = (id: string) => {
    deleteWorld(id);
    setWorlds(loadAllWorlds());
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-panel border-b border-white/30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="tap-target w-10 h-10 rounded-full bg-white flex items-center justify-center cursor-pointer shadow-soft"
              >
                <ArrowLeft className="w-5 h-5 text-charcoal" />
              </motion.button>
            </Link>
            <h1 className="text-2xl font-extrabold text-charcoal">My Worlds</h1>
          </div>
          <Link href="/create">
            <Button size="md" icon={<Plus className="w-5 h-5" />}>New World</Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {worlds.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <FolderOpen className="w-16 h-16 text-charcoal-light/30 mb-4" />
            <h2 className="text-xl font-bold text-charcoal mb-2">No worlds yet!</h2>
            <p className="text-charcoal-light mb-6">Create your first world and it will show up here.</p>
            <Link href="/create">
              <Button size="lg" icon={<Plus className="w-5 h-5" />}>Create Your First World</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {worlds.map((world, i) => (
              <motion.div
                key={world.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <WorldCard world={world} onDelete={handleDelete} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
