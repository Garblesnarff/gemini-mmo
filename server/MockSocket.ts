
import { PlayerState, EnemyState, NPCState, CollectibleState, GeneratedLoot } from '../shared/types';
import { MOCK_NAMES, LEVEL_XP } from '../shared/constants';
import { DataLoader } from '../core/DataLoader';
import { CombatSystem } from './CombatSystem';
import { QuestSystem } from './QuestSystem';
import { XPSystem } from './XPSystem';
import { EnemyAI } from './EnemyAI';
import { SpawnManager } from './SpawnManager';
import { LootSystem } from './LootSystem'; // New
import { EventBus } from '../core/EventBus';

type Listener = (...args: any[]) => void;

export class MockSocket {
  private listeners: Record<string, Listener[]> = {};
  public id: string;
  private interval: any;

  // Server state simulation
  public players: Record<string, PlayerState> = {};
  public enemies: Record<string, EnemyState> = {};
  public npcs: Record<string, NPCState> = {};
  public collectibles: Record<string, CollectibleState> = {};
  
  private worldConfig = DataLoader.getWorldConfig();

  // Systems
  private eventBus: EventBus;
  private combatSystem: CombatSystem;
  private questSystem: QuestSystem;
  private xpSystem: XPSystem;
  private enemyAI: EnemyAI;
  private spawnManager: SpawnManager;
  private lootSystem: LootSystem;

  constructor() {
    this.id = 'player_' + Math.random().toString(36).substr(2, 9);
    
    // Initialize Systems
    this.eventBus = new EventBus();
    this.combatSystem = new CombatSystem(this.eventBus);
    this.lootSystem = new LootSystem(this.eventBus); // Init loot
    this.questSystem = new QuestSystem(this.eventBus, this.players);
    this.xpSystem = new XPSystem(this.eventBus, this.players);
    this.enemyAI = new EnemyAI();
    this.spawnManager = new SpawnManager(
        this.eventBus, 
        this.enemies, 
        this.collectibles, 
        this.getTerrainHeight.bind(this)
    );

    // Bind EventBus to Client Broadcasts
    this.setupEventBindings();

    // Initialize World
    this.spawnManager.initializeNPCs(this.npcs);
    this.spawnManager.initializeEnemies();
    this.spawnManager.initializeCollectibles();
    this.spawnRemotePlayers();

    // Start "Server" tick
    this.interval = setInterval(() => this.serverTick(), 100);
  }

