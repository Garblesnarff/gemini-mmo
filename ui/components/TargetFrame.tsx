import React from 'react';
import { EnemyState } from '../../shared/types';

interface TargetFrameProps {
    target: EnemyState | null;
}

export const TargetFrame: React.FC<TargetFrameProps> = ({ target }) => {
    if (!target) return null;

    return (
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
    );
}