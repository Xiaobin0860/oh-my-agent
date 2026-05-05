export const SYSTEM_PROMPT = `You are Sparky, a friendly and creative AI companion for children who are building 3D worlds. You help children ages 5-12 explore their imagination.

RULES:
- Keep responses to 1-2 short sentences maximum
- Use simple, warm, encouraging language
- Ask one question at a time
- Never give orders — offer suggestions as options
- Include 1-2 relevant emoji per response
- Never mention violence, scary content, or anything inappropriate for children
- Never ask for personal information (real name, address, school, age)
- Celebrate creativity and effort, not perfection
- Offer 2-3 clickable suggestion chips when appropriate
- If a child seems stuck, offer gentle "what if" prompts
- Respond to what the child has built, not what they should build

PERSONALITY: Warm, curious, playful, encouraging. Like a fun art teacher who loves surprises.`;

export type PromptCategory = 'starter' | 'whatif' | 'story' | 'reflect' | 'challenge';

export interface PromptTemplate {
  category: PromptCategory;
  text: string;
  suggestions?: string[];
}

export const STARTER_PROMPTS: PromptTemplate[] = [
  {
    category: 'starter',
    text: "Hi there! I'm Sparky ✨ What kind of world do you want to build today?",
    suggestions: ['A magical forest', 'An underwater city', 'A space station', 'Surprise me!'],
  },
  {
    category: 'starter',
    text: "Welcome back, friend! 🌟 Ready to create something amazing?",
    suggestions: ['Continue my world', 'Start something new', 'Show me ideas'],
  },
];

export const WHATIF_PROMPTS: PromptTemplate[] = [
  { category: 'whatif', text: "What if everything in your world was tiny? Or GIANT? 🔍", suggestions: ['Make things tiny', 'Make things giant', 'Keep exploring'] },
  { category: 'whatif', text: "What would happen if it started snowing here? ❄️", suggestions: ['Add snow!', 'Change to rain', 'Keep it sunny'] },
  { category: 'whatif', text: "What if your world could float in the sky? ☁️", suggestions: ['Try floating', 'Add clouds', 'Stay grounded'] },
  { category: 'whatif', text: "What if the colors were all opposites? 🎨", suggestions: ['Flip colors', 'Add more colors', 'Keep current'] },
  { category: 'whatif', text: "What if a friendly creature lived here? 🐾", suggestions: ['Add an animal', 'Add a character', 'Think about it'] },
];

export const REFLECTION_PROMPTS: PromptTemplate[] = [
  { category: 'reflect', text: "Your world looks awesome! What feeling does it give you? 💭", suggestions: ['Happy', 'Calm', 'Excited', 'Mysterious'] },
  { category: 'reflect', text: "What's your favorite part of what you built? 🌈" },
  { category: 'reflect', text: "If you could step inside your world, what would you do first? 🚶" },
  { category: 'reflect', text: "What story could happen in this place? 📖", suggestions: ['An adventure', 'A discovery', 'A celebration'] },
];

export const CHALLENGE_PROMPTS: PromptTemplate[] = [
  { category: 'challenge', text: "Mini challenge: Can you build a home for someone who is very small? 🏠", suggestions: ['Try it!', 'Different challenge'] },
  { category: 'challenge', text: "Try this: Build a place that shows the feeling of JOY! 🎉", suggestions: ['Let\'s go!', 'Different challenge'] },
  { category: 'challenge', text: "Challenge: What does a dream look like as a place? 💫", suggestions: ['Build a dream!', 'Different challenge'] },
];

export function getRandomPrompt(category: PromptCategory): PromptTemplate {
  const pools: Record<PromptCategory, PromptTemplate[]> = {
    starter: STARTER_PROMPTS,
    whatif: WHATIF_PROMPTS,
    story: REFLECTION_PROMPTS,
    reflect: REFLECTION_PROMPTS,
    challenge: CHALLENGE_PROMPTS,
  };
  const pool = pools[category];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function buildUserContext(worldName: string, objectCount: number, environment: string, objectTypes: string[]): string {
  const uniqueTypes = [...new Set(objectTypes)];
  return `Current world: "${worldName}" with ${objectCount} objects (${uniqueTypes.join(', ')}) in a ${environment} environment.`;
}
