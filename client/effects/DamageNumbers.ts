
import * as THREE from 'three';

interface DamageNumber {
    id: number;
    sprite: THREE.Sprite;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    type: 'damage' | 'heal' | 'crit' | 'enemy_damage';
}

export const DamageNumbers = {
    activeNumbers: [] as DamageNumber[],
    scene: null as THREE.Scene | null,
    nextId: 0,
    
    init(scene: THREE.Scene) {
        this.scene = scene;
        this.activeNumbers = [];
    },

    spawnDamageNumber(position: THREE.Vector3, amount: number, type: 'damage' | 'heal' | 'crit' | 'enemy_damage') {
        if (!this.scene) return;

        // Cap at 20
        if (this.activeNumbers.length >= 20) {
            const old = this.activeNumbers.shift();
            if (old) this.scene.remove(old.sprite);
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Texture setup
        const text = Math.floor(amount).toString();
        const fontSize = type === 'crit' ? 64 : 48;
        ctx.font = `bold ${fontSize}px Arial`;
        const textWidth = ctx.measureText(text).width;
        
        canvas.width = textWidth + 20;
        canvas.height = fontSize + 20;

        // Colors
        let color = '#FFFFFF';
        if (type === 'heal') color = '#00E676';
        if (type === 'crit') color = '#FFD700';
        if (type === 'enemy_damage') color = '#FF5252';

        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Shadow/Outline
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeText(text, canvas.width/2, canvas.height/2);
        
        // Fill
        ctx.fillStyle = color;
        ctx.fillText(text, canvas.width/2, canvas.height/2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);

        // Positioning
        const startPos = position.clone();
        startPos.x += (Math.random() - 0.5);
        startPos.y += 2.5; // Head height
        
        sprite.position.copy(startPos);
        
        // Scale
        const baseScale = type === 'crit' ? 1.5 : 1.0;
        sprite.scale.set(baseScale, baseScale * (canvas.height / canvas.width), 1);

        this.scene.add(sprite);

        this.activeNumbers.push({
            id: this.nextId++,
            sprite,
            position: startPos,
            velocity: new THREE.Vector3(0, 2, 0), // Float up
            life: 1.2,
            maxLife: 1.2,
            type
        });
    },

    update(dt: number) {
        if (!this.scene) return;

        for (let i = this.activeNumbers.length - 1; i >= 0; i--) {
            const dn = this.activeNumbers[i];
            dn.life -= dt;

            if (dn.life <= 0) {
                this.scene.remove(dn.sprite);
                this.activeNumbers.splice(i, 1);
                continue;
            }

            // Move
            dn.position.addScaledVector(dn.velocity, dt);
            dn.sprite.position.copy(dn.position);

            // Animate Scale & Opacity
            const progress = 1 - (dn.life / dn.maxLife);
            
            // Fade out
            dn.sprite.material.opacity = Math.max(0, dn.life / 0.5); 
            dn.sprite.material.opacity = dn.life / dn.maxLife;

            // Shrink
            const baseScale = dn.type === 'crit' ? 1.5 : 1.0;
            const targetScale = dn.type === 'crit' ? 0.8 : 0.5;
            const currentScale = baseScale - (baseScale - targetScale) * progress;
            const ratio = dn.sprite.material.map?.image ? (dn.sprite.material.map.image.height / dn.sprite.material.map.image.width) : 1;
            
            dn.sprite.scale.set(currentScale, currentScale * ratio, 1);
        }
    }
};
        