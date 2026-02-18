
import { ItemDef } from '../shared/types';

export const ITEMS: Record<string, ItemDef> = {
  // --- JUNK ---
  'junk_tusk': { id: 'junk_tusk', name: 'Cracked Tusk', type: 'junk', rarity: 'poor', icon: '🐗', sellValue: 8, stackable: true, maxStack: 20 },
  'junk_fur': { id: 'junk_fur', name: 'Torn Fur Scrap', type: 'junk', rarity: 'poor', icon: '🧶', sellValue: 5, stackable: true, maxStack: 20 },
  'junk_snout': { id: 'junk_snout', name: 'Boar Snout', type: 'junk', rarity: 'poor', icon: '🐽', sellValue: 12, stackable: true, maxStack: 20 },
  'junk_bone': { id: 'junk_bone', name: 'Dusty Bone', type: 'junk', rarity: 'poor', icon: '🦴', sellValue: 4, stackable: true, maxStack: 20 },
  'junk_nail': { id: 'junk_nail', name: 'Bent Nail', type: 'junk', rarity: 'poor', icon: '🔩', sellValue: 2, stackable: true, maxStack: 20 },
  'junk_fang': { id: 'junk_fang', name: 'Wolf Fang', type: 'junk', rarity: 'poor', icon: '🦷', sellValue: 10, stackable: true, maxStack: 20 },

  // --- CONSUMABLES ---
  'pot_health_minor': { 
    id: 'pot_health_minor', name: 'Minor Health Potion', type: 'consumable', rarity: 'common', icon: '🧪', sellValue: 25, stackable: true, maxStack: 5,
    useEffect: { type: 'heal', value: 50 } 
  },
  'pot_mana_minor': { 
    id: 'pot_mana_minor', name: 'Minor Mana Potion', type: 'consumable', rarity: 'common', icon: '🫧', sellValue: 25, stackable: true, maxStack: 5,
    useEffect: { type: 'mana', value: 40 } 
  },
  'food_boar': { 
    id: 'food_boar', name: 'Roasted Boar Meat', type: 'consumable', rarity: 'common', icon: '🍖', sellValue: 15, stackable: true, maxStack: 10,
    useEffect: { type: 'heal', value: 30 } 
  },
  'food_jerky': { 
    id: 'food_jerky', name: 'Tough Jerky', type: 'consumable', rarity: 'poor', icon: '🥩', sellValue: 5, stackable: true, maxStack: 10,
    useEffect: { type: 'heal', value: 20 } 
  },

  // --- HEAD ---
  'head_cloth_1': { 
    id: 'head_cloth_1', name: 'Rough Leather Hood', type: 'equipment', rarity: 'common', icon: '🧢', sellValue: 50, stackable: false, maxStack: 1,
    slot: 'head', levelReq: 1, durability: 30, stats: { armor: 2, stamina: 1 }
  },
  'head_cloth_2': { 
    id: 'head_cloth_2', name: 'Quilted Headband', type: 'equipment', rarity: 'uncommon', icon: '🤕', sellValue: 150, stackable: false, maxStack: 1,
    slot: 'head', levelReq: 3, durability: 45, stats: { armor: 4, stamina: 2, intellect: 1 }
  },
  'head_cloth_3': { 
    id: 'head_cloth_3', name: 'Windchaser Helm', type: 'equipment', rarity: 'rare', icon: '🪖', sellValue: 500, stackable: false, maxStack: 1,
    slot: 'head', levelReq: 5, durability: 60, stats: { armor: 8, stamina: 4, intellect: 3 }, flavor: "Whispers of the wind surround you."
  },

  // --- SHOULDERS ---
  'shoulder_cloth_1': { 
    id: 'shoulder_cloth_1', name: 'Patched Shoulder Pads', type: 'equipment', rarity: 'common', icon: '🧥', sellValue: 40, stackable: false, maxStack: 1,
    slot: 'shoulders', levelReq: 1, durability: 30, stats: { armor: 2 }
  },
  'shoulder_cloth_2': { 
    id: 'shoulder_cloth_2', name: 'Kodo Hide Mantle', type: 'equipment', rarity: 'uncommon', icon: '🥋', sellValue: 120, stackable: false, maxStack: 1,
    slot: 'shoulders', levelReq: 3, durability: 45, stats: { armor: 4, stamina: 2 }
  },
  'shoulder_cloth_3': { 
    id: 'shoulder_cloth_3', name: 'Thunderbluff Epaulets', type: 'equipment', rarity: 'rare', icon: '🛡️', sellValue: 450, stackable: false, maxStack: 1,
    slot: 'shoulders', levelReq: 5, durability: 60, stats: { armor: 7, stamina: 3, intellect: 2 }
  },

  // --- CHEST ---
  'chest_cloth_1': { 
    id: 'chest_cloth_1', name: 'Tattered Cloth Vest', type: 'equipment', rarity: 'common', icon: '👕', sellValue: 60, stackable: false, maxStack: 1,
    slot: 'chest', levelReq: 1, durability: 30, stats: { armor: 3, stamina: 1 }
  },
  'chest_cloth_2': { 
    id: 'chest_cloth_2', name: 'Plainstrider Hide Tunic', type: 'equipment', rarity: 'uncommon', icon: '🎽', sellValue: 180, stackable: false, maxStack: 1,
    slot: 'chest', levelReq: 3, durability: 45, stats: { armor: 6, stamina: 3, intellect: 2 }
  },
  'chest_cloth_3': { 
    id: 'chest_cloth_3', name: 'Ancestral War Robe', type: 'equipment', rarity: 'rare', icon: '👘', sellValue: 600, stackable: false, maxStack: 1,
    slot: 'chest', levelReq: 5, durability: 60, stats: { armor: 12, stamina: 5, intellect: 4 }, flavor: "Worn by the elders."
  },

  // --- HANDS ---
  'hands_cloth_1': { 
    id: 'hands_cloth_1', name: 'Frayed Cloth Gloves', type: 'equipment', rarity: 'common', icon: '🧤', sellValue: 30, stackable: false, maxStack: 1,
    slot: 'hands', levelReq: 1, durability: 30, stats: { armor: 1, intellect: 1 }
  },
  'hands_cloth_2': { 
    id: 'hands_cloth_2', name: 'Tanned Leather Grips', type: 'equipment', rarity: 'uncommon', icon: '🥊', sellValue: 100, stackable: false, maxStack: 1,
    slot: 'hands', levelReq: 3, durability: 45, stats: { armor: 3, intellect: 2 }
  },
  'hands_cloth_3': { 
    id: 'hands_cloth_3', name: 'Earthcaller Gauntlets', type: 'equipment', rarity: 'rare', icon: '🖐️', sellValue: 400, stackable: false, maxStack: 1,
    slot: 'hands', levelReq: 5, durability: 60, stats: { armor: 5, stamina: 2, intellect: 4 }
  },

  // --- LEGS ---
  'legs_cloth_1': { 
    id: 'legs_cloth_1', name: 'Simple Linen Pants', type: 'equipment', rarity: 'common', icon: '👖', sellValue: 50, stackable: false, maxStack: 1,
    slot: 'legs', levelReq: 1, durability: 30, stats: { armor: 2, stamina: 1 }
  },
  'legs_cloth_2': { 
    id: 'legs_cloth_2', name: 'Reinforced Leggings', type: 'equipment', rarity: 'uncommon', icon: '🩳', sellValue: 150, stackable: false, maxStack: 1,
    slot: 'legs', levelReq: 3, durability: 45, stats: { armor: 5, stamina: 3, spirit: 1 }
  },
  'legs_cloth_3': { 
    id: 'legs_cloth_3', name: 'Spiritwalker Kilt', type: 'equipment', rarity: 'rare', icon: '👗', sellValue: 550, stackable: false, maxStack: 1,
    slot: 'legs', levelReq: 5, durability: 60, stats: { armor: 9, stamina: 4, intellect: 3 }
  },

  // --- FEET ---
  'feet_cloth_1': { 
    id: 'feet_cloth_1', name: 'Worn Sandals', type: 'equipment', rarity: 'common', icon: '🩴', sellValue: 35, stackable: false, maxStack: 1,
    slot: 'feet', levelReq: 1, durability: 30, stats: { armor: 1, spirit: 1 }
  },
  'feet_cloth_2': { 
    id: 'feet_cloth_2', name: 'Moccasins of the Plains', type: 'equipment', rarity: 'uncommon', icon: '👞', sellValue: 110, stackable: false, maxStack: 1,
    slot: 'feet', levelReq: 3, durability: 45, stats: { armor: 3, stamina: 1, spirit: 2 }
  },
  'feet_cloth_3': { 
    id: 'feet_cloth_3', name: 'Earthmother\'s Treads', type: 'equipment', rarity: 'rare', icon: '👢', sellValue: 420, stackable: false, maxStack: 1,
    slot: 'feet', levelReq: 5, durability: 60, stats: { armor: 6, stamina: 3, intellect: 3 }
  },

  // --- WEAPON ---
  'weap_staff_1': { 
    id: 'weap_staff_1', name: 'Gnarled Walking Stick', type: 'equipment', rarity: 'common', icon: '🦯', sellValue: 80, stackable: false, maxStack: 1,
    slot: 'weapon', levelReq: 1, durability: 30, stats: { intellect: 2 }
  },
  'weap_staff_2': { 
    id: 'weap_staff_2', name: 'Totemic Staff', type: 'equipment', rarity: 'uncommon', icon: '🎋', sellValue: 250, stackable: false, maxStack: 1,
    slot: 'weapon', levelReq: 3, durability: 45, stats: { intellect: 5, stamina: 2 }
  },
  'weap_staff_3': { 
    id: 'weap_staff_3', name: 'Staff of the Prairie Wind', type: 'equipment', rarity: 'rare', icon: '🥖', sellValue: 700, stackable: false, maxStack: 1,
    slot: 'weapon', levelReq: 5, durability: 60, stats: { intellect: 8, stamina: 4, spirit: 2 }, flavor: "Humming with energy."
  },
  'weap_mace_epic': { 
    id: 'weap_mace_epic', name: 'Elder\'s Earthen Mace', type: 'equipment', rarity: 'epic', icon: '🔨', sellValue: 2500, stackable: false, maxStack: 1,
    slot: 'weapon', levelReq: 7, durability: 80, stats: { intellect: 12, stamina: 6, spirit: 3 }, flavor: "The ground shakes where it strikes."
  },

  // --- OFFHAND ---
  'off_shield_1': { 
    id: 'off_shield_1', name: 'Wooden Buckler', type: 'equipment', rarity: 'common', icon: '🚪', sellValue: 50, stackable: false, maxStack: 1,
    slot: 'offhand', levelReq: 1, durability: 30, stats: { armor: 3 }
  },
  'off_totem_2': { 
    id: 'off_totem_2', name: 'Spirit Totem', type: 'equipment', rarity: 'uncommon', icon: '🗿', sellValue: 150, stackable: false, maxStack: 1,
    slot: 'offhand', levelReq: 3, durability: 45, stats: { armor: 2, intellect: 3 }
  },
  'off_shield_3': { 
    id: 'off_shield_3', name: 'Shield of the Ancestors', type: 'equipment', rarity: 'rare', icon: '🛡️', sellValue: 500, stackable: false, maxStack: 1,
    slot: 'offhand', levelReq: 5, durability: 60, stats: { armor: 8, intellect: 3 }
  },

  // --- TRINKET ---
  'trinket_1': { 
    id: 'trinket_1', name: 'Lucky Rabbit Foot', type: 'equipment', rarity: 'uncommon', icon: '🐇', sellValue: 100, stackable: false, maxStack: 1,
    slot: 'trinket', levelReq: 3, durability: 45, stats: { spirit: 3 }
  },
  'trinket_2': { 
    id: 'trinket_2', name: 'Thunderbluff Talisman', type: 'equipment', rarity: 'rare', icon: '🧿', sellValue: 400, stackable: false, maxStack: 1,
    slot: 'trinket', levelReq: 5, durability: 60, stats: { stamina: 4, intellect: 4 }
  }
};
