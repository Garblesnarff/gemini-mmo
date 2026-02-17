import { EnemyState, CollectibleState, NPCState } from '../shared/types';
import { DataLoader } from '../core/DataLoader';
import { EventBus } from '../core/EventBus';

export class SpawnManager {
    private getTerrainHeight: (x: number, z: number) => number;
    private eventBus: EventBus;
    private enemies: Record<string, EnemyState>;
    private collectibles: Record<string, CollectibleState>;
    private worldConfig = DataLoader.getWorldConfig();

    constructor(
        eventBus: EventBus, 
        enemies: Record<string, EnemyState>, 
        collectibles: Record<string, CollectibleState>,
        getTerrainHeight: (x: number, z: number) => number
    ) {
        this.eventBus = eventBus;
        this.enemies = enemies;
        this.collectibles = collectibles;
        this.getTerrainHeight = getTerrainHeight;

        this.eventBus.on('enemy_killed', this.onEnemyKilled.bind(this));
        this.eventBus.on('item_collected', this.onItemCollected.bind(this));
    }

    public initializeEnemies() {
        // Regular Enemies
        for (let i = 0; i < 25; i++) {
            const id = 'enemy_' + i;
            this.spawnSingleEnemy(id);
        }

        // Boss
        const bossId = 'enemy_boss_alpha';
        const bossX = -60;
        const bossZ = 60;
        const bossDef = DataLoader.getEnemyDef('wolf', true);
        
        if (bossDef) {
            this.enemies[bossId] = {
                id: bossId,
                type: 'wolf',
                isBoss: true,
                position: { x: bossX, y: this.getTerrainHeight(bossX, bossZ), z: bossZ },
                spawnPosition: { x: bossX, y: this.getTerrainHeight(bossX, bossZ), z: bossZ },
                rotation: 0,
                health: bossDef.baseHealth,
                maxHealth: bossDef.baseHealth,
                isDead: false,
                targetId: null,
                aiState: 'idle'
            };
        }
    }

    public spawnSingleEnemy(id: string) {
        let x = 0, z = 0;
        let dist = 0;
        do {
            x = (Math.random() - 0.5) * (this.worldConfig.size * 0.9);
            z = (Math.random() - 0.5) * (this.worldConfig.size * 0.9);
            const dx = x - this.worldConfig.camp.position.x;
            const dz = z - this.worldConfig.camp.position.z;
            dist = Math.sqrt(dx*dx + dz*dz);
        } while (dist < this.worldConfig.camp.radius + 15); 

        const rand = Math.random();
        const type = rand < 0.33 ? 'boar' : rand < 0.66 ? 'wolf' : 'kodo';
        const def = DataLoader.getEnemyDef(type);
        
        const pos = { 
            x: x, 
            y: this.getTerrainHeight(x, z), 
            z: z 
        };

        this.enemies[id] = {
            id,
            // @ts-ignore
            type,
            position: pos,
            spawnPosition: { ...pos },
            rotation: Math.random() * Math.PI * 2,
            health: def?.baseHealth || 100,
            maxHealth: def?.baseHealth || 100,
            isDead: false,
            targetId: null,
            aiState: 'idle'
        };
    }

    public initializeCollectibles() {
        for(let i=0; i<20; i++) {
            const id = 'col_' + i;
            this.spawnSingleCollectible(id);
        }
    }

    public spawnSingleCollectible(id: string) {
        let x = 0, z = 0, dist = 0;
        do {
            x = (Math.random() - 0.5) * (this.worldConfig.size * 0.9);
            z = (Math.random() - 0.5) * (this.worldConfig.size * 0.9);
            const dx = x - this.worldConfig.camp.position.x;
            const dz = z - this.worldConfig.camp.position.z;
            dist = Math.sqrt(dx*dx + dz*dz);
        } while (dist < this.worldConfig.camp.radius + 5);

        this.collectibles[id] = {
            id,
            type: 'earthroot',
            position: { x, y: this.getTerrainHeight(x, z), z }
        };
    }

    public initializeNPCs(npcs: Record<string, NPCState>) {
        DataLoader.getAllNPCs().forEach(def => {
            const x = this.worldConfig.camp.position.x + def.relativePos.x;
            const z = this.worldConfig.camp.position.z + def.relativePos.z;
            const y = this.getTerrainHeight(x, z);
            
            npcs[def.id] = {
                id: def.id,
                name: def.name,
                title: def.title,
                position: { x, y, z },
                rotation: Math.atan2(-def.relativePos.x, -def.relativePos.z), 
                questIds: def.questIds
            };
        });
    }

    private onEnemyKilled(payload: { enemyId: string, isBoss: boolean }) {
        const delay = payload.isBoss ? 30000 : 5000;
        setTimeout(() => {
            if (payload.isBoss) {
                 const enemy = this.enemies[payload.enemyId];
                 if (enemy) {
                     const def = DataLoader.getEnemyDef('wolf', true);
                     enemy.health = def?.baseHealth || 500;
                     enemy.isDead = false;
                     enemy.targetId = null;
                     enemy.aiState = 'idle';
                     enemy.position = { ...enemy.spawnPosition };
                 }
            } else {
                this.spawnSingleEnemy(payload.enemyId);
            }
        }, delay);
    }

    private onItemCollected(payload: { itemId: string }) {
        setTimeout(() => {
            this.spawnSingleCollectible(payload.itemId);
        }, 10000);
    }
}