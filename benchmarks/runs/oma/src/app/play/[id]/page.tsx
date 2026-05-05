'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Pencil, Box, Mountain } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { useWorldStore } from '@/lib/store/world-store';
import { loadWorld } from '@/lib/db/storage';
import { getAvatarEmoji } from '@/components/ui/avatar-picker';

const WorldCanvas = dynamic(
  () => import('@/components/canvas/world-canvas').then((m) => ({ default: m.WorldCanvas })),
  { ssr: false, loading: () => <div className="w-full h-full bg-sky-light/30 flex items-center justify-center"><span className="text-4xl animate-pulse">🌍</span></div> }
);

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const { world, loadWorld: loadWorldToStore, setPlaying } = useWorldStore();
  const [showInfo, setShowInfo] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    if (!id) return;

    const savedWorld = loadWorld(id);
    if (savedWorld) {
      loadWorldToStore(savedWorld);
      setPlaying(true);
    } else {
      router.push('/gallery');
    }

    return () => setPlaying(false);
  }, [params.id]);

  // Auto-hide info after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowInfo(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!world) {
    return (
      <div className="w-screen h-screen bg-cream flex items-center justify-center">
        <span className="text-4xl animate-pulse">🌍</span>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen relative overflow-hidden">
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <WorldCanvas />
      </div>

      {/* Top Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="flex items-center justify-between">
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

            <motion.button
              onClick={() => setShowInfo(!showInfo)}
              className="glass-panel px-4 py-2 rounded-xl cursor-pointer"
            >
              <span className="font-bold text-charcoal text-sm">{world.name}</span>
            </motion.button>
          </div>

          <Link href={`/create?load=${world.id}`}>
            <Button variant="ghost" size="sm" icon={<Pencil className="w-4 h-4" />}>
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* World Info Card */}
      {showInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 glass-panel rounded-[var(--radius-panel)] px-6 py-4 shadow-soft text-center max-w-sm"
        >
          <h2 className="font-extrabold text-charcoal text-lg">{world.name}</h2>
          <p className="text-sm text-charcoal-light mt-1">
            {getAvatarEmoji(world.avatarId)} by {world.authorName}
          </p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-charcoal-light">
            <span className="flex items-center gap-1"><Box className="w-3 h-3" /> {world.objects.length} objects</span>
            <span className="flex items-center gap-1"><Mountain className="w-3 h-3" /> {world.environment.theme}</span>
          </div>
          <p className="text-xs text-charcoal-light/60 mt-2">Drag to look around</p>
        </motion.div>
      )}
    </div>
  );
}
