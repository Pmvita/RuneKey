import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { styled } from 'nativewind';
import { logger } from '../../utils/logger';

const StyledView = styled(View);

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface ParticleEffectProps {
  type?: 'confetti' | 'sparkles' | 'fireworks';
  active: boolean;
  onComplete?: () => void;
  className?: string;
}

export const ParticleEffect: React.FC<ParticleEffectProps> = ({
  type = 'confetti',
  active,
  onComplete,
  className,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const colors = {
    confetti: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
    sparkles: ['#FFD700', '#FFA500', '#FF69B4', '#00CED1', '#32CD32'],
    fireworks: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
  };

  const createParticle = (x: number, y: number): Particle => ({
    id: Date.now() + Math.random(),
    x,
    y,
    vx: (Math.random() - 0.5) * 8,
    vy: -15 - Math.random() * 10,
    life: 100,
    maxLife: 100,
    color: colors[type][Math.floor(Math.random() * colors[type].length)],
    size: Math.random() * 6 + 2,
  });

  const createParticles = () => {
    const newParticles: Particle[] = [];
    const particleCount = type === 'fireworks' ? 30 : 50;
    
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * 300 + 50;
      const y = Math.random() * 200 + 100;
      newParticles.push(createParticle(x, y));
    }
    
    setParticles(newParticles);
  };

  useEffect(() => {
    if (active) {
      // Launch particles
      createParticles();
      console.log('🎯 ANIMATION: ' + type + ' particles launched');
    } else {
      setParticles([]);
    }
  }, [active]);

  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles(prevParticles => {
        const updatedParticles = prevParticles
          .map(particle => ({
            ...particle,
            x: particle.x + particle.vx * 0.1,
            y: particle.y + particle.vy * 0.1,
            vy: particle.vy + 0.5, // Gravity
            life: particle.life - 1,
          }))
          .filter(particle => particle.life > 0);

        if (updatedParticles.length === 0 && onComplete) {
          onComplete();
        }

        return updatedParticles;
      });
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [particles, onComplete]);

  if (!active || particles.length === 0) return null;

  return (
    <StyledView className={`absolute inset-0 pointer-events-none ${className}`}>
      {particles.map(particle => (
        <StyledView
          key={particle.id}
          className={`absolute rounded-full ${
            type === 'confetti' ? 'rounded-sm' : 'rounded-full'
          }`}
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.life / particle.maxLife,
            transform: [
              { rotate: `${particle.id % 360}deg` },
              { scale: particle.life / particle.maxLife },
            ],
          }}
        />
      ))}
    </StyledView>
  );
}; 