import { World } from '@/types/world';

const WORLDS_KEY = 'worldie-worlds';

export function saveWorld(world: World): void {
  const worlds = loadAllWorlds();
  const index = worlds.findIndex((w) => w.id === world.id);
  if (index >= 0) {
    worlds[index] = world;
  } else {
    worlds.push(world);
  }
  localStorage.setItem(WORLDS_KEY, JSON.stringify(worlds));
}

export function loadWorld(id: string): World | null {
  const worlds = loadAllWorlds();
  return worlds.find((w) => w.id === id) || null;
}

export function loadAllWorlds(): World[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(WORLDS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function deleteWorld(id: string): void {
  const worlds = loadAllWorlds().filter((w) => w.id !== id);
  localStorage.setItem(WORLDS_KEY, JSON.stringify(worlds));
}
