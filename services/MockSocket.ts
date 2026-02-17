import { PlayerState, EnemyState, NPCState, CollectibleState, Quest, Vector3 } from '../types';
import { MOCK_NAMES, WORLD_SIZE, QUEST_DEFINITIONS, NPCS_DEFINITIONS, CAMP_CONFIG, LEVEL_XP, ABILITIES } from '../constants';

type Listener = (...args: any[]) => void;

export class MockSocket {
  private listeners: Record<string, Listener[]> = {};
  public id: string;
  private interval: any;

  // Server state simulation
  private players: Record<string, PlayerState> = {};
  private enemies: Record<string, EnemyState> = {};
  private npcs: Record<string, NPCState> = {};
  private collectibles: Record<string, CollectibleState> = {};

  constructor() {
    this.id = 'player_' + Math.random().toString(36).substr(2, 9);
    
    // 1. Initialize NPCs
    this.spawnNPCs();

    // 2. Initialize Enemies
    this.spawnEnemies();

    // 3. Initialize Collectibles (Herbs)
    this.spawnCollectibles();

    // 4. Simulate other players
    this.spawnRemotePlayers();

    // Start "Server" tick
    this.interval = setInterval(() => this.serverTick(), 100);
  }

  // Terrain with Flat Camp Area
  private getTerrainHeight(x: number, z: number): number {
      const cx = CAMP_CONFIG.position.x;
      const cz = CAMP_CONFIG.position.z;
      const dist = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);

      const scale1 = 0.02;
      const scale2 = 0.05;
      const h1 = Math.sin(x * scale1) * Math.cos(z * scale1) * 8;
      const h2 = Math.sin(x * scale2 + z * scale1) * 2;
      let height = Math.max(0, h1 + h2);

      if (dist < CAMP_CONFIG.radius) {
          const factor = Math.min(1, dist / CAMP_CONFIG.radius);
          const blend = factor * factor * factor;
          height = height * blend + (CAMP_CONFIG.position.y * (1 - blend));
      }

