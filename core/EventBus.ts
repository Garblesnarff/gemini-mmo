
import { Vector3, InventoryState, EquipmentState, StatBonuses, GeneratedLoot, UseEffect } from '../shared/types';

export type EventMap = {
  'enemy_killed': { enemyId: string, enemyType: string, isBoss: boolean, killerId: string, position: Vector3 };
  'enemy_damaged': { enemyId: string, damage: number, health: number, maxHealth: number, attackerId: string };
  'player_damaged': { playerId: string, damage: number, health: number, sourceId: string };
  'quest_updated': { playerId: string, questId: string, status: string, progress: number, required: number, title: string };
  'quest_completed': { playerId: string, questId: string, rewardXP: number, title: string };
  'xp_gained': { playerId: string, amount: number };
  'level_up': { playerId: string, level: number };
  'item_collected': { playerId: string, itemId: string, itemType: string };
  'spell_cast': { casterId: string, spellId: string, targetId: string | null };
  
  // Loot & Items
  'loot_available': GeneratedLoot;
  'loot_collected': { enemyId: string, itemId: string };
  'loot_all_collected': { enemyId: string };
  'inventory_changed': { inventory: InventoryState };
  'equipment_changed': { equipment: EquipmentState, stats: StatBonuses };
  'inventory_full': { itemId: string, itemName: string };
  'item_used': { itemId: string, effect: UseEffect };
};

type EventKey = keyof EventMap;
type Listener<K extends EventKey> = (payload: EventMap[K]) => void;

export class EventBus {
  private listeners: { [K in EventKey]?: Listener<K>[] } = {};

  public on<K extends EventKey>(event: K, listener: Listener<K>) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    (this.listeners[event] as Listener<K>[]).push(listener);
  }

  public off<K extends EventKey>(event: K, listener: Listener<K>) {
    if (!this.listeners[event]) return;
    this.listeners[event] = (this.listeners[event] as Listener<K>[]).filter(l => l !== listener) as any;
  }

  public emit<K extends EventKey>(event: K, payload: EventMap[K]) {
    if (!this.listeners[event]) return;
    (this.listeners[event] as Listener<K>[]).forEach(listener => listener(payload));
  }
}
