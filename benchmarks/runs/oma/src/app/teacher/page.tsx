'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, BookOpen, Users, Sparkles, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { loadAllWorlds } from '@/lib/db/storage';
import { getAvatarEmoji } from '@/components/ui/avatar-picker';
import type { World } from '@/types/world';

interface TeacherPrompt {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

const PROMPTS_KEY = 'worldie-teacher-prompts';

function loadPrompts(): TeacherPrompt[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(PROMPTS_KEY) || '[]'); } catch { return []; }
}

function savePrompts(prompts: TeacherPrompt[]) {
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts));
}

export default function TeacherPage() {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [prompts, setPrompts] = useState<TeacherPrompt[]>([]);
  const [showNewPrompt, setShowNewPrompt] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setWorlds(loadAllWorlds());
    setPrompts(loadPrompts());
  }, []);

  const handleAddPrompt = () => {
    if (!newTitle.trim()) return;
    const prompt: TeacherPrompt = {
      id: Math.random().toString(36).substring(2, 12),
      title: newTitle.trim(),
      description: newDesc.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...prompts, prompt];
    setPrompts(updated);
    savePrompts(updated);
    setNewTitle('');
    setNewDesc('');
    setShowNewPrompt(false);
  };

  const handleDeletePrompt = (id: string) => {
    const updated = prompts.filter((p) => p.id !== id);
    setPrompts(updated);
    savePrompts(updated);
  };

  if (!mounted) return null;

  // Stats
  const totalWorlds = worlds.length;
  const uniqueCreators = new Set(worlds.map((w) => w.authorName)).size;
  const totalObjects = worlds.reduce((sum, w) => sum + w.objects.length, 0);
  const themeCounts = worlds.reduce((acc, w) => {
    acc[w.environment.theme] = (acc[w.environment.theme] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topTheme = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-panel border-b border-white/30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="tap-target w-10 h-10 rounded-full bg-white flex items-center justify-center cursor-pointer shadow-soft"
            >
              <ArrowLeft className="w-5 h-5 text-charcoal" />
            </motion.button>
          </Link>
          <h1 className="text-2xl font-extrabold text-charcoal">Teacher Dashboard</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Worlds Created', value: totalWorlds, icon: BookOpen, color: 'bg-sky' },
            { label: 'Creators', value: uniqueCreators, icon: Users, color: 'bg-mint' },
            { label: 'Total Objects', value: totalObjects, icon: Sparkles, color: 'bg-sunshine' },
            { label: 'Top Theme', value: topTheme ? topTheme[0] : '—', icon: BookOpen, color: 'bg-lavender' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-[var(--radius-card)] shadow-soft p-5 text-center">
              <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-extrabold text-charcoal">{stat.value}</p>
              <p className="text-xs text-charcoal-light mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Assignment Prompts */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-charcoal">Assignment Prompts</h2>
            <Button size="sm" onClick={() => setShowNewPrompt(true)} icon={<Plus className="w-4 h-4" />}>
              New Prompt
            </Button>
          </div>

          {showNewPrompt && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[var(--radius-card)] shadow-soft p-5 mb-4"
            >
              <input
                autoFocus
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Prompt title (e.g., 'Build your dream habitat')"
                className="w-full px-4 py-3 rounded-xl bg-cream text-charcoal font-bold outline-none ring-2 ring-transparent focus:ring-coral/30 mb-3"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description or instructions for students..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-cream text-charcoal outline-none ring-2 ring-transparent focus:ring-coral/30 mb-3 resize-none"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowNewPrompt(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddPrompt} disabled={!newTitle.trim()}>Add Prompt</Button>
              </div>
            </motion.div>
          )}

          {prompts.length === 0 && !showNewPrompt ? (
            <p className="text-charcoal-light text-center py-8">No prompts yet. Create one to get started!</p>
          ) : (
            <div className="space-y-3">
              {prompts.map((prompt) => (
                <div key={prompt.id} className="bg-white rounded-[var(--radius-card)] shadow-soft p-5 flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-charcoal">{prompt.title}</h3>
                    {prompt.description && <p className="text-sm text-charcoal-light mt-1">{prompt.description}</p>}
                    <p className="text-xs text-charcoal-light/60 mt-2">{new Date(prompt.createdAt).toLocaleDateString()}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeletePrompt(prompt.id)}
                    className="tap-target text-charcoal-light hover:text-coral cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Student Worlds */}
        <section>
          <h2 className="text-xl font-extrabold text-charcoal mb-4">Student Worlds</h2>
          {worlds.length === 0 ? (
            <p className="text-charcoal-light text-center py-8">No student worlds yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-charcoal/10">
                    <th className="pb-3 text-sm font-bold text-charcoal-light">Creator</th>
                    <th className="pb-3 text-sm font-bold text-charcoal-light">World</th>
                    <th className="pb-3 text-sm font-bold text-charcoal-light">Theme</th>
                    <th className="pb-3 text-sm font-bold text-charcoal-light">Objects</th>
                    <th className="pb-3 text-sm font-bold text-charcoal-light">Last Updated</th>
                    <th className="pb-3 text-sm font-bold text-charcoal-light">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {worlds.map((world) => (
                    <tr key={world.id} className="border-b border-charcoal/5">
                      <td className="py-3 text-sm">
                        <span className="flex items-center gap-1.5">
                          {getAvatarEmoji(world.avatarId)} {world.authorName}
                        </span>
                      </td>
                      <td className="py-3 text-sm font-semibold text-charcoal">{world.name}</td>
                      <td className="py-3 text-sm capitalize text-charcoal-light">{world.environment.theme}</td>
                      <td className="py-3 text-sm text-charcoal-light">{world.objects.length}</td>
                      <td className="py-3 text-sm text-charcoal-light">{new Date(world.updatedAt).toLocaleDateString()}</td>
                      <td className="py-3">
                        <Link href={`/play/${world.id}`}>
                          <span className="text-sm text-coral font-semibold hover:underline cursor-pointer">View</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
