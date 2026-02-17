export type Vector3 = { x: number; y: number; z: number };

export interface PlayerState {
  id: string;
  position: Vector3;
  rotation: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  xp: number;
  maxXP: number;
  level: number;
  targetId: string | null;
  name: string;
  isMoving: boolean;
  classType: 'warrior' | 'shaman';
  quests: Quest[]; // Personal quest log
}

export interface EnemyState {
  id: string;
  type: 'boar' | 'wolf' | 'kodo';
  isBoss?: boolean; // New field for Boss identification
  position: Vector3;
  rotation: number;
  health: number;
  maxHealth: number;
  isDead: boolean;
  targetId: string | null; // ID of the player this enemy is attacking
  aiState: 'idle' | 'wander' | 'chase' | 'attack' | 'leash' | 'dead';
  spawnPosition: Vector3; // Anchor for leashing
}

export interface NPCState {
  id: string;
  name: string;
  title: string;
  position: Vector3;
  rotation: number;
  questIds: string[]; // Quests this NPC offers/completes
}

export interface CollectibleState {
    id: string;
    type: 'earthroot';
    position: Vector3;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  objective: string;
  progress: number;
  required: number;
  status: 'available' | 'active' | 'ready' | 'completed';
  rewardXP: number;
  type: 'kill' | 'collect' | 'visit'; // New Quest Types
  targetId?: string; // For Kill (enemy type) or Collect (item type)
  targetEnemyType?: string; // Explicit helper for navigation
  targetCoordinates?: { x: number, z: number, radius: number }; // For Visit
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  type: 'global' | 'system' | 'combat' | 'levelup';
}

export interface GameState {
  localPlayerId: string;
  players: Record<string, PlayerState>;
  enemies: Record<string, EnemyState>;
  npcs: Record<string, NPCState>;
  collectibles: Record<string, CollectibleState>; // New State
  chat: ChatMessage[];
}