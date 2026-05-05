'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AvatarPicker } from '@/components/ui/avatar-picker';
import { useUserStore } from '@/lib/store/user-store';

export default function StartPage() {
  const router = useRouter();
  const setProfile = useUserStore((s) => s.setProfile);
  const [step, setStep] = useState<'name' | 'avatar'>('name');
  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState('star');

  const handleNameSubmit = () => {
    if (name.trim().length >= 1) {
      setStep('avatar');
    }
  };

  const handleStart = () => {
    setProfile({
      name: name.trim(),
      avatarId,
      createdWorlds: [],
    });
    router.push('/create');
  };

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 'name' ? (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="bg-white rounded-[var(--radius-panel)] shadow-soft p-8 text-center"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-5xl mb-4"
              >
                👋
              </motion.div>
              <h1 className="text-3xl font-extrabold text-charcoal mb-2">Welcome!</h1>
              <p className="text-charcoal-light mb-6">What should we call you?</p>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                placeholder="Your name..."
                maxLength={20}
                autoFocus
                className="w-full px-6 py-4 text-xl text-center font-bold text-charcoal bg-cream rounded-2xl outline-none ring-2 ring-transparent focus:ring-coral/40 transition-shadow placeholder:text-charcoal-light/40"
              />

              <div className="mt-6">
                <Button
                  size="lg"
                  onClick={handleNameSubmit}
                  disabled={name.trim().length < 1}
                  icon={<ArrowRight className="w-5 h-5" />}
                >
                  Next
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="avatar"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="bg-white rounded-[var(--radius-panel)] shadow-soft p-8 text-center"
            >
              <h1 className="text-3xl font-extrabold text-charcoal mb-2">
                Hi, {name}!
              </h1>
              <p className="text-charcoal-light mb-6">Pick your buddy!</p>

              <AvatarPicker selected={avatarId} onSelect={setAvatarId} />

              <div className="mt-8 flex gap-3 justify-center">
                <Button variant="ghost" size="md" onClick={() => setStep('name')}>
                  Back
                </Button>
                <Button
                  size="lg"
                  onClick={handleStart}
                  icon={<Sparkles className="w-5 h-5" />}
                >
                  Start Creating!
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
