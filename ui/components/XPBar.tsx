import React from 'react';

interface XPBarProps {
    xp: number;
    maxXP: number;
}

export const XPBar: React.FC<XPBarProps> = ({ xp, maxXP }) => {
    return (
        <div className="absolute bottom-0 left-0 w-full h-5 bg-black border-t-2 border-amber-900 pointer-events-auto">
            <div 
                className="h-full bg-purple-900 transition-all duration-500 relative overflow-hidden" 
                style={{ width: `${(xp / maxXP) * 100}%` }}
            >
                <div className="absolute inset-0 bg-purple-500/30 animate-pulse"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
            </div>
            
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/90 font-mono font-bold tracking-widest drop-shadow-md z-10">
                XP: {xp} / {maxXP}
            </div>
            
            {/* Ticks */}
            <div className="absolute inset-0 flex justify-between px-2">
                {[...Array(9)].map((_, i) => (
                    <div key={i} className="w-px h-full bg-black/30" />
                ))}
            </div>
        </div>
    );
}