
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PlayerState, EquipmentState, InventorySlot, ItemSlot, StatBonuses } from '../../shared/types';
import { DataLoader } from '../../core/DataLoader';
import { ItemTooltip } from './ItemTooltip';

interface CharacterPanelProps {
    player: PlayerState;
    equipment: EquipmentState | undefined;
    onClose: () => void;
    onUnequip: (slot: ItemSlot) => void;
}

const RARITY_BORDERS: Record<string, string> = {
    'poor': 'border-gray-600',
    'common': 'border-white',
    'uncommon': 'border-green-500',
    'rare': 'border-blue-500',
    'epic': 'border-purple-500'
};

export const CharacterPanel: React.FC<CharacterPanelProps> = ({ player, equipment, onClose, onUnequip }) => {
    const [hoverItem, setHoverItem] = useState<{item: InventorySlot, pos: {x:number, y:number}} | null>(null);

    if (!equipment) return null;

    const handleMouseEnter = (e: React.MouseEvent, item: InventorySlot | null) => {
        if (item) setHoverItem({ item, pos: { x: e.clientX, y: e.clientY } });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (hoverItem) setHoverItem({ ...hoverItem, pos: { x: e.clientX, y: e.clientY } });
    };

    const renderSlot = (slotName: ItemSlot, label: string) => {
        const item = equipment[slotName];
        const def = item ? DataLoader.getItem(item.itemId) : null;
        const borderColor = def ? RARITY_BORDERS[def.rarity] : 'border-gray-700';

        return (
            <div className="flex flex-col items-center">
                <div className="text-[9px] uppercase text-gray-500 mb-0.5">{label}</div>
                <div 
                    onMouseEnter={(e) => handleMouseEnter(e, item)}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoverItem(null)}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        if (item) onUnequip(slotName);
                    }}
                    className={`w-12 h-12 bg-black/60 border ${borderColor} rounded flex items-center justify-center cursor-pointer hover:bg-white/5 relative`}
                >
                    {item && def ? (
                         <div className="text-2xl select-none">{def.icon}</div>
                    ) : (
                         <div className="text-xs text-gray-600 select-none text-center leading-3">{label.substring(0,2)}</div>
                    )}
                </div>
            </div>
        );
    };
    
    const stats: StatBonuses = player.stats || { stamina: 0, intellect: 0, spirit: 0, strength: 0, armor: 0 };
    const armorReduction = Math.floor((stats.armor / (stats.armor + 50)) * 100);

    return (
        <div className="absolute top-1/2 left-20 -translate-y-1/2 w-80 bg-gray-900/95 border-2 border-gray-600 rounded-lg shadow-2xl pointer-events-auto p-4 z-40 text-gray-200 font-sans">
             <div className="flex items-center justify-between border-b border-gray-700 pb-2 mb-4">
                <div className="font-bold text-lg text-amber-500">{player.name} <span className="text-gray-400 text-sm">Lvl {player.level}</span></div>
                <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="flex justify-between mb-6">
                 {/* Left Column */}
                 <div className="space-y-2">
                     {renderSlot('head', 'Head')}
                     {renderSlot('shoulders', 'Shoulder')}
                     {renderSlot('chest', 'Chest')}
                     {renderSlot('hands', 'Hands')}
                 </div>

                 {/* Center Stats */}
                 <div className="flex-1 px-4 py-2 text-xs space-y-1">
                     <div className="text-center font-bold text-gray-400 border-b border-gray-700 mb-2 pb-1">Attributes</div>
                     <div className="flex justify-between"><span>Health</span> <span className="text-white">{Math.floor(player.maxHealth)} <span className="text-green-500">({stats.stamina * 10})</span></span></div>
                     <div className="flex justify-between"><span>Mana</span> <span className="text-white">{Math.floor(player.maxMana)} <span className="text-green-500">({stats.intellect * 15})</span></span></div>
                     <div className="flex justify-between"><span>Armor</span> <span className="text-white">{stats.armor} <span className="text-gray-500">({armorReduction}%)</span></span></div>
                     <div className="h-2"></div>
                     <div className="flex justify-between"><span>Stamina</span> <span className="text-white">{stats.stamina}</span></div>
                     <div className="flex justify-between"><span>Intellect</span> <span className="text-white">{stats.intellect}</span></div>
                     <div className="flex justify-between"><span>Spirit</span> <span className="text-white">{stats.spirit}</span></div>
                     <div className="flex justify-between"><span>Strength</span> <span className="text-white">{stats.strength}</span></div>
                 </div>

                 {/* Right Column */}
                 <div className="space-y-2">
                     {renderSlot('trinket', 'Trinket')}
                     {renderSlot('offhand', 'Offhand')}
                     {renderSlot('legs', 'Legs')}
                     {renderSlot('feet', 'Feet')}
                     {renderSlot('weapon', 'Main Hand')}
                 </div>
            </div>
            
            {hoverItem && <ItemTooltip item={hoverItem.item} position={hoverItem.pos} />}
        </div>
    );
};
