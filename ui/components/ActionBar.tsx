import React from 'react';
import { Sword, Zap, Heart } from 'lucide-react';
import { DataLoader } from '../../core/DataLoader';

interface ActionBarProps {
    level: number;
    onCast: (slot: number) => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({ level, onCast }) => {
    const abilities = DataLoader.getAllAbilities();

    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto">
            {/* Slot 1: Fireball (Lvl 1) */}
            <div 
                onClick={() => onCast(1)}
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
                onClick={() => level >= 2 && onCast(2)}
                className={`w-14 h-14 bg-gray-900 border-2 rounded-lg flex items-center justify-center relative shadow-xl transition-all ${level >= 2 ? 'border-gray-500 hover:border-amber-400 cursor-pointer' : 'border-gray-800 opacity-50 cursor-not-allowed'}`}
            >
                <div className={level >= 2 ? "text-green-400" : "text-gray-600"}><Zap size={28} /></div>
                <div className="absolute bottom-0 right-1 text-xs text-white font-bold bg-black/50 px-1 rounded">2</div>
                {level < 2 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded text-xs font-bold text-red-500">Lv 2</div>
                )}
                 <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap border border-gray-700 z-50">
                    {abilities[1].name} (Lvl {abilities[1].minLevel})
                </div>
            </div>

             {/* Slot 3: Healing Wave (Lvl 3) */}
             <div 
                onClick={() => level >= 3 && onCast(3)}
                className={`w-14 h-14 bg-gray-900 border-2 rounded-lg flex items-center justify-center relative shadow-xl transition-all ${level >= 3 ? 'border-gray-500 hover:border-amber-400 cursor-pointer' : 'border-gray-800 opacity-50 cursor-not-allowed'}`}
            >
                <div className={level >= 3 ? "text-emerald-400" : "text-gray-600"}><Heart size={28} /></div>
                <div className="absolute bottom-0 right-1 text-xs text-white font-bold bg-black/50 px-1 rounded">3</div>
                {level < 3 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded text-xs font-bold text-red-500">Lv 3</div>
                )}
                 <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap border border-gray-700 z-50">
                    {abilities[2].name} (Lvl {abilities[2].minLevel})
                </div>
            </div>
        </div>
    );
}