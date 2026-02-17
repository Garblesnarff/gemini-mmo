import React from 'react';
import { PlayerState, NPCState } from '../../shared/types';

interface QuestTrackerProps {
    player: PlayerState | null;
    activeNPC: NPCState | null;
}

export const QuestTracker: React.FC<QuestTrackerProps> = ({ player, activeNPC }) => {
    if (!player || !player.quests.some(q => q.status === 'active' || q.status === 'ready')) return null;

    return (
        <div className="absolute top-44 right-4 w-64 bg-black/60 p-4 rounded text-white pointer-events-auto backdrop-blur-sm border-l-4 border-amber-500">
            <h3 className="text-amber-400 font-bold border-b border-white/20 mb-2 pb-1 text-sm uppercase tracking-wide">Current Quests</h3>
            {player.quests.filter(q => q.status === 'active' || q.status === 'ready').map(q => (
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
    );
}