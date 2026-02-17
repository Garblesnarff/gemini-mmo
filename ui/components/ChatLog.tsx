import React from 'react';
import { ChatMessage } from '../../shared/types';

interface ChatLogProps {
    chat: ChatMessage[];
}

export const ChatLog: React.FC<ChatLogProps> = ({ chat }) => {
    return (
        <div className="absolute bottom-10 left-4 w-96 h-48 bg-black/60 border border-white/10 p-2 rounded-lg text-sm text-white overflow-y-auto pointer-events-auto font-mono shadow-lg flex flex-col-reverse">
             <div className="flex flex-col justify-end min-h-full">
                <div className="text-yellow-200/80">[System]: Welcome to Mulgore Plains.</div>
                <div className="text-yellow-200/80">[System]: Locate the camp to find quests.</div>
                {chat.map(c => (
                    <div key={c.id} className="leading-tight mb-1">
                        <span className={`${c.type === 'system' ? 'text-yellow-300' : c.type === 'levelup' ? 'text-amber-400 font-bold' : 'text-blue-300'} font-bold`}>
                            {c.type === 'system' || c.type === 'levelup' ? '[System]' : `[${c.sender}]`}: 
                        </span>
                        <span className={`${c.type === 'levelup' ? 'text-amber-200 font-bold' : 'text-gray-200'} ml-1`}>{c.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}