import React from 'react';
import { User } from 'lucide-react';
import { PlayerState } from '../../shared/types';

interface PlayerFrameProps {
    player: PlayerState | null;
}

export const PlayerFrame: React.FC<PlayerFrameProps> = ({ player }) => {
    if (!player) return null;

    return (
        <div className="absolute top-4 left-4 w-72 bg-black/80 border-2 border-amber-900/50 p-2 rounded text-white pointer-events-auto shadow-lg">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-10 h-10 bg-amber-800 rounded-full flex items-center justify-center border-2 border-amber-500 shadow-inner relative">
                    <User size={20} className="text-amber-200" />
                    <div className="absolute -bottom-1 -right-1 bg-amber-600 text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-black font-bold text-white">
                        {player.level}
                    </div>
                </div>
                <div className="flex-1">
                    <div className="font-bold text-amber-100 leading-tight">{player.name}</div>
                    <div className="text-xs text-amber-500 font-semibold">Shaman</div>
                </div>
            </div>
            {/* Health */}
            <div className="relative w-full h-3 bg-gray-900 rounded-full mb-1 border border-gray-700 overflow-hidden">
                <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-700 to-green-500 transition-all" 
                    style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
                />
                    <div className="absolute inset-0 text-[9px] flex items-center justify-center text-white/80 drop-shadow-md font-mono z-10">
                    {Math.floor(player.health)}
                </div>
            </div>
            {/* Mana */}
            <div className="relative w-full h-3 bg-gray-900 rounded-full border border-gray-700 overflow-hidden">
                <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all" 
                    style={{ width: `${(player.mana / player.maxMana) * 100}%` }}
                />
                <div className="absolute inset-0 text-[9px] flex items-center justify-center text-white/80 drop-shadow-md font-mono z-10">
                    {Math.floor(player.mana)}
                </div>
            </div>
        </div>
    );
}