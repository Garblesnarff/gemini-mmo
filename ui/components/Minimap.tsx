import React, { useEffect, useRef } from 'react';
import { GameState, EnemyState, NPCState } from '../../shared/types';

interface MinimapProps {
    gameState: GameState;
    localPlayerId: string;
}

export const Minimap: React.FC<MinimapProps> = ({ gameState, localPlayerId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        
        const player = gameState.players[localPlayerId];
        if (!player) return;

        // Clear
        ctx.clearRect(0, 0, 150, 150);
        
        // Background
        ctx.beginPath();
        ctx.arc(75, 75, 70, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fill();
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Save context for rotation
        ctx.save();
        // Move to center, rotate map opposite to player rotation so player always faces UP
        ctx.translate(75, 75);
        ctx.rotate(player.rotation); 
        
        const scale = 1.5; // Pixels per meter

        // Draw Entities relative to player
        // Enemies
        Object.values(gameState.enemies).forEach((e: EnemyState) => {
            if (e.isDead) return;
            const dx = e.position.x - player.position.x;
            const dz = e.position.z - player.position.z;
            
            // Draw if within range
            if (dx*dx + dz*dz < (70/scale)**2) {
                ctx.beginPath();
                ctx.fillStyle = 'red';
                ctx.arc(dx * scale, dz * scale, 3, 0, Math.PI * 2); 
                ctx.fill();
            }
        });
        
        // NPCs
        Object.values(gameState.npcs).forEach((n: NPCState) => {
             const dx = n.position.x - player.position.x;
             const dz = n.position.z - player.position.z;
             if (dx*dx + dz*dz < (70/scale)**2) {
                ctx.beginPath();
                ctx.fillStyle = 'yellow';
                ctx.arc(dx * scale, dz * scale, 4, 0, Math.PI * 2); 
                ctx.fill();
             }
        });
        
        // Camp Fire (approx)
        const dx = -20 - player.position.x;
        const dz = -20 - player.position.z;
         if (dx*dx + dz*dz < (70/scale)**2) {
            ctx.beginPath();
            ctx.fillStyle = 'orange';
            ctx.arc(dx * scale, dz * scale, 5, 0, Math.PI * 2); 
            ctx.fill();
         }

        ctx.restore();

        // Draw Player Arrow (Always center, pointing up)
        ctx.beginPath();
        ctx.moveTo(75, 70); // Tip
        ctx.lineTo(70, 80);
        ctx.lineTo(80, 80);
        ctx.closePath();
        ctx.fillStyle = 'white';
        ctx.fill();

    }, [gameState]);

    return (
        <div className="absolute top-4 right-4 pointer-events-auto">
             <canvas ref={canvasRef} width={150} height={150} className="rounded-full shadow-lg border border-black/50" />
             <div className="text-center text-[10px] text-amber-200/80 mt-1 font-mono uppercase">Plains of Mulgore</div>
        </div>
    );
}