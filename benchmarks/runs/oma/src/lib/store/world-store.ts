import { create } from 'zustand';
import { World, WorldObject, EnvironmentConfig, EnvironmentTheme, Vector3 } from '@/types/world';

// Environment presets
const ENVIRONMENT_PRESETS: Record<EnvironmentTheme, EnvironmentConfig> = {
  meadow: { theme: 'meadow', skyColor: '#87CEEB', groundColor: '#90B77D', ambientLight: 0.8, fogDensity: 0.002 },
  ocean: { theme: 'ocean', skyColor: '#1A535C', groundColor: '#4ECDC4', ambientLight: 0.6, fogDensity: 0.005 },
  space: { theme: 'space', skyColor: '#0D1B2A', groundColor: '#1B2838', ambientLight: 0.3, fogDensity: 0.001 },
  desert: { theme: 'desert', skyColor: '#F4A261', groundColor: '#E9C46A', ambientLight: 0.9, fogDensity: 0.003 },
  forest: { theme: 'forest', skyColor: '#606C38', groundColor: '#283618', ambientLight: 0.5, fogDensity: 0.008 },
  snow: { theme: 'snow', skyColor: '#CAF0F8', groundColor: '#E8E8E8', ambientLight: 0.85, fogDensity: 0.004 },
  candy: { theme: 'candy', skyColor: '#FFB5E8', groundColor: '#FF9CEE', ambientLight: 0.75, fogDensity: 0.002 },
};

interface WorldState {
  world: World | null;
  selectedObjectId: string | null;
  isPlaying: boolean;
  tool: 'select' | 'move' | 'rotate' | 'scale' | 'color' | 'delete';

  // Actions
  createWorld: (name: string, authorName: string, avatarId: string) => void;
  loadWorld: (world: World) => void;
  setWorldName: (name: string) => void;

  // Object actions
  addObject: (type: WorldObject['type'], position?: Vector3) => void;
  removeObject: (id: string) => void;
  updateObject: (id: string, updates: Partial<WorldObject>) => void;
  selectObject: (id: string | null) => void;
  duplicateObject: (id: string) => void;

  // Environment
  setEnvironment: (theme: EnvironmentTheme) => void;

  // Tools
  setTool: (tool: WorldState['tool']) => void;

  // Play mode
  setPlaying: (playing: boolean) => void;

  // Undo support
  undoStack: World[];
  pushUndo: () => void;
  undo: () => void;
}

// Default object colors by type
const DEFAULT_COLORS: Record<string, string> = {
  cube: '#FF6B6B',
  sphere: '#87CEEB',
  cylinder: '#FFD93D',
  cone: '#98D8C8',
  torus: '#C3ACD0',
  tree: '#2D5016',
  house: '#D4A574',
  character: '#FFB5E8',
  animal: '#FF9F43',
  rock: '#95A5A6',
  flower: '#FF6B6B',
  mushroom: '#E17055',
  crystal: '#A29BFE',
  cloud: '#FFFFFF',
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 12);
}

function defaultObjectName(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export const useWorldStore = create<WorldState>((set, get) => ({
  world: null,
  selectedObjectId: null,
  isPlaying: false,
  tool: 'select',
  undoStack: [],

  createWorld: (name, authorName, avatarId) => {
    const world: World = {
      id: generateId(),
      name,
      authorName,
      avatarId,
      environment: ENVIRONMENT_PRESETS.meadow,
      objects: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ world, selectedObjectId: null, undoStack: [] });
  },

  loadWorld: (world) => set({ world, selectedObjectId: null, undoStack: [] }),

  setWorldName: (name) => {
    const { world } = get();
    if (!world) return;
    set({ world: { ...world, name, updatedAt: new Date().toISOString() } });
  },

  addObject: (type, position) => {
    const { world } = get();
    if (!world) return;
    get().pushUndo();
    const obj: WorldObject = {
      id: generateId(),
      type,
      position: position || { x: 0, y: 0.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: DEFAULT_COLORS[type] || '#FF6B6B',
      name: defaultObjectName(type),
    };
    set({
      world: {
        ...world,
        objects: [...world.objects, obj],
        updatedAt: new Date().toISOString(),
      },
      selectedObjectId: obj.id,
    });
  },

  removeObject: (id) => {
    const { world } = get();
    if (!world) return;
    get().pushUndo();
    set({
      world: {
        ...world,
        objects: world.objects.filter((o) => o.id !== id),
        updatedAt: new Date().toISOString(),
      },
      selectedObjectId: get().selectedObjectId === id ? null : get().selectedObjectId,
    });
  },

  updateObject: (id, updates) => {
    const { world } = get();
    if (!world) return;
    set({
      world: {
        ...world,
        objects: world.objects.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        updatedAt: new Date().toISOString(),
      },
    });
  },

  selectObject: (id) => set({ selectedObjectId: id }),

  duplicateObject: (id) => {
    const { world } = get();
    if (!world) return;
    const original = world.objects.find((o) => o.id === id);
    if (!original) return;
    get().pushUndo();
    const copy: WorldObject = {
      ...original,
      id: generateId(),
      name: `${original.name} Copy`,
      position: {
        x: original.position.x + 1,
        y: original.position.y,
        z: original.position.z,
      },
    };
    set({
      world: {
        ...world,
        objects: [...world.objects, copy],
        updatedAt: new Date().toISOString(),
      },
      selectedObjectId: copy.id,
    });
  },

  setEnvironment: (theme) => {
    const { world } = get();
    if (!world) return;
    get().pushUndo();
    set({
      world: {
        ...world,
        environment: ENVIRONMENT_PRESETS[theme],
        updatedAt: new Date().toISOString(),
      },
    });
  },

  setTool: (tool) => set({ tool }),
  setPlaying: (playing) => set({ isPlaying: playing, selectedObjectId: null }),

  pushUndo: () => {
    const { world, undoStack } = get();
    if (!world) return;
    set({ undoStack: [...undoStack.slice(-19), JSON.parse(JSON.stringify(world))] });
  },

  undo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    set({ world: prev, undoStack: undoStack.slice(0, -1), selectedObjectId: null });
  },
}));

export { ENVIRONMENT_PRESETS };
