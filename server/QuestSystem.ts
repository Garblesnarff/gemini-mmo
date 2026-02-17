import { PlayerState, Quest } from '../shared/types';
import { EventBus } from '../core/EventBus';
import { DataLoader } from '../core/DataLoader';

export class QuestSystem {
  private eventBus: EventBus;
  private players: Record<string, PlayerState>;

  constructor(eventBus: EventBus, players: Record<string, PlayerState>) {
      this.eventBus = eventBus;
      this.players = players;

      this.eventBus.on('enemy_killed', this.onEnemyKilled.bind(this));
      this.eventBus.on('item_collected', this.onItemCollected.bind(this));
  }

  public acceptQuest(player: PlayerState, questId: string): boolean {
    const qIndex = player.quests.findIndex(q => q.id === questId);
    if (qIndex >= 0) {
        player.quests[qIndex].status = 'active';
        this.eventBus.emit('quest_updated', { 
            playerId: player.id, 
            questId, 
            status: 'active', 
            progress: player.quests[qIndex].progress, 
            required: player.quests[qIndex].required,
            title: player.quests[qIndex].title
        });
        return true;
    }
    return false;
  }

  public completeQuest(player: PlayerState, questId: string): { success: boolean, rewardXP: number } {
    const qIndex = player.quests.findIndex(q => q.id === questId);
    if (qIndex >= 0 && player.quests[qIndex].status === 'ready') {
        const q = player.quests[qIndex];
        q.status = 'completed';
        this.eventBus.emit('quest_completed', {
            playerId: player.id,
            questId,
            rewardXP: q.rewardXP,
            title: q.title
        });
        return { success: true, rewardXP: q.rewardXP };
    }
    return { success: false, rewardXP: 0 };
  }

  private onEnemyKilled(payload: { enemyId: string, enemyType: string, isBoss: boolean, killerId: string }) {
      const player = this.players[payload.killerId];
      if (!player) return;

      player.quests.forEach(q => {
        if (q.status === 'active' && q.type === 'kill') {
            const isTarget = (q.targetId === payload.enemyType) || (q.targetId === 'alpha_wolf' && payload.isBoss);
            if (isTarget) {
                q.progress = Math.min(q.required, q.progress + 1);
                
                this.eventBus.emit('quest_updated', {
                    playerId: player.id,
                    questId: q.id,
                    status: q.status,
                    progress: q.progress,
                    required: q.required,
                    title: q.title
                });

                if (q.progress >= q.required) {
                    q.status = 'ready';
                    this.eventBus.emit('quest_updated', {
                        playerId: player.id,
                        questId: q.id,
                        status: 'ready',
                        progress: q.progress,
                        required: q.required,
                        title: q.title
                    });
                }
            }
        }
      });
  }

  private onItemCollected(payload: { playerId: string, itemType: string }) {
      const player = this.players[payload.playerId];
      if (!player) return;

      player.quests.forEach(q => {
        if (q.status === 'active' && q.type === 'collect' && q.targetId === payload.itemType) {
            q.progress = Math.min(q.required, q.progress + 1);
            
            this.eventBus.emit('quest_updated', {
                playerId: player.id,
                questId: q.id,
                status: q.status,
                progress: q.progress,
                required: q.required,
                title: q.title
            });

            if (q.progress >= q.required) {
                q.status = 'ready';
                this.eventBus.emit('quest_updated', {
                    playerId: player.id,
                    questId: q.id,
                    status: 'ready',
                    progress: q.progress,
                    required: q.required,
                    title: q.title
                });
            }
        }
    });
  }

  public checkVisitProgress(player: PlayerState): string[] {
      const completedQuests: string[] = [];
      player.quests.forEach(q => {
          if (q.status === 'active' && q.type === 'visit' && q.targetCoordinates) {
              const dx = player.position.x - q.targetCoordinates.x;
              const dz = player.position.z - q.targetCoordinates.z;
              const dist = Math.sqrt(dx*dx + dz*dz);
              if (dist < q.targetCoordinates.radius) {
                  q.progress = 1;
                  q.status = 'ready';
                  
                  this.eventBus.emit('quest_updated', {
                    playerId: player.id,
                    questId: q.id,
                    status: 'ready',
                    progress: 1,
                    required: 1,
                    title: q.title
                  });

                  completedQuests.push(q.title);
              }
          }
      });
      return completedQuests;
  }
}