      return height;
  }

  private spawnNPCs() {
      NPCS_DEFINITIONS.forEach(def => {
          const x = CAMP_CONFIG.position.x + def.relativePos.x;
          const z = CAMP_CONFIG.position.z + def.relativePos.z;
          const y = this.getTerrainHeight(x, z);
          
          this.npcs[def.id] = {
              id: def.id,
              name: def.name,
              title: def.title,
              position: { x, y, z },
              rotation: Math.atan2(-def.relativePos.x, -def.relativePos.z), 
              questIds: def.questIds
          };
      });
  }

  private spawnEnemies() {
    // Regular Enemies
    for (let i = 0; i < 25; i++) {
      const id = 'enemy_' + i;
      this.spawnSingleEnemy(id);
    }

    // Boss: Alpha Wolf
    const bossId = 'enemy_boss_alpha';
    const bossX = -60;
    const bossZ = 60;
    this.enemies[bossId] = {
        id: bossId,
        type: 'wolf',
        isBoss: true,
        position: { x: bossX, y: this.getTerrainHeight(bossX, bossZ), z: bossZ },
        rotation: 0,
        health: 500,
        maxHealth: 500,
        isDead: false,
        targetId: null
    };
  }

  private spawnSingleEnemy(id: string) {
      let x = 0, z = 0;
      let dist = 0;
      do {
          x = (Math.random() - 0.5) * (WORLD_SIZE * 0.9);
          z = (Math.random() - 0.5) * (WORLD_SIZE * 0.9);
          const dx = x - CAMP_CONFIG.position.x;
          const dz = z - CAMP_CONFIG.position.z;
          dist = Math.sqrt(dx*dx + dz*dz);
      } while (dist < CAMP_CONFIG.radius + 15); 

      const rand = Math.random();
      const type = rand < 0.33 ? 'boar' : rand < 0.66 ? 'wolf' : 'kodo';
      
      let maxHp = 80;
      if (type === 'wolf') maxHp = 100;
      if (type === 'kodo') maxHp = 200;

      this.enemies[id] = {
        id,
        // @ts-ignore
        type,
        position: { 
          x: x, 
          y: this.getTerrainHeight(x, z), 
          z: z 
        },
        rotation: Math.random() * Math.PI * 2,
        health: maxHp,
        maxHealth: maxHp,
        isDead: false,
        targetId: null
      };
  }

  private spawnCollectibles() {
      for(let i=0; i<20; i++) {
          const id = 'col_' + i;
          this.spawnSingleCollectible(id);
      }
  }

  private spawnSingleCollectible(id: string) {
      let x = 0, z = 0, dist = 0;
      do {
          x = (Math.random() - 0.5) * (WORLD_SIZE * 0.9);
          z = (Math.random() - 0.5) * (WORLD_SIZE * 0.9);
          const dx = x - CAMP_CONFIG.position.x;
          const dz = z - CAMP_CONFIG.position.z;
          dist = Math.sqrt(dx*dx + dz*dz);
      } while (dist < CAMP_CONFIG.radius + 5);

      this.collectibles[id] = {
          id,
          type: 'earthroot',
          position: { x, y: this.getTerrainHeight(x, z), z }
      };
  }

  private spawnRemotePlayers() {
    const count = 3;
    for (let i = 0; i < count; i++) {
      const pid = 'remote_' + i;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 15;
      const x = CAMP_CONFIG.position.x + Math.cos(angle) * r;
      const z = CAMP_CONFIG.position.z + Math.sin(angle) * r;
      
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

  private awardXP(playerId: string, amount: number) {
      const player = this.players[playerId];
      if (!player) return;

      player.xp += amount;
      this.trigger('chat_message', { 
         id: Math.random().toString(), 
         sender: 'System', 
         text: `Gained ${amount} XP.`,
         type: 'system' 
      });

      // Level Up Logic
      while (player.level < LEVEL_XP.length && player.xp >= player.maxXP) {
          player.xp -= player.maxXP;
          player.level++;
          player.maxXP = LEVEL_XP[player.level] || 999999;
          
          // Restore stats & Increase Cap
          player.maxHealth += 50;
          player.maxMana += 50;
          player.health = player.maxHealth;
          player.mana = player.maxMana;

          this.trigger('chat_message', { 
            id: Math.random().toString(), 
            sender: 'System', 
            text: `LEVEL UP! You reached Level ${player.level}!`,
            type: 'levelup' 
          });

          // Trigger visual in GameEngine
          this.trigger('state_update', { 
              players: this.players, 
              enemies: this.enemies, 
              npcs: this.npcs,
              collectibles: this.collectibles,
              event: { type: 'levelup', playerId: player.id }
          });
      }
  }

  public emit(event: string, data: any) {
    if (event === 'join') {
      // @ts-ignore
      const initialQuests = QUEST_DEFINITIONS.map(q => ({...q, status: 'available'}));
      
      this.players[this.id] = {
          ...data,
          quests: initialQuests
      };
      
      this.trigger('init_world', { 
          players: this.players, 
          enemies: this.enemies,
          npcs: this.npcs,
          collectibles: this.collectibles
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
        const questId = data.questId;
        const player = this.players[this.id];
        if (player) {
            const qIndex = player.quests.findIndex(q => q.id === questId);
            if (qIndex >= 0) {
                player.quests[qIndex].status = 'active';
            }
        }
        this.trigger('state_update', { players: this.players, enemies: this.enemies, npcs: this.npcs, collectibles: this.collectibles });
    }

    if (event === 'quest_complete') {
        const questId = data.questId;
        const player = this.players[this.id];
        if (player) {
            const qIndex = player.quests.findIndex(q => q.id === questId);
            if (qIndex >= 0 && player.quests[qIndex].status === 'ready') {
                player.quests[qIndex].status = 'completed';
                this.awardXP(player.id, player.quests[qIndex].rewardXP);
            }
        }
        this.trigger('state_update', { players: this.players, enemies: this.enemies, npcs: this.npcs, collectibles: this.collectibles });
    }

    if (event === 'collect_item') {
        const itemId = data.itemId;
        const item = this.collectibles[itemId];
        const player = this.players[this.id];

        if (item && player) {
            // Check distance
            const dx = player.position.x - item.position.x;
            const dz = player.position.z - item.position.z;
            if (dx*dx + dz*dz < 25) { // 5m range
                delete this.collectibles[itemId];
                
                this.trigger('chat_message', { 
                    id: Math.random().toString(), 
                    sender: 'System', 
                    text: `Collected ${item.type}.`,
                    type: 'system' 
                });

                // Update Quests
                player.quests.forEach(q => {
                    if (q.status === 'active' && q.type === 'collect' && q.targetId === item.type) {
                        q.progress = Math.min(q.required, q.progress + 1);
                        if (q.progress >= q.required) {
                            q.status = 'ready';
                             this.trigger('chat_message', { 
                                id: Math.random().toString(), 
                                sender: 'System', 
                                text: `Quest '${q.title}' objective complete!`,
                                type: 'system' 
                            });
                        }
                    }
                });

                // Respawn elsewhere
                setTimeout(() => {
                    this.spawnSingleCollectible(itemId);
                    this.trigger('state_update', { players: this.players, enemies: this.enemies, npcs: this.npcs, collectibles: this.collectibles });
                }, 10000);
                
                this.trigger('state_update', { players: this.players, enemies: this.enemies, npcs: this.npcs, collectibles: this.collectibles });
            }
        }
    }

    if (event === 'cast_ability') {
        const { abilityId, targetId } = data;
        const player = this.players[this.id];
        // @ts-ignore
        const ability = Object.values(ABILITIES).find(a => a.id === abilityId);

        if (player && ability) {
            // Check Level & Mana
            if (player.level < ability.minLevel) return;
            if (player.mana < ability.mana) {
                 this.trigger('chat_message', { id: Math.random().toString(), sender: 'System', text: 'Not enough mana!', type: 'system' });
                 return;
            }

            player.mana -= ability.mana;

            if (ability.id === 'healing_wave') {
                player.health = Math.min(player.maxHealth, player.health + Math.abs(ability.damage));
                // Broadcast visual
                 this.trigger('state_update', { 
                    players: this.players, 
                    enemies: this.enemies, 
                    npcs: this.npcs,
                    collectibles: this.collectibles,
                    event: { type: 'spell_cast', spellId: ability.id, casterId: player.id, targetId: player.id }
                });
            } else if (targetId && this.enemies[targetId]) {
                 // Damage Enemy
                 const enemy = this.enemies[targetId];
                 enemy.health -= ability.damage;
                 
                 // Aggro: If enemy doesn't have a target, target the attacker
                 if (!enemy.targetId) {
                     enemy.targetId = player.id;
                 }

                 // Handle Death
                 if (enemy.health <= 0) {
                    enemy.health = 0;
                    enemy.isDead = true;
                    enemy.targetId = null; // Reset aggro on death
                    
                    let xpAmount = 50;
                    if (enemy.type === 'wolf') xpAmount = 80;
                    if (enemy.type === 'kodo') xpAmount = 120;
                    if (enemy.isBoss) xpAmount = 500;
                    
                    this.awardXP(player.id, xpAmount);

                    // Quest Update
                    player.quests.forEach(q => {
                        if (q.status === 'active' && q.type === 'kill') {
                            const isTarget = (q.targetId === enemy.type) || (q.targetId === 'alpha_wolf' && enemy.isBoss);
                            if (isTarget) {
                                q.progress = Math.min(q.required, q.progress + 1);
                                if (q.progress >= q.required) {
                                    q.status = 'ready';
                                    this.trigger('chat_message', { 
                                        id: Math.random().toString(), 
                                        sender: 'System', 
                                        text: `Quest '${q.title}' objective complete!`,
                                        type: 'system' 
                                    });
                                }
                            }
                        }
                    });

                    // Respawn
                    setTimeout(() => {
                        if (this.enemies[targetId]) {
                            // Boss respawn longer
                            if (this.enemies[targetId].isBoss) {
                                this.enemies[targetId].health = 500;
                                this.enemies[targetId].isDead = false;
                                this.enemies[targetId].targetId = null;
                                // Respawn at specific spot
                                this.enemies[targetId].position.x = -60;
                                this.enemies[targetId].position.z = 60;
                            } else {
                                // Random respawn
                                this.spawnSingleEnemy(targetId);
                            }
                        }
                        this.trigger('state_update', { players: this.players, enemies: this.enemies, npcs: this.npcs, collectibles: this.collectibles });
                    }, enemy.isBoss ? 30000 : 5000);
                 }

                 this.trigger('state_update', { 
                    players: this.players, 
                    enemies: this.enemies, 
                    npcs: this.npcs,
                    collectibles: this.collectibles,
                    event: { type: 'spell_cast', spellId: ability.id, casterId: player.id, targetId: targetId }
                });
            }
        }
        this.trigger('state_update', { players: this.players, enemies: this.enemies, npcs: this.npcs, collectibles: this.collectibles });
    }
  }

  public on(event: string, callback: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  public off(event: string, callback: Listener) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  private trigger(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  private serverTick() {
    // Regenerate Mana slowly
    Object.values(this.players).forEach(p => {
        if (p.mana < p.maxMana) p.mana = Math.min(p.maxMana, p.mana + 1);
        
        // CHECK 'VISIT' QUESTS
        if (p.id === this.id) { // Only check for local mainly, but simulates server
            p.quests.forEach(q => {
                if (q.status === 'active' && q.type === 'visit' && q.targetCoordinates) {
                    const dx = p.position.x - q.targetCoordinates.x;
                    const dz = p.position.z - q.targetCoordinates.z;
                    const dist = Math.sqrt(dx*dx + dz*dz);
                    if (dist < q.targetCoordinates.radius) {
                        q.progress = 1;
                        q.status = 'ready';
                        this.trigger('chat_message', { 
                            id: Math.random().toString(), 
                            sender: 'System', 
                            text: `Quest '${q.title}' objective complete!`,
                            type: 'system' 
                        });
                    }
                }
            });
        }
    });

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

    // Enemy AI: Wander or Chase
    Object.values(this.enemies).forEach(e => {
      if (e.isDead) return;

      if (e.targetId) {
          // Chase Logic
          const target = this.players[e.targetId];
          if (target) {
              const dx = target.position.x - e.position.x;
              const dz = target.position.z - e.position.z;
              const dist = Math.sqrt(dx*dx + dz*dz);
              
              if (dist > 30) {
                  // Leash: Player too far
                  e.targetId = null;
              } else if (dist > (e.isBoss ? 4.0 : 2.5)) {
                  // Move towards player
                  const angle = Math.atan2(dx, dz);
                  const speed = 0.4;
                  e.position.x += Math.sin(angle) * speed;
                  e.position.z += Math.cos(angle) * speed;
                  e.position.y = this.getTerrainHeight(e.position.x, e.position.z);
                  e.rotation = angle;
              } else {
                  // Attack Logic
                  if (Math.random() < 0.02) {
                      const dmg = e.isBoss ? 15 : 5;
                      target.health = Math.max(0, target.health - dmg);
                  }
              }
          } else {
              e.targetId = null; // Target disconnected
          }
      } else {
          // Wander Logic
          if (Math.random() > 0.98) {
            e.position.x += (Math.random() - 0.5) * 2;
            e.position.z += (Math.random() - 0.5) * 2;
            e.position.y = this.getTerrainHeight(e.position.x, e.position.z);
            e.rotation = Math.atan2(e.position.x, e.position.z);
          }
      }
    });

    this.trigger('state_update', { players: this.players, enemies: this.enemies, npcs: this.npcs, collectibles: this.collectibles });
  }

  public disconnect() {
    clearInterval(this.interval);
  }
}