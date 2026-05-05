'use client';

import { motion } from 'framer-motion';
import { Sparkles, Globe, Palette, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/lib/store/user-store';
import { useEffect, useState } from 'react';

const features = [
  { icon: Globe, title: 'Build Worlds', description: 'Create amazing 3D places from your imagination', color: 'bg-sky' },
  { icon: Sparkles, title: 'AI Buddy', description: 'Sparky helps you think of cool ideas', color: 'bg-sunshine' },
  { icon: Palette, title: 'Be Creative', description: 'Colors, shapes, and environments to explore', color: 'bg-coral' },
  { icon: Users, title: 'Share & Explore', description: 'See what others have built too', color: 'bg-mint' },
];

export default function LandingPage() {
  const profile = useUserStore((s) => s.profile);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load profile from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('worldie-user');
      if (saved) {
        try {
          useUserStore.getState().setProfile(JSON.parse(saved));
        } catch {}
      }
    }
  }, []);

  return (
    <main className="min-h-screen bg-cream flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="text-7xl mb-6"
          >
            🌍
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-charcoal mb-4 tracking-tight">
            Worldie
          </h1>
          <p className="text-xl md:text-2xl text-charcoal-light font-semibold mb-8">
            Build amazing worlds from your imagination!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {mounted && profile ? (
              <Link href="/create">
                <Button size="xl" variant="primary" icon={<Sparkles className="w-6 h-6" />}>
                  Keep Creating!
                </Button>
              </Link>
            ) : (
              <Link href="/start">
                <Button size="xl" variant="primary" icon={<Sparkles className="w-6 h-6" />}>
                  Start Creating
                </Button>
              </Link>
            )}
            <Link href="/gallery">
              <Button size="xl" variant="secondary" icon={<Globe className="w-6 h-6" />}>
                Explore Worlds
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold text-charcoal text-center mb-12">
            What Can You Do?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex flex-col items-center text-center p-6 bg-white rounded-[var(--radius-card)] shadow-soft"
              >
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-charcoal mb-2">{feature.title}</h3>
                <p className="text-sm text-charcoal-light">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-charcoal-light text-sm">
        <p>Made with love for young creators everywhere</p>
      </footer>
    </main>
  );
}