  private setupEventBindings() {
      // XP & Levels
      this.eventBus.on('xp_gained', (payload) => {
          if (payload.playerId === this.id) {
              this.trigger('chat_message', { 
                  id: Math.random().toString(), 
                  sender: 'System', 
                  text: `Gained ${payload.amount} XP.`,
                  type: 'system' 
              });
          }
      });
      this.eventBus.on('level_up', (payload) => {
          this.trigger('state_update', { 
              players: this.players, enemies: this.enemies, npcs: this.npcs, collectibles: this.collectibles,
              event: { type: 'levelup', playerId: payload.playerId }
          });
          if (payload.playerId === this.id) {
              this.trigger('chat_message', { 
                  id: Math.random().toString(), 
                  sender: 'System', 
                  text: `LEVEL UP! You reached Level ${payload.level}!`,
                  type: 'levelup' 
              });
          }
      });

      // Quests
      this.eventBus.on('quest_updated', (payload) => {
          if (payload.playerId === this.id) {
               if (payload.status === 'ready') {
                   this.trigger('chat_message', { 
                       id: Math.random().toString(), 
                       sender: 'System', 
                       text: `Quest '${payload.title}' objective complete!`, 
                       type: 'system' 
                    });
               }
          }
      });
      this.eventBus.on('quest_completed', (payload) => {
         // handled via xp_gained listener for xp msg
      });

      this.eventBus.on('player_damaged', (payload) => {
          this.trigger('state_update', { 
              players: this.players, enemies: this.enemies, npcs: this.npcs, collectibles: this.collectibles,
              event: { type: 'enemy_attack', targetId: payload.playerId, damage: payload.damage, sourceId: payload.sourceId }
          });
      });

      this.eventBus.on('item_collected', (payload) => {
          if (payload.playerId === this.id) {
               this.trigger('chat_message', { 
                   id: Math.random().toString(), 
                   sender: 'System', 
                   text: `Collected ${payload.itemType}.`, 
                   type: 'system' 
               });
          }
          this.trigger('state_update', { players: this.players, enemies: this.enemies, npcs: this.npcs, collectibles: this.collectibles });
      });
      
      this.eventBus.on('enemy_killed', (payload) => {
           this.trigger('state_update', { players: this.players, enemies: this.enemies, npcs: this.npcs, collectibles: this.collectibles });
      });

      // LOOT EVENTS
      this.eventBus.on('loot_available', (loot: GeneratedLoot) => {
          if (this.enemies[loot.enemyId]) {
              this.enemies[loot.enemyId].lootable = true;
              this.trigger('state_update', { players: this.players, enemies: this.enemies, npcs: this.npcs, collectibles: this.collectibles });
          }
      });
      this.eventBus.on('loot_collected', (payload) => {
           this.trigger('chat_message', { id: Math.random().toString(), sender: 'System', text: `You receive loot: ${payload.itemId}`, type: 'loot' });
      });
      this.eventBus.on('inventory_full', (payload) => {
           this.trigger('chat_message', { id: Math.random().toString(), sender: 'System', text: `Inventory is full.`, type: 'system' });
      });
      this.eventBus.on('loot_all_collected', (payload) => {
           if (this.enemies[payload.enemyId]) {
               this.enemies[payload.enemyId].lootable = false;
               this.trigger('state_update', { players: this.players, enemies: this.enemies, npcs: this.npcs, collectibles: this.collectibles });
           }
      });
      this.eventBus.on('item_used', (payload) => {
          const itemDef = DataLoader.getItem(payload.itemId);
          this.trigger('chat_message', { id: Math.random().toString(), sender: 'System', text: `You use ${itemDef.name}.`, type: 'system' });
          
          if (payload.effect.type === 'heal') {
               const p = this.players[this.id];
               p.health = Math.min(p.maxHealth, p.health + payload.effect.value);
          } else if (payload.effect.type === 'mana') {
               const p = this.players[this.id];
               p.mana = Math.min(p.maxMana, p.mana + payload.effect.value);
          }
      });
      this.eventBus.on('equipment_changed', () => {
           this.recalcStats();
      });
  }

  private getTerrainHeight(x: number, z: number): number {
      const cx = this.worldConfig.camp.position.x;
      const cz = this.worldConfig.camp.position.z;
      const dist = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);

      const scale1 = 0.02;
      const scale2 = 0.05;
      const h1 = Math.sin(x * scale1) * Math.cos(z * scale1) * 8;
      const h2 = Math.sin(x * scale2 + z * scale1) * 2;
      let height = Math.max(0, h1 + h2);

      if (dist < this.worldConfig.camp.radius) {
          const factor = Math.min(1, dist / this.worldConfig.camp.radius);
          const blend = factor * factor * factor;
          height = height * blend + (this.worldConfig.camp.position.y * (1 - blend));
      }

