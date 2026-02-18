
import { PlayerState, EnemyState } from '../shared/types';
import { DataLoader } from '../core/DataLoader';
import { EventBus } from '../core/EventBus';

export type CombatResult = {
    success: boolean;
    error?: string;
    manaConsumed?: number;
    damage?: number;
    healing?: number;
    targetDead?: boolean;
    targetId?: string;
};

export class CombatSystem {
    private eventBus: EventBus;

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
    }

    public processAbility(player: PlayerState, abilityId: string, targetId: string | null, enemies: Record<string, EnemyState>, players: Record<string, PlayerState>, bonusSpellPower: number = 0): CombatResult {
        const ability = DataLoader.getAbilityDef(abilityId);
        if (!ability) return { success: false, error: 'Unknown ability' };

        if (player.level < ability.minLevel) return { success: false, error: 'Level too low' };
        if (player.mana < ability.mana) return { success: false, error: 'Not enough mana' };

        player.mana -= ability.mana;
        this.eventBus.emit('spell_cast', { casterId: player.id, spellId: abilityId, targetId });

        if (ability.id === 'healing_wave') {
            const healAmount = Math.abs(ability.damage) + bonusSpellPower; // Healing benefits from spell power too
            player.health = Math.min(player.maxHealth, player.health + healAmount);
            return { success: true, healing: healAmount, manaConsumed: ability.mana, targetId: player.id };
        } 
        
        if (targetId && enemies[targetId]) {
            const enemy = enemies[targetId];
            
            // Apply spell power
            const rawDamage = ability.damage + bonusSpellPower;
            enemy.health -= rawDamage;

            this.eventBus.emit('enemy_damaged', { 
                enemyId: enemy.id, 
                damage: rawDamage, 
                health: enemy.health, 
                maxHealth: enemy.maxHealth, 
                attackerId: player.id 
            });

            // Aggro
            if (!enemy.targetId) {
                enemy.targetId = player.id;
                enemy.aiState = 'chase';
            }

            let targetDead = false;
            if (enemy.health <= 0) {
                enemy.health = 0;
                enemy.isDead = true;
                enemy.targetId = null;
                enemy.aiState = 'dead';
                targetDead = true;

                this.eventBus.emit('enemy_killed', {
                    enemyId: enemy.id,
                    enemyType: enemy.type,
                    isBoss: !!enemy.isBoss,
                    killerId: player.id,
                    position: enemy.position
                });
            }

            return { 
                success: true, 
                damage: rawDamage, 
                manaConsumed: ability.mana, 
                targetDead,
                targetId
            };
        }

        return { success: false, error: 'No valid target' };
    }

    public processEnemyAttack(enemy: EnemyState, player: PlayerState, damageReduction: number = 0): number {
        const def = DataLoader.getEnemyDef(enemy.type, enemy.isBoss);
        const rawDmg = def ? def.damage : 5;
        
        // Armor Reduction: dmg * (1 - reduction%)
        const actualDmg = Math.max(1, Math.floor(rawDmg * (1 - damageReduction)));

        player.health = Math.max(0, player.health - actualDmg);
        
        this.eventBus.emit('player_damaged', { 
            playerId: player.id, 
            damage: actualDmg, 
            health: player.health, 
            sourceId: enemy.id 
        });

        return actualDmg;
    }
}
