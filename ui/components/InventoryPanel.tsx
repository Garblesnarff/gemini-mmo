
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { InventoryState, InventorySlot } from '../../shared/types';
import { DataLoader } from '../../core/DataLoader';
import { ItemTooltip } from './ItemTooltip';

interface InventoryPanelProps {
    inventory: InventoryState | undefined;
    onClose: () => void;
    onUseItem: (slot: number) => void;
    onEquipItem: (slot: number) => void;
    onMoveItem: (from: number, to: number) => void;
    onDestroyItem: (slot: number) => void;
}

const RARITY_BORDERS: Record<string, string> = {
    'poor': 'border-gray-600',
    'common': 'border-white',
    'uncommon': 'border-green-500',
    'rare': 'border-blue-500',
    'epic': 'border-purple-500'
};

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ inventory, onClose, onUseItem, onEquipItem, onMoveItem, onDestroyItem }) => {
    const [hoverItem, setHoverItem] = useState<{item: InventorySlot, pos: {x:number, y:number}} | null>(null);
    const [dragStart, setDragStart] = useState<number | null>(null);

    if (!inventory) return null;

    const handleMouseEnter = (e: React.MouseEvent, item: InventorySlot | null) => {
        if (item) {
            setHoverItem({ item, pos: { x: e.clientX, y: e.clientY } });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (hoverItem) {
            setHoverItem({ ...hoverItem, pos: { x: e.clientX, y: e.clientY } });
        }
    };

    const handleMouseLeave = () => {
        setHoverItem(null);
    };

    const handleInteraction = (slot: number, item: InventorySlot | null) => {
        if (!item) return;
        const def = DataLoader.getItem(item.itemId);
        if (!def) return;

        if (def.type === 'equipment') {
            onEquipItem(slot);
        } else if (def.type === 'consumable') {
            onUseItem(slot);
        }
    };

    const handleRightClick = (e: React.MouseEvent, slot: number, item: InventorySlot | null) => {
        e.preventDefault();
        if (!item) return;

        if (e.shiftKey) {
            if(confirm('Destroy item?')) onDestroyItem(slot);
            return;
        }

        handleInteraction(slot, item);
    };

    const handleDoubleClick = (e: React.MouseEvent, slot: number, item: InventorySlot | null) => {
        e.preventDefault();
        handleInteraction(slot, item);
    };
    
    // Convert copper to g s c
    const formatGold = (copper: number) => {
        const gold = Math.floor(copper / 10000);
        const silver = Math.floor((copper % 10000) / 100);
        const c = copper % 100;
        return (
            <div className="flex gap-2 text-xs font-mono">
                <span className="text-yellow-500">{gold}g</span>
                <span className="text-gray-300">{silver}s</span>
                <span className="text-orange-400">{c}c</span>
            </div>
        );
    };

    return (
        <div className="absolute bottom-24 right-4 w-72 bg-gray-900/95 border-2 border-gray-700 rounded-lg shadow-2xl pointer-events-auto flex flex-col p-1 z-40">
             <div className="flex items-center justify-between bg-black/40 px-2 py-1 mb-1 rounded">
                {formatGold(inventory.gold)}
                <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={14} /></button>
            </div>
            
            <div className="grid grid-cols-5 gap-1">
                {inventory.slots.map((slot, idx) => {
                    const def = slot ? DataLoader.getItem(slot.itemId) : null;
                    const borderColor = def ? RARITY_BORDERS[def.rarity] : 'border-gray-800';

                    return (
                        <div 
                            key={idx}
                            onMouseEnter={(e) => handleMouseEnter(e, slot)}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            onContextMenu={(e) => handleRightClick(e, idx, slot)}
                            onDoubleClick={(e) => handleDoubleClick(e, idx, slot)}
                            draggable={!!slot}
                            onDragStart={() => setDragStart(idx)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                                if (dragStart !== null && dragStart !== idx) {
                                    onMoveItem(dragStart, idx);
                                    setDragStart(null);
                                }
                            }}
                            className={`w-12 h-12 bg-black/60 border ${borderColor} rounded relative flex items-center justify-center cursor-default hover:bg-white/10`}
                        >
                            {slot && def && (
                                <>
                                    <div className="text-2xl pointer-events-none select-none">{def.icon}</div>
                                    {slot.quantity > 1 && (
                                        <div className="absolute bottom-0 right-0 text-[10px] font-bold text-white bg-black/80 px-1 rounded-tl">{slot.quantity}</div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
            {hoverItem && <ItemTooltip item={hoverItem.item} position={hoverItem.pos} />}
        </div>
    );
};
