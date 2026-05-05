'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, MessageCircle } from 'lucide-react';
import { useAIStore } from '@/lib/store/ai-store';
import { useWorldStore } from '@/lib/store/world-store';
import { generateResponse, getWelcomeMessage } from '@/lib/ai/companion';

export function CompanionPanel() {
  const { messages, isOpen, isLoading, addMessage, setOpen, toggleOpen, setLoading } = useAIStore();
  const world = useWorldStore((s) => s.world);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasGreeted = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !hasGreeted.current && messages.length === 0) {
      hasGreeted.current = true;
      const welcome = getWelcomeMessage(world?.authorName || 'friend');
      addMessage({
        role: 'assistant',
        content: welcome.text,
        suggestions: welcome.suggestions,
      });
    }
  }, [isOpen, messages.length, addMessage, world?.authorName]);

  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message || isLoading) return;

    addMessage({ role: 'user', content: message });
    setInput('');
    setLoading(true);

    try {
      const response = await generateResponse(message, world);
      addMessage({
        role: 'assistant',
        content: response.text,
        suggestions: response.suggestions,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleOpen}
        className={`
          fixed bottom-6 right-6 z-50
          w-16 h-16 rounded-full
          flex items-center justify-center
          shadow-lg cursor-pointer
          transition-colors
          ${isOpen ? 'bg-charcoal text-white' : 'bg-sunshine text-charcoal shadow-glow-coral'}
        `}
        aria-label={isOpen ? 'Close Sparky' : 'Open Sparky'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-7 h-7" />}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 z-40 w-80 max-h-[500px] flex flex-col glass-panel rounded-[var(--radius-panel)] shadow-soft overflow-hidden"
          >
            {/* Header */}
            <div className="bg-sunshine/30 px-4 py-3 flex items-center gap-2 border-b border-white/30">
              <Sparkles className="w-5 h-5 text-coral" />
              <span className="font-bold text-charcoal">Sparky</span>
              <span className="text-xs text-charcoal-light ml-auto">Your Creative Buddy</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[340px]">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.role === 'user' ? '' : ''}`}>
                    <div
                      className={`
                        px-3 py-2 rounded-2xl text-sm
                        ${msg.role === 'user'
                          ? 'bg-coral text-white rounded-br-md'
                          : 'bg-white text-charcoal rounded-bl-md shadow-sm'
                        }
                      `}
                    >
                      {msg.content}
                    </div>
                    {/* Suggestion chips */}
                    {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.suggestions.map((suggestion, i) => (
                          <motion.button
                            key={i}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSend(suggestion)}
                            className="px-3 py-1.5 text-xs font-semibold bg-sky/20 text-ocean-deep rounded-full hover:bg-sky/40 transition-colors cursor-pointer"
                          >
                            {suggestion}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-md shadow-sm">
                    <div className="flex gap-1">
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 bg-coral rounded-full" />
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-sunshine rounded-full" />
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-sky rounded-full" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/30">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tell Sparky what you think..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-white text-sm text-charcoal placeholder:text-charcoal-light/60 outline-none ring-2 ring-transparent focus:ring-coral/30 transition-shadow"
                  disabled={isLoading}
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="tap-target w-10 h-10 rounded-full bg-coral text-white flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
