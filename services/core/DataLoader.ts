import { WORLD_CONFIG } from '../../data/world';
import { ENEMY_DEFINITIONS } from '../../data/enemies';
import { ABILITY_DEFINITIONS } from '../../data/abilities';
import { QUEST_DEFINITIONS } from '../../data/quests';
import { NPC_DEFINITIONS } from '../../data/npcs';

export const DataLoader = {
    getWorldConfig: () => WORLD_CONFIG,

    getEnemyDef: (type: string, isBoss: boolean = false) => {
        if (isBoss && type === 'wolf') return ENEMY_DEFINITIONS.find(e => e.id === 'wolf_boss');
        return ENEMY_DEFINITIONS.find(e => e.id === type) || ENEMY_DEFINITIONS[0];
    },

    getAbilityDef: (id: string) => ABILITY_DEFINITIONS.find(a => a.id === id),
    getAllAbilities: () => ABILITY_DEFINITIONS,

    getQuestDef: (id: string) => QUEST_DEFINITIONS.find(q => q.id === id),
    getAllQuests: () => QUEST_DEFINITIONS,

    getNPCDef: (id: string) => NPC_DEFINITIONS.find(n => n.id === id),
    getAllNPCs: () => NPC_DEFINITIONS,
};