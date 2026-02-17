
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../client/GameEngine';
import { MockSocket } from '../server/MockSocket';
import { GameState, EnemyState, NPCState } from '../shared/types';
import { LEVEL_XP } from '../shared/constants';
import { DataLoader } from '../core/DataLoader';
import { 
    Minimap, 
    PlayerFrame, 
    TargetFrame, 
    ActionBar, 
    QuestTracker, 
    QuestDialog, 
    ChatLog, 
    XPBar,
    DamageVignette
} from './components';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const socketRef = useRef<MockSocket | null>(null);

  // React State for UI
  const [gameState, setGameState] = useState<GameState>({
    localPlayerId: '',
    players: {},
    enemies: {},
    npcs: {},
    chat: [],
  });
  const [target, setTarget] = useState<EnemyState | null>(null);
  const [activeNPC, setActiveNPC] = useState<NPCState | null>(null);
  const [damageVignette, setDamageVignette] = useState(false);
  const prevHealthRef = useRef(100);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Init Networking
    const socket = new MockSocket();
    socketRef.current = socket;

    // 2. Init Game Engine
    const engine = new GameEngine(containerRef.current, socket);
    engineRef.current = engine;
    
    engine.onDamageVignette = (active) => {
        setDamageVignette(active);
        if (active) setTimeout(() => setDamageVignette(false), 400);
    };

    // 3. Setup Listeners
    socket.on('init_world', (data: any) => {
        setGameState(prev => ({ 
            ...prev, 
            localPlayerId: socket.id, 
            players: data.players, 
            enemies: data.enemies,
            npcs: data.npcs
        }));
    });

    socket.on('state_update', (data: any) => {
        engine.updateGameState(data);
        
        setGameState(prev => ({ 
            ...prev, 
            players: data.players, 
            enemies: data.enemies,
            npcs: data.npcs
        }));

        setTarget(prev => {
            if (!prev) return null;
            const updatedEnemy = data.enemies[prev.id];
            if (!updatedEnemy || updatedEnemy.isDead) return null;
            return updatedEnemy;
        });
    });

    socket.on('chat_message', (msg: any) => {
        setGameState(prev => ({...prev, chat: [...prev.chat, msg]}));
    });

    // Handle Engine -> UI events
    engine.onStateUpdate = (event: any) => {
        if (event.type === 'target_selected') {
            const tId = event.id;
            if (!tId) setTarget(null);
            else {
                // @ts-ignore
                const enemy = socketRef.current?.enemies[tId];
                if (enemy) {
                    setTarget(enemy);
                    setActiveNPC(null); 
                }
            }
        } else if (event.type === 'npc_interact') {
            const tId = event.id;
            // @ts-ignore
            const npc = socketRef.current?.npcs[tId];
            if (npc) {
                setActiveNPC(npc);
                setTarget(null);
            }
        }
    };

    socket.emit('join', {
        id: socket.id,
        name: 'Hero',
        position: { x: 0, y: 10, z: 0 },
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
        classType: 'shaman'
    });

    return () => {
        engine.dispose();
        socket.disconnect();
    };
  }, []);

  // Update Navigation Arrow Priority
  useEffect(() => {
    if (!engineRef.current) return;
    const localPlayer = gameState.players[gameState.localPlayerId];
    if (!localPlayer) return;

    let navTarget: {x: number, z: number} | null = null;

    // Priority 1: Current Selection
    if (target && !target.isDead) {
        navTarget = { x: target.position.x, z: target.position.z };
    } else {
        // Priority 2: Quests
        const activeQuest = localPlayer.quests.find(q => q.status === 'active' || q.status === 'ready');
        
        if (activeQuest) {
            if (activeQuest.status === 'ready') {
                    // Point to NPC
                    const npcDef = DataLoader.getAllNPCs().find(n => n.questIds.includes(activeQuest.id));
                    if (npcDef) {
                        const npc = gameState.npcs[npcDef.id];
                        if (npc) navTarget = { x: npc.position.x, z: npc.position.z };
                    }
            } else {
                // Point to nearest enemy of type
                    let minDist = Infinity;
                    Object.values(gameState.enemies).forEach((e: EnemyState) => {
                        if (!e.isDead && e.type === activeQuest.targetEnemyType) {
                            const d = (e.position.x - localPlayer.position.x)**2 + (e.position.z - localPlayer.position.z)**2;
                            if (d < minDist) {
                                minDist = d;
                                navTarget = { x: e.position.x, z: e.position.z };
                            }
                        }
                    });
            }
        }
    }

    engineRef.current.setNavigationTarget(navTarget);
  }, [gameState, target]);

  // UI Actions
  const abilities = DataLoader.getAllAbilities();
  const handleAbility = (slot: number) => {
      if (!engineRef.current || !socketRef.current) return;
      
      const ability = abilities[slot - 1];
      if (ability) {
          engineRef.current.castSpell(ability.id, target?.id || null);
      }
  };

  const handleQuestAction = (action: 'accept' | 'complete', questId: string) => {
      if (!socketRef.current) return;
      if (action === 'accept') {
          socketRef.current.emit('quest_accept', { questId });
      } else {
          socketRef.current.emit('quest_complete', { questId });
      }
      setActiveNPC(null); 
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
        if (e.key === '1') handleAbility(1);
        if (e.key === '2') handleAbility(2);
        if (e.key === '3') handleAbility(3);
        if (e.key === 'Escape') {
            setActiveNPC(null);
            setTarget(null);
        }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [target]);

  const localPlayer = gameState.players[gameState.localPlayerId];

  // Manual Vignette Logic Backup (in case event bus misses or for immediate local updates if we used optimistic UI)
  useEffect(() => {
    if (localPlayer) {
        if (localPlayer.health < prevHealthRef.current) {
            setDamageVignette(true);
            setTimeout(() => setDamageVignette(false), 400);
        }
        prevHealthRef.current = localPlayer.health;
    }
  }, [localPlayer?.health]);

  // Helper to get quests relevant to this NPC for the local player
  const getNpcQuests = () => {
      if (!activeNPC || !localPlayer) return [];
      const relevant: any[] = [];
      activeNPC.questIds.forEach(qId => {
          const pQuest = localPlayer.quests.find(q => q.id === qId);
          if (pQuest) {
              relevant.push(pQuest);
          }
      });
      return relevant;
  };

  return (
    <div className="relative w-full h-full overflow-hidden font-sans select-none">
      <div ref={containerRef} className="absolute inset-0" />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <DamageVignette active={damageVignette} />
        
        <PlayerFrame player={localPlayer} />
        <TargetFrame target={target} />
        
        <QuestDialog 
            npc={activeNPC} 
            quests={getNpcQuests()} 
            onClose={() => setActiveNPC(null)} 
            onAction={handleQuestAction} 
        />

        <QuestTracker player={localPlayer} activeNPC={activeNPC} />
        
        <Minimap gameState={gameState} localPlayerId={gameState.localPlayerId} />

        <ActionBar level={localPlayer?.level || 1} onCast={handleAbility} />

        <ChatLog chat={gameState.chat} />

        {localPlayer && <XPBar xp={localPlayer.xp} maxXP={localPlayer.maxXP} />}

      </div>
    </div>
  );
}
        