      return height;
  }

  private spawnRemotePlayers() {
    const count = 3;
    for (let i = 0; i < count; i++) {
      const pid = 'remote_' + i;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 15;
      const x = this.worldConfig.camp.position.x + Math.cos(angle) * r;
      const z = this.worldConfig.camp.position.z + Math.sin(angle) * r;
      
      this.players[pid] = {
        id: pid,
        name: MOCK_NAMES[i % MOCK_NAMES.length],
        position: { x, y: this.getTerrainHeight(x, z), z },
        rotation: 0,
        health: 100,
        maxHealth: 100,
        mana: 100,
        maxMana: 100,
        xp: 0,
        maxXP: LEVEL_XP[1],
        level: 1,
        targetId: null,
        isMoving: false,
        classType: 'warrior',
        quests: [] 
      };
    }
  }

  private recalcStats() {
      const p = this.players[this.id];
      const stats = this.lootSystem.getEquipmentStats();
      
      // Base stats
      const baseHealth = 100 + (p.level - 1) * 50;
      const baseMana = 100 + (p.level - 1) * 50;
      
      p.maxHealth = baseHealth + (stats.stamina * 10);
      p.maxMana = baseMana + (stats.intellect * 15);
      p.health = Math.min(p.health, p.maxHealth);
      p.mana = Math.min(p.mana, p.maxMana);
      
      p.stats = stats;
  }

  public emit(event: string, data: any) {
    if (event === 'join') {
      // @ts-ignore
      const initialQuests = DataLoader.getAllQuests().map(q => ({...q, status: 'available', targetEnemyType: q.targetId}));
      
      this.players[this.id] = {
          ...data,
          quests: initialQuests,
          stats: { stamina: 0, intellect: 0, strength: 0, spirit: 0, armor: 0 }
      };
      
      this.trigger('init_world', { 
          players: this.players, 
          enemies: this.enemies, 
          npcs: this.npcs,
          collectibles: this.collectibles,
          inventory: this.lootSystem.getInventoryState(),
          equipment: this.lootSystem.getEquipmentState()
      });
    }
    
    if (event === 'player_move') {
      if (this.players[this.id]) {
        this.players[this.id].position = data.position;
        this.players[this.id].rotation = data.rotation;
        this.players[this.id].isMoving = data.isMoving;
      }
      this.trigger('state_update', { players: this.players, enemies: this.enemies, npcs: this.npcs, collectibles: this.collectibles });
    }

    if (event === 'quest_accept') {
        this.questSystem.acceptQuest(this.players[this.id], data.questId);
    }

    if (event === 'quest_complete') {
        this.questSystem.completeQuest(this.players[this.id], data.questId);
    }

    if (event === 'collect_item') {
        const itemId = data.itemId;
        const item = this.collectibles[itemId];
        const player = this.players[this.id];

        if (item && player) {
            const dx = player.position.x - item.position.x;
            const dz = player.position.z - item.position.z;
            if (dx*dx + dz*dz < 25) { 
                delete this.collectibles[itemId];
                this.eventBus.emit('item_collected', { playerId: this.id, itemId: itemId, itemType: item.type });
            }
        }
    }

    if (event === 'cast_ability') {
        const player = this.players[this.id];
        if (player) {
            // Apply spell power from stats
            const bonusSpellPower = Math.floor((player.stats?.intellect || 0) / 2);
            
            const result = this.combatSystem.processAbility(player, data.abilityId, data.targetId, this.enemies, this.players, bonusSpellPower);
            if (!result.success && result.error) {
                this.trigger('chat_message', { id: Math.random().toString(), sender: 'System', text: result.error, type: 'system' });
            } else {
                 this.trigger('state_update', { 
                    players: this.players, enemies: this.enemies, npcs: this.npcs, collectibles: this.collectibles,
                    event: { 
                        type: 'spell_cast', 
                        spellId: data.abilityId, 
                        casterId: this.id, 
                        targetId: data.targetId,
                        damage: result.damage || 0,
                        healing: result.healing || 0,
                        targetDead: result.targetDead
                    }
                });
            }
        }
    }

    // LOOT HANDLERS
    if (event === 'request_loot') {
        const enemy = this.enemies[data.enemyId];
        const player = this.players[this.id];
        if (enemy && enemy.isDead && player) {
             const dist = Math.sqrt((enemy.position.x - player.position.x)**2 + (enemy.position.z - player.position.z)**2);
             if (dist < 8) {
                 const loot = this.lootSystem.getPendingLoot(data.enemyId);
                 if (loot) {
                     this.trigger('loot_opened', loot);
                 }
             }
        }
    }
    if (event === 'loot_item') {
        const res = this.lootSystem.lootItem(data.enemyId, data.itemIndex);
        if (res.success) {
            this.trigger('inventory_update', this.lootSystem.getInventoryState());
            const loot = this.lootSystem.getPendingLoot(data.enemyId);
            this.trigger('loot_opened', loot); // Refresh window
        }
    }
    if (event === 'loot_all') {
        this.lootSystem.lootAll(data.enemyId);
        this.trigger('inventory_update', this.lootSystem.getInventoryState());
        
        // Check if anything remains
        const loot = this.lootSystem.getPendingLoot(data.enemyId);
        if (loot) {
            this.trigger('loot_opened', loot); // Update window if items remain
        } else {
             this.trigger('loot_opened', null); // Close if empty
        }
    }
    if (event === 'close_loot') {
        this.lootSystem.lootGold(data.enemyId); // Auto loot gold on close
        this.trigger('inventory_update', this.lootSystem.getInventoryState());
    }
    if (event === 'equip_item') {
        const res = this.lootSystem.equipItem(data.slot);
        if (res.success) {
            this.trigger('inventory_update', this.lootSystem.getInventoryState());
            this.trigger('equipment_update', { equipment: this.lootSystem.getEquipmentState(), stats: this.lootSystem.getEquipmentStats() });
        } else {
            if (res.reason) this.trigger('chat_message', { id: Math.random().toString(), sender: 'System', text: res.reason, type: 'system' });
        }
    }
    if (event === 'unequip_item') {
        const res = this.lootSystem.unequipItem(data.slot);
        if (res.success) {
            this.trigger('inventory_update', this.lootSystem.getInventoryState());
            this.trigger('equipment_update', { equipment: this.lootSystem.getEquipmentState(), stats: this.lootSystem.getEquipmentStats() });
        } else {
             if (res.reason) this.trigger('chat_message', { id: Math.random().toString(), sender: 'System', text: res.reason, type: 'system' });
        }
    }
    if (event === 'use_item') {
        if (this.lootSystem.useItem(data.slot).success) {
            this.trigger('inventory_update', this.lootSystem.getInventoryState());
        }
    }
    if (event === 'move_item') {
        this.lootSystem.moveItem(data.fromSlot, data.toSlot);
        this.trigger('inventory_update', this.lootSystem.getInventoryState());
    }
    if (event === 'destroy_item') {
        this.lootSystem.destroyItem(data.slot);
        this.trigger('inventory_update', this.lootSystem.getInventoryState());
    }
  }

  public on(event: string, callback: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  public off(event: string, callback: Listener) {
    if (!this.listeners[event]) return;
    this.listeners[event].filter(cb => cb !== callback);
  }

  private trigger(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  private serverTick() {
    // Regen
    Object.values(this.players).forEach(p => {
        if (p.mana < p.maxMana) p.mana = Math.min(p.maxMana, p.mana + 1);
        if (p.id === this.id) {
             this.questSystem.checkVisitProgress(p);
        }
    });

    // Remote Players Wander
    Object.values(this.players).forEach(p => {
      if (p.id !== this.id) {
        if (Math.random() > 0.95) p.isMoving = !p.isMoving;
        if (p.isMoving) {
          p.position.x += (Math.random() - 0.5) * 0.8;
          p.position.z += (Math.random() - 0.5) * 0.8;
          if (p.position.x > 80) p.position.x -= 2;
          if (p.position.x < -80) p.position.x += 2;
          p.position.y = this.getTerrainHeight(p.position.x, p.position.z);
          p.rotation += (Math.random() - 0.5) * 0.5;
        }
      }
    });

    // Enemy Logic
    this.enemyAI.tick(this.enemies, this.players, this.getTerrainHeight.bind(this));
    
    // Enemy Attacks
    Object.values(this.enemies).forEach(e => {
        if (this.enemyAI.checkAttack(e, this.players)) {
            // @ts-ignore
            const target = this.players[e.targetId];
            if (target) {
                // Calculate mitigation
                const armor = target.stats?.armor || 0;
                const reduction = armor / (armor + 50);
                this.combatSystem.processEnemyAttack(e, target, reduction);
            }
        }
    });

    this.trigger('state_update', { players: this.players, enemies: this.enemies, npcs: this.npcs, collectibles: this.collectibles });
  }

  public disconnect() {
    clearInterval(this.interval);
  }
}
