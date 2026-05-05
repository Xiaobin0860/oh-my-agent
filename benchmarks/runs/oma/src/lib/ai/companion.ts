import { SYSTEM_PROMPT, getRandomPrompt, buildUserContext, PromptCategory } from './prompts';
import { World } from '@/types/world';

export interface CompanionResponse {
  text: string;
  suggestions?: string[];
}

// For MVP: intelligent local responses without API dependency
// To integrate OpenAI, replace generateResponse with an API call
export async function generateResponse(
  userMessage: string,
  world: World | null,
): Promise<CompanionResponse> {
  // Simulate thinking time
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));

  const msg = userMessage.toLowerCase();

  // Context-aware responses
  if (world && world.objects.length === 0) {
    return {
      text: "Your world is a blank canvas! What's the first thing you want to add? 🎨",
      suggestions: ['A tree', 'A house', 'A character', 'Something weird!'],
    };
  }

  if (msg.includes('help') || msg.includes('stuck') || msg.includes("don't know")) {
    const prompt = getRandomPrompt('whatif');
    return { text: prompt.text, suggestions: prompt.suggestions };
  }

  if (msg.includes('done') || msg.includes('finished') || msg.includes('complete')) {
    const prompt = getRandomPrompt('reflect');
    return { text: prompt.text, suggestions: prompt.suggestions };
  }

  if (msg.includes('bored') || msg.includes('challenge') || msg.includes('idea')) {
    const prompt = getRandomPrompt('challenge');
    return { text: prompt.text, suggestions: prompt.suggestions };
  }

  if (msg.includes('story') || msg.includes('adventure') || msg.includes('tale')) {
    return {
      text: "Every world has a story! Who lives in your world and what are they doing today? 📖",
      suggestions: ['An explorer', 'A friendly dragon', 'A lost kitten', 'A wizard'],
    };
  }

  // Default: contextual response based on world state
  if (world && world.objects.length > 0) {
    const types = world.objects.map((o) => o.type);
    const lastType = types[types.length - 1];
    const responses: CompanionResponse[] = [
      { text: `Nice ${lastType}! What goes next to it? 🤔`, suggestions: ['Something tall', 'Something colorful', 'A friend for it'] },
      { text: `I love what you're building! What if you added something that moves? ✨`, suggestions: ['An animal', 'A character', 'Clouds'] },
      { text: `Your ${world.environment.theme} world is coming alive! What's missing? 🌟`, suggestions: ['More nature', 'Buildings', 'Characters'] },
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  return {
    text: "Tell me about the world you imagine! I'll help you build it ✨",
    suggestions: ['A peaceful place', 'An exciting adventure', 'Something silly', 'A mystery'],
  };
}

export function getWelcomeMessage(userName: string): CompanionResponse {
  return {
    text: `Hi ${userName}! I'm Sparky, your creative buddy! ✨ What kind of world shall we build today?`,
    suggestions: ['A magical forest', 'An ocean world', 'Outer space', 'Surprise me!'],
  };
}
