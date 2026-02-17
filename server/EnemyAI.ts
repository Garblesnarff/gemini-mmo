import { EnemyState, PlayerState } from '../shared/types';
import { DataLoader } from '../core/DataLoader';

export class EnemyAI {
    public tick(enemies: Record<string, EnemyState>, players: Record<string, PlayerState>, getTerrainHeight: (x: number, z: number) => number) {
        Object.values(enemies).forEach(e => {
            if (e.isDead) {
                e.aiState = 'dead';
                return;
            }

            // State Machine
            switch (e.aiState) {
                case 'idle':
                    this.handleIdle(e, players);
                    break;
                case 'wander':
                    this.handleWander(e, getTerrainHeight);
                    break;
                case 'chase':
                    this.handleChase(e, players, getTerrainHeight);
                    break;
                case 'attack':
                    this.handleAttackState(e, players);
                    break;
                case 'leash':
                    this.handleLeash(e, getTerrainHeight);
                    break;
            }

            // Ensure Y is correct if moving
            if (e.aiState !== 'idle' && e.aiState !== 'dead') {
                e.position.y = getTerrainHeight(e.position.x, e.position.z);
            }
        });
    }

    private getDef(e: EnemyState) {
        return DataLoader.getEnemyDef(e.type, e.isBoss);
    }

    private handleIdle(e: EnemyState, players: Record<string, PlayerState>) {
        const def = this.getDef(e);
        // Check Aggro
        const target = this.findTarget(e, players, def?.aggroRange || 5);
        if (target) {
            e.targetId = target.id;
            e.aiState = 'chase';
            return;
        }

        // Random Wander
        if (Math.random() < 0.02) {
            e.aiState = 'wander';
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * (def?.wanderRadius || 5);
            e['targetPos'] = { 
                x: e.spawnPosition.x + Math.cos(angle) * dist,
                z: e.spawnPosition.z + Math.sin(angle) * dist
            };
        }
    }

    private handleWander(e: EnemyState, getTerrainHeight: (x: number, z: number) => number) {
        // @ts-ignore
        const targetPos = e['targetPos'];
        if (!targetPos) {
            e.aiState = 'idle';
            return;
        }

        const dx = targetPos.x - e.position.x;
        const dz = targetPos.z - e.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        
        if (dist < 0.5) {
            e.aiState = 'idle';
            return;
        }

        const speed = 0.2; // Slow wander
        const angle = Math.atan2(dx, dz);
        e.position.x += Math.sin(angle) * speed;
        e.position.z += Math.cos(angle) * speed;
        e.rotation = angle;
    }

    private handleChase(e: EnemyState, players: Record<string, PlayerState>, getTerrainHeight: (x: number, z: number) => number) {
        if (!e.targetId) {
            e.aiState = 'leash';
            return;
        }
        const target = players[e.targetId];
        if (!target) {
            e.targetId = null;
            e.aiState = 'leash';
            return;
        }

        const def = this.getDef(e);

        // Leash Check
        const distToSpawn = Math.sqrt((e.position.x - e.spawnPosition.x)**2 + (e.position.z - e.spawnPosition.z)**2);
        if (distToSpawn > (def?.leashRadius || 30)) {
            e.targetId = null;
            e.aiState = 'leash';
            return;
        }

        const dx = target.position.x - e.position.x;
        const dz = target.position.z - e.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);

        const attackRange = def?.attackRange || 2.0;

        if (dist <= attackRange) {
            e.aiState = 'attack';
        } else {
            const speed = def?.speed || 0.45; 
            const angle = Math.atan2(dx, dz);
            e.position.x += Math.sin(angle) * speed;
            e.position.z += Math.cos(angle) * speed;
            e.rotation = angle;
        }
    }

    private handleAttackState(e: EnemyState, players: Record<string, PlayerState>) {
        if (!e.targetId) {
            e.aiState = 'idle';
            return;
        }
        const target = players[e.targetId];
        if (!target) {
            e.targetId = null;
            e.aiState = 'idle';
            return;
        }

        const def = this.getDef(e);
        const dx = target.position.x - e.position.x;
        const dz = target.position.z - e.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        const attackRange = def?.attackRange || 2.0;

        if (dist > attackRange + 0.5) {
            e.aiState = 'chase';
        } else {
            // Face target
            e.rotation = Math.atan2(dx, dz);
        }
    }

    private handleLeash(e: EnemyState, getTerrainHeight: (x: number, z: number) => number) {
        const dx = e.spawnPosition.x - e.position.x;
        const dz = e.spawnPosition.z - e.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);

        if (dist < 1.0) {
            e.aiState = 'idle';
            e.health = e.maxHealth; // Reset health on leash
        } else {
            const speed = 0.6; // Run back fast
            const angle = Math.atan2(dx, dz);
            e.position.x += Math.sin(angle) * speed;
            e.position.z += Math.cos(angle) * speed;
            e.rotation = angle;
        }
    }

    private findTarget(e: EnemyState, players: Record<string, PlayerState>, radius: number): PlayerState | null {
        let closest = null;
        let minDst = radius;
        
        Object.values(players).forEach(p => {
            const d = Math.sqrt((p.position.x - e.position.x)**2 + (p.position.z - e.position.z)**2);
            if (d < minDst) {
                minDst = d;
                closest = p;
            }
        });
        return closest;
    }

    public checkAttack(enemy: EnemyState, players: Record<string, PlayerState>): boolean {
        if (enemy.aiState !== 'attack' || !enemy.targetId) return false;
        return Math.random() < 0.05; 
    }
}