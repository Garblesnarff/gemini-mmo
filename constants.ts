export const WORLD_SIZE = 400;
export const CHUNK_SIZE = 50;

export const CAMP_CONFIG = {
  position: { x: -20, y: 0, z: -20 }, // Y will be calculated by terrain
  radius: 30,
};

export const RUINS_CONFIG = {
    position: { x: 60, y: 0, z: -60 },
    radius: 15
};

export const COLORS = {
  GRASS: 0x3a6b0a,
  GRASS_BLADE: 0x5fa802,
  DIRT: 0x5d4037,
  SKY: 0x87CEEB,
  
  // Character Colors
  PLAYER_FUR: 0x3E2723,
  PLAYER_MANE: 0x000000,
  PLAYER_HORN: 0xEFEBE9,
  PLAYER_CLOTH: 0x8D6E63,
  
  // Enemy Colors
  ENEMY_BOAR: 0x424242,
  ENEMY_BOAR_TUSK: 0xFFECB3,
  ENEMY_KODO: 0x33691E,
  ENEMY_KODO_BELLY: 0xDCEDC8,
  ENEMY_WOLF: 0x757575,
  ENEMY_BOSS: 0x8D6E63, // Reddish Brown

  // Friendly
  NPC_FUR: 0x5D4037,
  NPC_CLOTH: 0xFFB300, // Gold/Orange cloth for NPCs

  // Objects
  RUINS_STONE: 0x78909c,
  HERB_LEAF: 0x76ff03,
  HERB_FLOWER: 0xe040fb,

  // Spells & FX
  SPELL_FIRE: 0xFF5722,
  SPELL_HEAL: 0x00E676,
  SPELL_SHOCK: 0x8BC34A,
  LEVEL_UP: 0xFFD700,
  QUEST_MARKER: 0xFFD700, // Gold !
};

export const LEVEL_XP = [0, 300, 900, 1800, 3000, 5000]; // XP required for level 1, 2, 3, etc.

export const ABILITIES = {
    1: { id: 'fireball', name: 'Fireball', damage: 35, mana: 20, range: 25, minLevel: 1, cooldown: 1000 },
    2: { id: 'earth_shock', name: 'Earth Shock', damage: 25, mana: 15, range: 20, minLevel: 2, cooldown: 4000 },
    3: { id: 'healing_wave', name: 'Healing Wave', damage: -40, mana: 40, range: 0, minLevel: 3, cooldown: 6000 }
};

export const QUEST_DEFINITIONS = [
  {
    id: 'q1',
    title: 'Cleansing the Plains',
    description: 'The boars are becoming aggressive. Thin their numbers to protect the camp.',
    objective: 'Kill Boars',
    progress: 0,
    required: 5,
    status: 'available',
    rewardXP: 150,
    type: 'kill',
    targetId: 'boar'
  },
  {
    id: 'q2',
    title: 'The Howling Pack',
    description: 'Wolves have been spotted stalking our hunters. Drive them back.',
    objective: 'Kill Wolves',
    progress: 0,
    required: 6,
    status: 'available',
    rewardXP: 250,
    type: 'kill',
    targetId: 'wolf'
  },
  {
    id: 'q3',
    title: 'Roots of the Earth',
    description: 'We need Earthroot to heal the wounded warriors. Gather them from the fields.',
    objective: 'Collect Earthroot',
    progress: 0,
    required: 5,
    status: 'available',
    rewardXP: 200,
    type: 'collect',
    targetId: 'earthroot'
  },
  {
    id: 'q4',
    title: 'Scout the Ruins',
    description: 'Strange energies emanate from the ancient ruins to the East. Go investigate.',
    objective: 'Visit Ruins',
    progress: 0,
    required: 1,
    status: 'available',
    rewardXP: 300,
    type: 'visit',
    targetCoordinates: { x: RUINS_CONFIG.position.x, z: RUINS_CONFIG.position.z, radius: 20 }
  },
  {
    id: 'q5',
    title: 'Ancestral Balance',
    description: 'The Kodo population is booming unchecked. We must restore balance.',
    objective: 'Kill Kodos',
    progress: 0,
    required: 5,
    status: 'available',
    rewardXP: 600,
    type: 'kill',
    targetId: 'kodo'
  },
  {
    id: 'q6',
    title: 'The Alpha Threat',
    description: 'A massive Alpha Wolf has been seen leading the pack. Defeat it to scatter them.',
    objective: 'Kill Alpha Wolf',
    progress: 0,
    required: 1,
    status: 'available',
    rewardXP: 800,
    type: 'kill',
    targetId: 'alpha_wolf'
  }
];

export const NPCS_DEFINITIONS = [
  {
    id: 'npc_chief',
    name: 'Chief Earthbinder',
    title: 'Camp Leader',
    relativePos: { x: 0, z: 0 }, // Relative to Camp Center
    questIds: ['q1', 'q6'] // Offers basic and Boss quest
  },
  {
    id: 'npc_hunter',
    name: 'Huntress Swiftwind',
    title: 'Master Hunter',
    relativePos: { x: 8, z: 6 },
    questIds: ['q2', 'q5'] // Offers hunting quests
  },
  {
    id: 'npc_walker',
    name: 'Spirit Walker Greycloud',
    title: 'Mystic',
    relativePos: { x: -8, z: 6 },
    questIds: ['q3', 'q4'] // Offers collection/exploration
  }
];

export const MOCK_NAMES = ['Thunderhoof', 'Earthwalker', 'Spiritrunner', 'Galehorn', 'Bloodhoof', 'Stonerage'];