
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
  ENEMY_BOSS: 0x8D6E63,

  // Friendly
  NPC_FUR: 0x5D4037,
  NPC_CLOTH: 0xFFB300,

  // Objects
  RUINS_STONE: 0x78909c,
  HERB_LEAF: 0x76ff03,
  HERB_FLOWER: 0xe040fb,

  // Spells & FX
  SPELL_FIRE: 0xFF5722,
  SPELL_HEAL: 0x00E676,
  SPELL_SHOCK: 0x8BC34A,
  SPELL_LIGHTNING: 0x00BFFF,
  LEVEL_UP: 0xFFD700,
  QUEST_MARKER: 0xFFD700,
};

// Extended Level Curve (1-20)
export const LEVEL_XP = [
    0,      // Level 0 placeholder
    300,    // Level 1 -> 2
    900,    // Level 2 -> 3
    1800,   // Level 3 -> 4
    3000,   // Level 4 -> 5
    5000,   // Level 5 -> 6
    7500,   // Level 6 -> 7
    10500,  // Level 7 -> 8
    14000,  // Level 8 -> 9
    18000,  // Level 9 -> 10
    22500,  // Level 10 -> 11
    28000,  // Level 11 -> 12
    34000,  // Level 12 -> 13
    41000,  // Level 13 -> 14
    49000,  // Level 14 -> 15
    58000,  // Level 15 -> 16
    68000,  // Level 16 -> 17
    80000,  // Level 17 -> 18
    95000,  // Level 18 -> 19
    115000, // Level 19 -> 20
];

export const MOCK_NAMES = ['Thunderhoof', 'Earthwalker', 'Spiritrunner', 'Galehorn', 'Bloodhoof', 'Stonerage'];
