
import { PlayerState, EnemyState } from '../shared/types';
import { LEVEL_XP } from '../shared/constants';
import { DataLoader } from '../core/DataLoader';
import { EventBus } from '../core/EventBus';

export class XPSystem {
  private eventBus: EventBus;
  private players: Record<string, PlayerState>;

  constructor(eventBus: EventBus, players: Record<string, PlayerState>) {
      this.eventBus = eventBus;
      this.players = players;

      this.eventBus.on('enemy_killed', this.onEnemyKilled.bind(this));
      this.eventBus.on('quest_completed', this.onQuestCompleted.bind(this));
  }

  public getXPForEnemy(enemyType: string, isBoss: boolean): number {
    const def = DataLoader.getEnemyDef(enemyType, isBoss);
    return def ? def.xpReward : 50;
  }

  private onEnemyKilled(payload: { enemyType: string, isBoss: boolean, killerId: string }) {
      const player = this.players[payload.killerId];
      if (!player) return;
      
      const amount = this.getXPForEnemy(payload.enemyType, payload.isBoss);
      this.awardXP(player, amount);
  }

  private onQuestCompleted(payload: { playerId: string, rewardXP: number }) {
      const player = this.players[payload.playerId];
      if (!player) return;
      this.awardXP(player, payload.rewardXP);
  }

  public awardXP(player: PlayerState, amount: number) {
    player.xp += amount;
    this.eventBus.emit('xp_gained', { playerId: player.id, amount });

    while (player.xp >= player.maxXP) {
        player.xp -= player.maxXP;
        player.level++;

        // Determine next level requirement
        if (player.level < LEVEL_XP.length) {
            player.maxXP = LEVEL_XP[player.level];
        } else {
            // Procedural scaling for levels beyond config
            // Previous max + 20% + flat 2000
            player.maxXP = Math.floor(player.maxXP * 1.2) + 2000;
        }
        
        // Stat increase
        const statMult = player.level > 10 ? 2 : 1;
        player.maxHealth += 50 * statMult;
        player.maxMana += 50 * statMult;
        player.health = player.maxHealth;
        player.mana = player.maxMana;

        this.eventBus.emit('level_up', { playerId: player.id, level: player.level });
    }
  }
}
