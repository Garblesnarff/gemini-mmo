
import React, { useState } from 'react';
import { X, Coins } from 'lucide-react';
import { GeneratedLoot } from '../../shared/types';
import { DataLoader } from '../../core/DataLoader';
import { ItemTooltip } from './ItemTooltip';

interface LootWindowProps {
    loot: GeneratedLoot | null;
    onClose: () => void;
    onLootItem: (enemyId: string, index: number) => void;
    onLootAll: (enemyId: string) => void;
}

const RARITY_COLORS: Record<string, string> = {
    'poor': '#9d9d9d',
    'common': '#ffffff',
    'uncommon': '#1eff00',
    'rare': '#0070dd',
    'epic': '#a335ee'
};

const formatGold = (copper: number): string => {
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const remaining = copper % 100;
    let parts = [];
    if (gold > 0) parts.push(`${gold}g`);
    if (silver > 0) parts.push(`${silver}s`);
    if (remaining > 0 || parts.length === 0) parts.push(`${remaining}c`);
    return parts.join(' ');
};

export const LootWindow: React.FC<LootWindowProps> = ({ loot, onClose, onLootItem, onLootAll }) => {
    const [hoverItem, setHoverItem] = useState<{itemId: string, pos: {x:number, y:number}} | null>(null);

    if (!loot) return null;

    const handleMouseEnter = (e: React.MouseEvent, itemId: string) => {
        setHoverItem({ itemId, pos: { x: e.clientX, y: e.clientY } });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (hoverItem) {
            setHoverItem({ ...hoverItem, pos: { x: e.clientX, y: e.clientY } });
        }
    };

    const handleMouseLeave = () => {
        setHoverItem(null);
    };

    return (
        <div className="absolute top-1/2 left-[60%] -translate-y-1/2 w-72 bg-gray-900 border-2 border-gray-600 rounded-lg shadow-2xl pointer-events-auto flex flex-col z-50">
            {/* Header */}
            <div className="flex items-center justify-between bg-black/40 p-2 border-b border-gray-600">
                <div className="font-bold text-gray-200 text-sm truncate">{loot.enemyName}</div>
                <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={16} /></button>
            </div>

            {/* Gold */}
            {loot.gold > 0 && (
                 <div className="p-2 flex items-center gap-2 border-b border-gray-700/50 bg-black/20">
                     <div className="w-6 h-6 rounded bg-black/50 border border-yellow-800 flex items-center justify-center text-yellow-500">
                         <Coins size={14} />
                     </div>
                     <span className="text-white text-xs font-mono">{formatGold(loot.gold)}</span>
                 </div>
            )}

            {/* Items */}
            <div className="flex-1 max-h-64 overflow-y-auto p-2 space-y-1">
                {loot.items.map((item, idx) => {
                    const def = DataLoader.getItem(item.itemId);
                    if (!def) return null;
                    return (
                        <div 
                            key={idx} 
                            onClick={() => onLootItem(loot.enemyId, idx)}
                            onMouseEnter={(e) => handleMouseEnter(e, item.itemId)}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            className="flex items-center gap-2 p-1 hover:bg-white/10 rounded cursor-pointer group relative"
                        >
                            <div 
                                className="w-8 h-8 bg-black/50 border rounded flex items-center justify-center text-lg relative"
                                style={{ borderColor: RARITY_COLORS[def.rarity] }}
                            >
                                {def.icon}
                                {item.quantity > 1 && <span className="absolute bottom-0 right-0 text-[9px] font-bold text-white bg-black/80 px-0.5 rounded">{item.quantity}</span>}
                            </div>
                            <div className="text-sm font-medium" style={{ color: RARITY_COLORS[def.rarity] }}>
                                {def.name}
                            </div>
                        </div>
                    );
                })}
                {loot.items.length === 0 && loot.gold === 0 && (
                    <div className="text-gray-500 text-xs text-center py-2">Empty</div>
                )}
            </div>
            
            {/* Footer */}
            {(loot.items.length > 0 || loot.gold > 0) && (
                <div className="p-2 border-t border-gray-600">
                    <button 
                        onClick={() => onLootAll(loot.enemyId)}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs py-1 rounded border border-gray-500"
                    >
                        Loot All
                    </button>
                </div>
            )}

            {hoverItem && (
                <ItemTooltip 
                    item={{ itemId: hoverItem.itemId, quantity: 1 }} 
                    position={hoverItem.pos} 
                />
            )}
        </div>
    );
};
