
import React from 'react';
import { createPortal } from 'react-dom';
import { DataLoader } from '../../core/DataLoader';
import { InventorySlot } from '../../shared/types';

interface ItemTooltipProps {
    item: InventorySlot;
    position: { x: number, y: number } | null;
}

const RARITY_COLORS: Record<string, string> = {
    'poor': '#9d9d9d',
    'common': '#ffffff',
    'uncommon': '#1eff00',
    'rare': '#0070dd',
    'epic': '#a335ee'
};

export const ItemTooltip: React.FC<ItemTooltipProps> = ({ item, position }) => {
    if (!position) return null;

    const def = DataLoader.getItem(item.itemId);
    if (!def) return null;

    const color = RARITY_COLORS[def.rarity] || '#ffffff';
    
    // Format Gold
    const formatPrice = (val: number) => {
        const s = Math.floor(val/100);
        const c = val%100;
        return `${s > 0 ? s + 's ' : ''}${c}c`;
    };

    return createPortal(
        <div 
            className="fixed z-[100] w-64 bg-black/90 border border-gray-600 rounded p-3 text-sm pointer-events-none shadow-xl font-sans"
            style={{ 
                top: Math.min(window.innerHeight - 200, position.y + 15), 
                left: Math.min(window.innerWidth - 270, position.x + 15) 
            }}
        >
            <div className="font-bold text-base mb-1" style={{ color }}>{def.name}</div>
            
            <div className="flex justify-between text-gray-400 text-xs mb-2">
                <span>{def.slot ? def.slot.charAt(0).toUpperCase() + def.slot.slice(1) : (def.type === 'junk' ? 'Junk' : 'Consumable')}</span>
                <span>{def.type === 'equipment' ? (def.slot === 'weapon' ? 'Weapon' : (def.slot === 'offhand' ? 'Off-Hand' : 'Armor')) : ''}</span>
            </div>

            {def.stats?.armor && <div className="text-yellow-500 mb-1">{def.stats.armor} Armor</div>}
            
            <div className="space-y-0.5 mb-2">
                {def.stats?.stamina && <div className="text-green-400">+{def.stats.stamina} Stamina</div>}
                {def.stats?.intellect && <div className="text-green-400">+{def.stats.intellect} Intellect</div>}
                {def.stats?.spirit && <div className="text-green-400">+{def.stats.spirit} Spirit</div>}
                {def.stats?.strength && <div className="text-green-400">+{def.stats.strength} Strength</div>}
            </div>

            {def.durability && (
                <div className="text-white text-xs mb-1">Durability {item.currentDurability ?? def.durability} / {def.durability}</div>
            )}

            {def.levelReq && (
                <div className="text-white text-xs mb-1">Requires Level {def.levelReq}</div>
            )}

            {def.useEffect && (
                <div className="text-green-400 text-xs mb-1">Use: Restores {def.useEffect.value} {def.useEffect.type}.</div>
            )}

            {def.flavor && (
                <div className="text-yellow-200 italic text-xs mb-2">"{def.flavor}"</div>
            )}

            <div className="text-gray-400 text-xs mt-1 border-t border-gray-700 pt-1">
                Sell Price: {formatPrice(def.sellValue)}
            </div>
        </div>,
        document.body
    );
};
