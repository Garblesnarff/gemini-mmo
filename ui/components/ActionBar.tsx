
import React, { useState, useEffect, useRef } from 'react';
import { Sword, Zap, Heart, Backpack, User } from 'lucide-react';
import { DataLoader } from '../../core/DataLoader';

interface ActionBarProps {
    level: number;
    onCast: (slot: number) => void;
    onToggleBag: () => void;
    onToggleCharacter: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({ level, onCast, onToggleBag, onToggleCharacter }) => {
    const abilities = DataLoader.getAllAbilities();
    const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
    const [now, setNow] = useState(Date.now());
    const frameRef = useRef<number>(0);

    const handleCast = (slot: number, abilityId: string, cooldownTime: number) => {
        const expires = cooldowns[abilityId] || 0;
        if (Date.now() < expires) return;

        onCast(slot);
        setCooldowns(prev => ({...prev, [abilityId]: Date.now() + cooldownTime}));
    };

    useEffect(() => {
        const animate = () => {
            const hasActiveCD = Object.values(cooldowns).some((expiry: number) => expiry > Date.now());
            if (hasActiveCD) {
                setNow(Date.now());
                frameRef.current = requestAnimationFrame(animate);
            }
        };
        if (Object.keys(cooldowns).length > 0) {
            frameRef.current = requestAnimationFrame(animate);
        }
        return () => cancelAnimationFrame(frameRef.current);
    }, [cooldowns]);

    const renderCooldownOverlay = (abilityId: string, duration: number) => {
        const expires = cooldowns[abilityId] || 0;
        const remaining = Math.max(0, expires - now);
        if (remaining <= 0) return null;

        const progress = (remaining / duration) * 100;
        const seconds = (remaining / 1000).toFixed(1);

        return (
            <>
                <div 
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{
                        background: `conic-gradient(rgba(0,0,0,0.7) ${progress}%, transparent ${progress}%)`
                    }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-white font-bold drop-shadow-md text-lg">{seconds}</span>
                </div>
            </>
        );
    };

    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto items-end">
            <div className="flex gap-2">
                {/* Slot 1: Fireball (Lvl 1) */}
                <div 
                    onClick={() => handleCast(1, abilities[0].id, abilities[0].cooldown)}
                    className={`w-14 h-14 bg-gray-900 border-2 border-gray-500 hover:border-amber-400 cursor-pointer rounded-lg flex items-center justify-center relative group shadow-xl ${cooldowns[abilities[0].id] > now ? 'cursor-not-allowed border-gray-700' : ''}`}
                >
                    <div className="text-orange-500"><Sword size={28} /></div>
                    <div className="absolute bottom-0 right-1 text-xs text-white font-bold bg-black/50 px-1 rounded">1</div>
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap border border-gray-700 pointer-events-none">
                        {abilities[0].name} (Lvl {abilities[0].minLevel})
                    </div>
                    {renderCooldownOverlay(abilities[0].id, abilities[0].cooldown)}
                </div>

                {/* Slot 2: Earth Shock (Lvl 2) */}
                <div 
                    onClick={() => level >= 2 && handleCast(2, abilities[1].id, abilities[1].cooldown)}
                    className={`w-14 h-14 bg-gray-900 border-2 rounded-lg flex items-center justify-center relative shadow-xl transition-all ${level >= 2 ? 'border-gray-500 hover:border-amber-400 cursor-pointer' : 'border-gray-800 opacity-50 cursor-not-allowed'} ${cooldowns[abilities[1].id] > now ? 'cursor-not-allowed border-gray-700' : ''}`}
                >
                    <div className={level >= 2 ? "text-green-400" : "text-gray-600"}><Zap size={28} /></div>
                    <div className="absolute bottom-0 right-1 text-xs text-white font-bold bg-black/50 px-1 rounded">2</div>
                    {level < 2 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded text-xs font-bold text-red-500">Lv 2</div>
                    )}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap border border-gray-700 z-50 pointer-events-none">
                        {abilities[1].name} (Lvl {abilities[1].minLevel})
                    </div>
                    {renderCooldownOverlay(abilities[1].id, abilities[1].cooldown)}
                </div>

                {/* Slot 3: Healing Wave (Lvl 3) */}
                <div 
                    onClick={() => level >= 3 && handleCast(3, abilities[2].id, abilities[2].cooldown)}
                    className={`w-14 h-14 bg-gray-900 border-2 rounded-lg flex items-center justify-center relative shadow-xl transition-all ${level >= 3 ? 'border-gray-500 hover:border-amber-400 cursor-pointer' : 'border-gray-800 opacity-50 cursor-not-allowed'} ${cooldowns[abilities[2].id] > now ? 'cursor-not-allowed border-gray-700' : ''}`}
                >
                    <div className={level >= 3 ? "text-emerald-400" : "text-gray-600"}><Heart size={28} /></div>
                    <div className="absolute bottom-0 right-1 text-xs text-white font-bold bg-black/50 px-1 rounded">3</div>
                    {level < 3 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded text-xs font-bold text-red-500">Lv 3</div>
                    )}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap border border-gray-700 z-50 pointer-events-none">
                        {abilities[2].name} (Lvl {abilities[2].minLevel})
                    </div>
                    {renderCooldownOverlay(abilities[2].id, abilities[2].cooldown)}
                </div>
            </div>

            <div className="flex flex-col gap-2 mb-2">
                {/* Character Button */}
                <div 
                    onClick={onToggleCharacter}
                    className="w-10 h-10 bg-gray-900 border-2 border-gray-500 hover:border-white cursor-pointer rounded-full flex items-center justify-center shadow-xl text-amber-600 transition-colors"
                    title="Character (C)"
                >
                    <User size={20} />
                </div>
                {/* Bag Button */}
                <div 
                    onClick={onToggleBag}
                    className="w-10 h-10 bg-gray-900 border-2 border-gray-500 hover:border-white cursor-pointer rounded-full flex items-center justify-center shadow-xl text-amber-600 transition-colors"
                    title="Toggle Inventory (B)"
                >
                    <Backpack size={20} />
                </div>
            </div>
        </div>
    );
}
