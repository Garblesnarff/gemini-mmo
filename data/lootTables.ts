
import { LootTable } from '../shared/types';

export const LOOT_TABLES: Record<string, LootTable> = {
  'boar': {
    guaranteed: [{ itemId: 'junk_fur', chance: 0.8 }],
    rolls: 1,
    random: [
      { itemId: 'food_boar', chance: 0.3 },
      { itemId: 'junk_snout', chance: 0.4 },
      { itemId: 'hands_cloth_1', chance: 0.05 },
      { itemId: 'legs_cloth_1', chance: 0.05 },
      { itemId: 'feet_cloth_1', chance: 0.05 },
      { itemId: 'pot_health_minor', chance: 0.1 }
    ]
  },
  'wolf': {
    guaranteed: [{ itemId: 'junk_fang', chance: 0.7 }],
    rolls: 1,
    random: [
      { itemId: 'food_jerky', chance: 0.25 },
      { itemId: 'junk_fur', chance: 0.3 },
      { itemId: 'head_cloth_1', chance: 0.08 },
      { itemId: 'shoulder_cloth_1', chance: 0.08 },
      { itemId: 'pot_mana_minor', chance: 0.1 }
    ]
  },
  'kodo': {
    guaranteed: [{ itemId: 'junk_bone', chance: 0.6 }],
    rolls: 2,
    random: [
      { itemId: 'chest_cloth_2', chance: 0.03 },
      { itemId: 'hands_cloth_2', chance: 0.03 },
      { itemId: 'legs_cloth_2', chance: 0.03 },
      { itemId: 'pot_health_minor', chance: 0.15 },
      { itemId: 'junk_tusk', chance: 0.2 }
    ]
  },
  'wolf_boss': { // Alpha Wolf
    guaranteed: [{ itemId: 'pot_health_minor', chance: 1.0 }],
    rolls: 3,
    random: [
      { itemId: 'weap_mace_epic', chance: 0.05 }, // The big drop
      { itemId: 'head_cloth_3', chance: 0.1 },
      { itemId: 'chest_cloth_3', chance: 0.1 },
      { itemId: 'feet_cloth_3', chance: 0.1 },
      { itemId: 'pot_mana_minor', chance: 0.3 },
      { itemId: 'trinket_2', chance: 0.15 }
    ]
  }
};
