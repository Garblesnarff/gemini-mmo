import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './services/GameEngine';
import { MockSocket } from './services/MockSocket';
import { GameState, PlayerState, EnemyState, NPCState } from './types';
import { User, Sword, Shield, BookOpen, X, Check, MessageCircle, Zap, Heart } from 'lucide-react';
import { LEVEL_XP } from './constants';
import { DataLoader } from './services/core/DataLoader';

const Minimap = ({ gameState, localPlayerId }: { gameState: GameState, localPlayerId: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        
        const player = gameState.players[localPlayerId];
        if (!player) return;

        // Clear
        ctx.clearRect(0, 0, 150, 150);
        
        // Background
        ctx.beginPath();
        ctx.arc(75, 75, 70, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fill();
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Save context for rotation
        ctx.save();
        // Move to center, rotate map opposite to player rotation so player always faces UP
        ctx.translate(75, 75);
        ctx.rotate(player.rotation); 
        
        const scale = 1.5; // Pixels per meter

        // Draw Entities relative to player
        // Enemies
        Object.values(gameState.enemies).forEach(e => {
            if (e.isDead) return;
            const dx = e.position.x - player.position.x;
            const dz = e.position.z - player.position.z;
            
            // Draw if within range
            if (dx*dx + dz*dz < (70/scale)**2) {
                ctx.beginPath();
                ctx.fillStyle = 'red';
                ctx.arc(dx * scale, dz * scale, 3, 0, Math.PI * 2); 
                ctx.fill();
            }
        });
        
        // NPCs
        Object.values(gameState.npcs).forEach(n => {
             const dx = n.position.x - player.position.x;
             const dz = n.position.z - player.position.z;
             if (dx*dx + dz*dz < (70/scale)**2) {
                ctx.beginPath();
                ctx.fillStyle = 'yellow';
                ctx.arc(dx * scale, dz * scale, 4, 0, Math.PI * 2); 
                ctx.fill();
             }
        });
        
        // Camp Fire (approx)
        const dx = -20 - player.position.x;
        const dz = -20 - player.position.z;
         if (dx*dx + dz*dz < (70/scale)**2) {
            ctx.beginPath();
            ctx.fillStyle = 'orange';
            ctx.arc(dx * scale, dz * scale, 5, 0, Math.PI * 2); 
            ctx.fill();
         }

        ctx.restore();

        // Draw Player Arrow (Always center, pointing up)
        ctx.beginPath();
        ctx.moveTo(75, 70); // Tip
        ctx.lineTo(70, 80);
        ctx.lineTo(80, 80);
        ctx.closePath();
        ctx.fillStyle = 'white';
        ctx.fill();

    }, [gameState]);

    return <canvas ref={canvasRef} width={150} height={150} className="rounded-full shadow-lg border border-black/50" />;
}

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

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Init Networking
    const socket = new MockSocket();
    socketRef.current = socket;

    // 2. Init Game Engine
    const engine = new GameEngine(containerRef.current, socket);
    engineRef.current = engine;

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
        
        {/* Top Left: Player Frame */}
        {localPlayer && (
            <div className="absolute top-4 left-4 w-72 bg-black/80 border-2 border-amber-900/50 p-2 rounded text-white pointer-events-auto shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-10 h-10 bg-amber-800 rounded-full flex items-center justify-center border-2 border-amber-500 shadow-inner relative">
                        <User size={20} className="text-amber-200" />
                        <div className="absolute -bottom-1 -right-1 bg-amber-600 text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-black font-bold text-white">
                            {localPlayer.level}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-amber-100 leading-tight">{localPlayer.name}</div>
                        <div className="text-xs text-amber-500 font-semibold">Shaman</div>
                    </div>
                </div>
                {/* Health */}
                <div className="relative w-full h-3 bg-gray-900 rounded-full mb-1 border border-gray-700 overflow-hidden">
                    <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-700 to-green-500 transition-all" 
                        style={{ width: `${(localPlayer.health / localPlayer.maxHealth) * 100}%` }}
                    />
                     <div className="absolute inset-0 text-[9px] flex items-center justify-center text-white/80 drop-shadow-md font-mono z-10">
                        {Math.floor(localPlayer.health)}
                    </div>
                </div>
                {/* Mana */}
                <div className="relative w-full h-3 bg-gray-900 rounded-full border border-gray-700 overflow-hidden">
                    <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all" 
                        style={{ width: `${(localPlayer.mana / localPlayer.maxMana) * 100}%` }}
                    />
                    <div className="absolute inset-0 text-[9px] flex items-center justify-center text-white/80 drop-shadow-md font-mono z-10">
                        {Math.floor(localPlayer.mana)}
                    </div>
                </div>
            </div>
        )}

        {/* Top Center: Target Frame */}
        {target && (
             <div className="absolute top-4 left-1/2 -translate-x-1/2 w-64 bg-black/80 border-2 border-red-900/50 p-2 rounded text-white pointer-events-auto shadow-lg">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-bold text-red-200">{target.type.toUpperCase()}</div>
                    <div className="text-xs text-red-400 font-semibold">Enemy</div>
                </div>
                <div className="relative w-full h-4 bg-gray-900 rounded-full border border-gray-700 overflow-hidden">
                    <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-800 to-red-600 transition-all" 
                        style={{ width: `${(target.health / target.maxHealth) * 100}%` }}
                    />
                    <div className="absolute inset-0 text-[10px] flex items-center justify-center text-white drop-shadow-md font-mono">
                        {Math.floor(target.health)} / {target.maxHealth}
                    </div>
                </div>
            </div>
        )}

        {/* Quest Dialog */}
        {activeNPC && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] bg-amber-100 text-amber-900 border-4 border-amber-800 rounded-lg p-6 pointer-events-auto shadow-2xl flex flex-col gap-4 z-50">
                <div className="flex items-center gap-3 border-b-2 border-amber-800/20 pb-2">
                    <div className="w-12 h-12 bg-amber-800 rounded-full flex items-center justify-center text-white shrink-0">
                        <MessageCircle />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold font-serif">{activeNPC.name}</h2>
                        <div className="text-sm text-amber-700 font-semibold uppercase tracking-wider">{activeNPC.title}</div>
                    </div>
                    <button onClick={() => setActiveNPC(null)} className="ml-auto text-amber-900 hover:text-red-600">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto max-h-60">
                    <div className="italic text-amber-900/80 mb-4">"Greetings, traveler. The spirits whisper of trouble in the plains."</div>
                    {getNpcQuests().map(q => (
                        <div key={q.id} className="bg-amber-50 border border-amber-200 p-3 rounded mb-2">
                            <div className="font-bold text-lg mb-1">{q.title}</div>
                            <div className="text-sm mb-2">{q.description}</div>
                            <div className="text-xs font-mono bg-amber-200/50 p-1 rounded inline-block mb-2">
                                Objective: {q.objective} ({q.progress}/{q.required})
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                {q.status === 'available' && (
                                    <button onClick={() => handleQuestAction('accept', q.id)} className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded text-sm font-bold shadow-sm">Accept Quest</button>
                                )}
                                {q.status === 'active' && <span className="text-sm text-amber-600 font-semibold italic">In Progress...</span>}
                                {q.status === 'ready' && (
                                    <button onClick={() => handleQuestAction('complete', q.id)} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm font-bold shadow-sm flex items-center gap-1"><Check size={14} /> Complete</button>
                                )}
                                {q.status === 'completed' && <span className="text-sm text-green-700 font-bold flex items-center gap-1"><Check size={14} /> Done</span>}
                            </div>
                        </div>
                    ))}
                    {getNpcQuests().length === 0 && <div className="text-center text-amber-900/50 py-4">I have no tasks for you right now.</div>}
                </div>
            </div>
        )}

        {/* Right: Quest Tracker */}
        {localPlayer && localPlayer.quests.some(q => q.status === 'active' || q.status === 'ready') && (
            <div className="absolute top-44 right-4 w-64 bg-black/60 p-4 rounded text-white pointer-events-auto backdrop-blur-sm border-l-4 border-amber-500">
                <h3 className="text-amber-400 font-bold border-b border-white/20 mb-2 pb-1 text-sm uppercase tracking-wide">Current Quests</h3>
                {localPlayer.quests.filter(q => q.status === 'active' || q.status === 'ready').map(q => (
                    <div key={q.id} className="mb-3">
                        <div className="text-sm font-semibold text-gray-100">{q.title}</div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{q.objective}</span>
                            <span>{q.progress}/{q.required}</span>
                        </div>
                        {q.status === 'ready' ? (
                            <div className="text-green-400 text-xs font-bold animate-pulse">Return to {activeNPC?.name || 'Camp'}</div>
                        ) : (
                            <div className="w-full h-1 bg-gray-700 rounded-full">
                                <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${(q.progress / q.required) * 100}%` }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
        
        {/* Top Right: Minimap */}
        <div className="absolute top-4 right-4 pointer-events-auto">
             <Minimap gameState={gameState} localPlayerId={gameState.localPlayerId} />
             <div className="text-center text-[10px] text-amber-200/80 mt-1 font-mono uppercase">Plains of Mulgore</div>
        </div>

        {/* Bottom Center: Action Bar */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto">
            {/* Slot 1: Fireball (Lvl 1) */}
            <div 
                onClick={() => handleAbility(1)}
                className="w-14 h-14 bg-gray-900 border-2 border-gray-500 hover:border-amber-400 cursor-pointer rounded-lg flex items-center justify-center relative group shadow-xl"
            >
                <div className="text-orange-500"><Sword size={28} /></div>
                <div className="absolute bottom-0 right-1 text-xs text-white font-bold bg-black/50 px-1 rounded">1</div>
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap border border-gray-700">
                    {abilities[0].name} (Lvl {abilities[0].minLevel})
                </div>
            </div>

             {/* Slot 2: Earth Shock (Lvl 2) */}
             <div 
                onClick={() => localPlayer && localPlayer.level >= 2 && handleAbility(2)}
                className={`w-14 h-14 bg-gray-900 border-2 rounded-lg flex items-center justify-center relative shadow-xl transition-all ${localPlayer && localPlayer.level >= 2 ? 'border-gray-500 hover:border-amber-400 cursor-pointer' : 'border-gray-800 opacity-50 cursor-not-allowed'}`}
            >
                <div className={localPlayer && localPlayer.level >= 2 ? "text-green-400" : "text-gray-600"}><Zap size={28} /></div>
                <div className="absolute bottom-0 right-1 text-xs text-white font-bold bg-black/50 px-1 rounded">2</div>
                {localPlayer && localPlayer.level < 2 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded text-xs font-bold text-red-500">Lv 2</div>
                )}
                 <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap border border-gray-700 z-50">
                    {abilities[1].name} (Lvl {abilities[1].minLevel})
                </div>
            </div>

             {/* Slot 3: Healing Wave (Lvl 3) */}
             <div 
                onClick={() => localPlayer && localPlayer.level >= 3 && handleAbility(3)}
                className={`w-14 h-14 bg-gray-900 border-2 rounded-lg flex items-center justify-center relative shadow-xl transition-all ${localPlayer && localPlayer.level >= 3 ? 'border-gray-500 hover:border-amber-400 cursor-pointer' : 'border-gray-800 opacity-50 cursor-not-allowed'}`}
            >
                <div className={localPlayer && localPlayer.level >= 3 ? "text-emerald-400" : "text-gray-600"}><Heart size={28} /></div>
                <div className="absolute bottom-0 right-1 text-xs text-white font-bold bg-black/50 px-1 rounded">3</div>
                {localPlayer && localPlayer.level < 3 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded text-xs font-bold text-red-500">Lv 3</div>
                )}
                 <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap border border-gray-700 z-50">
                    {abilities[2].name} (Lvl {abilities[2].minLevel})
                </div>
            </div>
        </div>

        {/* Bottom Left: Chat/Log */}
        <div className="absolute bottom-10 left-4 w-96 h-48 bg-black/60 border border-white/10 p-2 rounded-lg text-sm text-white overflow-y-auto pointer-events-auto font-mono shadow-lg flex flex-col-reverse">
             <div className="flex flex-col justify-end min-h-full">
                <div className="text-yellow-200/80">[System]: Welcome to Mulgore Plains.</div>
                <div className="text-yellow-200/80">[System]: Locate the camp to find quests.</div>
                {gameState.chat.map(c => (
                    <div key={c.id} className="leading-tight mb-1">
                        <span className={`${c.type === 'system' ? 'text-yellow-300' : c.type === 'levelup' ? 'text-amber-400 font-bold' : 'text-blue-300'} font-bold`}>
                            {c.type === 'system' || c.type === 'levelup' ? '[System]' : `[${c.sender}]`}: 
                        </span>
                        <span className={`${c.type === 'levelup' ? 'text-amber-200 font-bold' : 'text-gray-200'} ml-1`}>{c.text}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Bottom: XP Bar */}
        {localPlayer && (
            <div className="absolute bottom-0 left-0 w-full h-5 bg-black border-t-2 border-amber-900 pointer-events-auto">
                <div 
                    className="h-full bg-purple-900 transition-all duration-500 relative overflow-hidden" 
                    style={{ width: `${(localPlayer.xp / localPlayer.maxXP) * 100}%` }}
                >
                    <div className="absolute inset-0 bg-purple-500/30 animate-pulse"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
                </div>
                
                 <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/90 font-mono font-bold tracking-widest drop-shadow-md z-10">
                    XP: {localPlayer.xp} / {localPlayer.maxXP}
                </div>
                
                {/* Ticks */}
                <div className="absolute inset-0 flex justify-between px-2">
                    {[...Array(9)].map((_, i) => (
                        <div key={i} className="w-px h-full bg-black/30" />
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
}