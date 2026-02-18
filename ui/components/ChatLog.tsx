
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../../shared/types';

interface ChatLogProps {
    chat: ChatMessage[];
}

export const ChatLog: React.FC<ChatLogProps> = ({ chat }) => {
    const endRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat]);

    return (
        <div className="absolute bottom-10 left-4 w-96 h-48 bg-black/60 border border-white/10 p-2 rounded-lg text-sm text-white overflow-y-auto pointer-events-auto font-mono shadow-lg flex flex-col">
             <div className="flex-1">
                <div className="text-yellow-200/80">[System]: Welcome to Mulgore Plains.</div>
                <div className="text-yellow-200/80">[System]: Locate the camp to find quests.</div>
                {chat.map(c => {
                    let color = 'text-gray-200';
                    if (c.type === 'system') color = 'text-yellow-300';
                    if (c.type === 'levelup') color = 'text-amber-400 font-bold';
                    if (c.type === 'loot') color = 'text-green-400';
                    if (c.type === 'combat') color = 'text-red-300';

                    return (
                        <div key={c.id} className="leading-tight mb-1 break-words">
                            <span className={`${color} font-bold opacity-80`}>
                                {c.type === 'system' || c.type === 'levelup' || c.type === 'loot' ? '[System]' : `[${c.sender}]`}: 
                            </span>
                            <span className={`${color} ml-1`}>{c.text}</span>
                        </div>
                    );
                })}
                <div ref={endRef} />
            </div>
        </div>
    );
}
