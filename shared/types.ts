
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
  stats?: StatBonuses; // Computed stats from equipment
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
  lootable?: boolean; // Visual flag for client
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
  type: 'global' | 'system' | 'combat' | 'levelup' | 'loot';
}

// --- ITEM & LOOT SYSTEM ---

export type ItemSlot = 'head' | 'shoulders' | 'chest' | 'hands' | 'legs' | 'feet' | 'weapon' | 'offhand' | 'trinket';
export type ItemRarity = 'poor' | 'common' | 'uncommon' | 'rare' | 'epic';
export type ItemType = 'equipment' | 'consumable' | 'junk' | 'quest';

export interface UseEffect {
    type: 'heal' | 'mana' | 'buff';
    value: number;
    duration?: number;    // seconds, for buffs
}

export interface ItemDef {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  icon: string;           // emoji or short icon key for UI rendering
  flavor?: string;        // italic flavor text
  sellValue: number;      // copper value
  stackable: boolean;
  maxStack: number;

  // Equipment only
  slot?: ItemSlot;
  levelReq?: number;
  durability?: number;    // max durability
  stats?: {
    stamina?: number;     // +health (10 stam = 10 hp)
    intellect?: number;   // +mana (10 int = 15 mana) and +spell power
    strength?: number;    // +melee damage (future)
    spirit?: number;      // +mana regen (future)
    armor?: number;       // +damage reduction %
  };

  // Consumable only
  useEffect?: UseEffect;
}

export interface InventorySlot {
  itemId: string;
  quantity: number;
  currentDurability?: number;
}

export interface LootDrop {
  itemId: string;
  chance: number;   // 0.0 to 1.0
  minQty?: number;  // default 1
  maxQty?: number;  // default 1
}

export interface LootTable {
  guaranteed: LootDrop[];  // always drops (usually junk)
  rolls: number;           // how many times to roll on the random table
  random: LootDrop[];      // each roll picks from this list
}

export interface GeneratedLoot {
  enemyId: string;
  enemyName: string;
  items: Array<{ itemId: string; quantity: number }>;
  gold: number;  // random copper amount based on enemy level
}

export interface StatBonuses {
  stamina: number;
  intellect: number;
  strength: number;
  spirit: number;
  armor: number;
}

export interface InventoryState {
  slots: (InventorySlot | null)[];  // 20 slots, null = empty
  gold: number;
}

export interface EquipmentState {
  head: InventorySlot | null;
  shoulders: InventorySlot | null;
  chest: InventorySlot | null;
  hands: InventorySlot | null;
  legs: InventorySlot | null;
  feet: InventorySlot | null;
  weapon: InventorySlot | null;
  offhand: InventorySlot | null;
  trinket: InventorySlot | null;
}

export interface GameState {
  localPlayerId: string;
  players: Record<string, PlayerState>;
  enemies: Record<string, EnemyState>;
  npcs: Record<string, NPCState>;
  collectibles: Record<string, CollectibleState>;
  chat: ChatMessage[];
  inventory?: InventoryState;
  equipment?: EquipmentState;
  lootWindow?: GeneratedLoot | null; // For UI
}
