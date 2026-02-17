import React from 'react';
import { X, Check, MessageCircle } from 'lucide-react';
import { NPCState, Quest } from '../../shared/types';

interface QuestDialogProps {
    npc: NPCState | null;
    quests: Quest[]; // All quests relevant to this NPC
    onClose: () => void;
    onAction: (action: 'accept' | 'complete', questId: string) => void;
}

export const QuestDialog: React.FC<QuestDialogProps> = ({ npc, quests, onClose, onAction }) => {
    if (!npc) return null;

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] bg-amber-100 text-amber-900 border-4 border-amber-800 rounded-lg p-6 pointer-events-auto shadow-2xl flex flex-col gap-4 z-50">
            <div className="flex items-center gap-3 border-b-2 border-amber-800/20 pb-2">
                <div className="w-12 h-12 bg-amber-800 rounded-full flex items-center justify-center text-white shrink-0">
                    <MessageCircle />
                </div>
                <div>
                    <h2 className="text-xl font-bold font-serif">{npc.name}</h2>
                    <div className="text-sm text-amber-700 font-semibold uppercase tracking-wider">{npc.title}</div>
                </div>
                <button onClick={onClose} className="ml-auto text-amber-900 hover:text-red-600">
                    <X size={24} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-60">
                <div className="italic text-amber-900/80 mb-4">"Greetings, traveler. The spirits whisper of trouble in the plains."</div>
                {quests.map(q => (
                    <div key={q.id} className="bg-amber-50 border border-amber-200 p-3 rounded mb-2">
                        <div className="font-bold text-lg mb-1">{q.title}</div>
                        <div className="text-sm mb-2">{q.description}</div>
                        <div className="text-xs font-mono bg-amber-200/50 p-1 rounded inline-block mb-2">
                            Objective: {q.objective} ({q.progress}/{q.required})
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                            {q.status === 'available' && (
                                <button onClick={() => onAction('accept', q.id)} className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded text-sm font-bold shadow-sm">Accept Quest</button>
                            )}
                            {q.status === 'active' && <span className="text-sm text-amber-600 font-semibold italic">In Progress...</span>}
                            {q.status === 'ready' && (
                                <button onClick={() => onAction('complete', q.id)} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm font-bold shadow-sm flex items-center gap-1"><Check size={14} /> Complete</button>
                            )}
                            {q.status === 'completed' && <span className="text-sm text-green-700 font-bold flex items-center gap-1"><Check size={14} /> Done</span>}
                        </div>
                    </div>
                ))}
                {quests.length === 0 && <div className="text-center text-amber-900/50 py-4">I have no tasks for you right now.</div>}
            </div>
        </div>
    );
}