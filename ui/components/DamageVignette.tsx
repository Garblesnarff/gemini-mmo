
import React from 'react';

interface DamageVignetteProps {
    active: boolean;
}

export const DamageVignette: React.FC<DamageVignetteProps> = ({ active }) => {
    return (
        <div 
            className="absolute inset-0 pointer-events-none transition-shadow duration-300 z-50"
            style={{ 
                boxShadow: active ? 'inset 0 0 100px rgba(255, 0, 0, 0.4)' : 'none',
                transitionTimingFunction: active ? 'ease-in' : 'ease-out',
                transitionDuration: active ? '150ms' : '400ms'
            }}
        />
    );
};
        