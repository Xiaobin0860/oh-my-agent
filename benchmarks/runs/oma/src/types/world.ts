export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type ObjectType =
  | 'cube' | 'sphere' | 'cylinder' | 'cone' | 'torus'
  | 'tree' | 'house' | 'character' | 'animal' | 'rock' | 'flower' | 'mushroom' | 'crystal' | 'cloud';

export type EnvironmentTheme = 'meadow' | 'ocean' | 'space' | 'desert' | 'forest' | 'snow' | 'candy';

export interface EnvironmentConfig {
  theme: EnvironmentTheme;
  skyColor: string;
  groundColor: string;
  ambientLight: number;
  fogDensity: number;
}

export interface WorldObject {
  id: string;
  type: ObjectType;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  color: string;
  name: string;
}

export interface World {
  id: string;
  name: string;
  authorName: string;
  avatarId: string;
  environment: EnvironmentConfig;
  objects: WorldObject[];
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

export interface AIMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  suggestions?: string[];
  timestamp: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  prompts: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'storytelling' | 'habitat' | 'dreamworld' | 'bookworld' | 'emotion';
}

export interface UserProfile {
  name: string;
  avatarId: string;
  createdWorlds: string[];
}
