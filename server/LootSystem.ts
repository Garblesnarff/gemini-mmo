
import { EventBus } from '../core/EventBus';
import { DataLoader } from '../core/DataLoader';
import { InventorySlot, ItemSlot, GeneratedLoot, StatBonuses, InventoryState, EquipmentState, UseEffect } from '../shared/types';

export class LootSystem {
  private inventory: (InventorySlot | null)[];      // 20 bag slots
  private equipment: Record<ItemSlot, InventorySlot | null>;
  private pendingLoot: Map<string, GeneratedLoot>; // enemyId -> loot
  private gold: number;  // in copper
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.inventory = new Array(20).fill(null);
    this.equipment = {
        head: null, shoulders: null, chest: null, hands: null, legs: null, feet: null, 
        weapon: null, offhand: null, trinket: null
    };
    this.pendingLoot = new Map();
    this.gold = 0;

    // Listen for kills to generate loot
    this.eventBus.on('enemy_killed', (payload) => {
        this.generateLoot(payload.enemyId, payload.enemyType, payload.isBoss ? 'wolf_boss' : payload.enemyType);
    });
  }

  public generateLoot(enemyId: string, enemyName: string, enemyType: string): GeneratedLoot {
      const table = DataLoader.getLootTable(enemyType);
      const items: Array<{itemId: string, quantity: number}> = [];
      const enemyDef = DataLoader.getEnemyDef(enemyType, enemyType === 'wolf_boss');
      
      // Guaranteed Drops
      table.guaranteed.forEach(drop => {
          if (Math.random() <= drop.chance) {
              const qty = Math.floor(Math.random() * ((drop.maxQty || 1) - (drop.minQty || 1) + 1)) + (drop.minQty || 1);
              items.push({ itemId: drop.itemId, quantity: qty });
          }
      });

      // Random Rolls
      for(let i=0; i<table.rolls; i++) {
          let rand = Math.random();
          let cumulative = 0;
          for(const drop of table.random) {
              cumulative += drop.chance;
              if (rand <= cumulative) {
                  const qty = Math.floor(Math.random() * ((drop.maxQty || 1) - (drop.minQty || 1) + 1)) + (drop.minQty || 1);
                  // Merge if exists
                  const existing = items.find(i => i.itemId === drop.itemId);
                  if (existing && DataLoader.getItem(existing.itemId).stackable) {
                      existing.quantity += qty;
                  } else {
                      items.push({ itemId: drop.itemId, quantity: qty });
                  }
                  break; 
              }
          }
      }

      // Gold: ~10 copper per level +/- variance
      const level = 5; // Simplified enemy level constant for now
      const gold = Math.floor(level * (Math.random() * 10 + 5));

      const loot: GeneratedLoot = { enemyId, enemyName, items, gold };
      this.pendingLoot.set(enemyId, loot);
      
      this.eventBus.emit('loot_available', loot);
      return loot;
  }

  public getPendingLoot(enemyId: string) {
      return this.pendingLoot.get(enemyId);
  }

  public lootItem(enemyId: string, itemIndex: number): { success: boolean; reason?: string } {
      const loot = this.pendingLoot.get(enemyId);
      if (!loot || itemIndex >= loot.items.length) return { success: false, reason: "Loot not found" };

      const item = loot.items[itemIndex];
      const itemDef = DataLoader.getItem(item.itemId);
      
      // Try to add to inventory
      const remaining = this.addItemToInventory(item.itemId, item.quantity);
      
      if (remaining === 0) {
          // Full success
          this.eventBus.emit('loot_collected', { enemyId, itemId: item.itemId });
          loot.items.splice(itemIndex, 1);
          if (loot.items.length === 0 && loot.gold === 0) {
              this.pendingLoot.delete(enemyId);
              this.eventBus.emit('loot_all_collected', { enemyId });
          }
          return { success: true };
      } else if (remaining < item.quantity) {
           // Partial loot
           item.quantity = remaining;
           this.eventBus.emit('loot_collected', { enemyId, itemId: item.itemId });
           this.eventBus.emit('inventory_full', { itemId: item.itemId, itemName: itemDef.name });
           return { success: true };
      } else {
           this.eventBus.emit('inventory_full', { itemId: item.itemId, itemName: itemDef.name });
           return { success: false, reason: "Inventory Full" };
      }
  }

  public lootGold(enemyId: string): number {
    const loot = this.pendingLoot.get(enemyId);
    if (!loot) return 0;
    const g = loot.gold;
    this.gold += g;
    loot.gold = 0;
    
    if (loot.items.length === 0) {
        this.pendingLoot.delete(enemyId);
        this.eventBus.emit('loot_all_collected', { enemyId });
    }
    
    this.eventBus.emit('inventory_changed', { inventory: this.getInventoryState() });
    return g;
  }

  public lootAll(enemyId: string): { looted: string[], failed: string[] } {
      const loot = this.pendingLoot.get(enemyId);
      if (!loot) return { looted: [], failed: [] };

      this.lootGold(enemyId);

      const looted: string[] = [];
      const failed: string[] = [];

      // Iterate backwards so splicing doesn't mess up indices
      for (let i = loot.items.length - 1; i >= 0; i--) {
          const item = loot.items[i];
          const itemName = DataLoader.getItem(item.itemId).name;
          
          const res = this.lootItem(enemyId, i);
          if (res.success) {
              looted.push(itemName);
          } else {
              failed.push(itemName);
          }
      }
      return { looted, failed };
  }

  private addItemToInventory(itemId: string, quantity: number): number {
      const def = DataLoader.getItem(itemId);
      let remaining = quantity;

      // 1. Stack on existing
      if (def.stackable) {
          for (const slot of this.inventory) {
              if (slot && slot.itemId === itemId && slot.quantity < def.maxStack) {
                  const space = def.maxStack - slot.quantity;
                  const take = Math.min(space, remaining);
                  slot.quantity += take;
                  remaining -= take;
                  if (remaining === 0) break;
              }
          }
      }

      // 2. Fill empty slots
      while (remaining > 0) {
          const emptyIdx = this.inventory.findIndex(s => s === null);
          if (emptyIdx === -1) break; // Full

          const take = Math.min(remaining, def.maxStack);
          this.inventory[emptyIdx] = { 
              itemId, 
              quantity: take, 
              currentDurability: def.durability 
          };
          remaining -= take;
      }

      if (remaining < quantity) {
          this.eventBus.emit('inventory_changed', { inventory: this.getInventoryState() });
      }

      return remaining;
  }

  public equipItem(bagSlot: number, playerLevel: number): { success: boolean, reason?: string } {
      const item = this.inventory[bagSlot];
      if (!item) return { success: false, reason: "No item" };

      const def = DataLoader.getItem(item.itemId);
      if (def.type !== 'equipment' || !def.slot) return { success: false, reason: "Cannot equip that" };

      if (def.levelReq && playerLevel < def.levelReq) {
          return { success: false, reason: `Requires Level ${def.levelReq}` };
      }

      // Swap
      const currentEquip = this.equipment[def.slot];
      
      this.equipment[def.slot] = item;
      this.inventory[bagSlot] = currentEquip; // Could be null, which is fine

      this.eventBus.emit('inventory_changed', { inventory: this.getInventoryState() });
      this.emitEquipmentUpdate();

      return { success: true };
  }

  public unequipItem(slot: ItemSlot): { success: boolean, reason?: string } {
      const item = this.equipment[slot];
      if (!item) return { success: false, reason: "Nothing equipped" };

      // Find bag space
      const emptyIdx = this.inventory.findIndex(s => s === null);
      if (emptyIdx === -1) {
          this.eventBus.emit('inventory_full', { itemId: item.itemId, itemName: DataLoader.getItem(item.itemId).name });
          return { success: false, reason: "Bags full" };
      }

      this.inventory[emptyIdx] = item;
      this.equipment[slot] = null;

      this.eventBus.emit('inventory_changed', { inventory: this.getInventoryState() });
      this.emitEquipmentUpdate();

      return { success: true };
  }

  public useItem(bagSlot: number, playerLevel: number): { success: boolean, effect?: UseEffect, reason?: string } {
      const item = this.inventory[bagSlot];
      if (!item) return { success: false };
      
      const def = DataLoader.getItem(item.itemId);
      if (def.type !== 'consumable' || !def.useEffect) return { success: false };

      if (def.levelReq && playerLevel < def.levelReq) {
          return { success: false, reason: `Requires Level ${def.levelReq}` };
      }

      // Consume
      if (item.quantity > 1) {
          item.quantity--;
      } else {
          this.inventory[bagSlot] = null;
      }

      this.eventBus.emit('inventory_changed', { inventory: this.getInventoryState() });
      this.eventBus.emit('item_used', { itemId: item.itemId, effect: def.useEffect });
      
      return { success: true, effect: def.useEffect };
  }
  
  public destroyItem(bagSlot: number) {
      if (this.inventory[bagSlot]) {
          this.inventory[bagSlot] = null;
          this.eventBus.emit('inventory_changed', { inventory: this.getInventoryState() });
      }
  }

  public moveItem(fromSlot: number, toSlot: number) {
      if (fromSlot < 0 || fromSlot >= 20 || toSlot < 0 || toSlot >= 20) return;
      const temp = this.inventory[toSlot];
      this.inventory[toSlot] = this.inventory[fromSlot];
      this.inventory[fromSlot] = temp;
      this.eventBus.emit('inventory_changed', { inventory: this.getInventoryState() });
  }

  public getEquipmentStats(): StatBonuses {
      const stats: StatBonuses = { stamina: 0, intellect: 0, strength: 0, spirit: 0, armor: 0 };
      
      Object.values(this.equipment).forEach(item => {
          if (item) {
              const def = DataLoader.getItem(item.itemId);
              if (def.stats) {
                  if (def.stats.stamina) stats.stamina += def.stats.stamina;
                  if (def.stats.intellect) stats.intellect += def.stats.intellect;
                  if (def.stats.strength) stats.strength += def.stats.strength;
                  if (def.stats.spirit) stats.spirit += def.stats.spirit;
                  if (def.stats.armor) stats.armor += def.stats.armor;
              }
          }
      });
      return stats;
  }

  public getInventoryState(): InventoryState {
      // Return a copy of the array to ensure React triggers state updates even if mutation happens
      return { slots: [...this.inventory], gold: this.gold };
  }

  public getEquipmentState(): EquipmentState {
      // Return a shallow copy of the object
      return { ...this.equipment } as EquipmentState;
  }

  private emitEquipmentUpdate() {
      this.eventBus.emit('equipment_changed', { 
          equipment: this.getEquipmentState(),
          stats: this.getEquipmentStats()
      });
  }
}
