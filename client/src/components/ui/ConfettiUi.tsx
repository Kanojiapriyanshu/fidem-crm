'use client';

import { useEffect, useState } from 'react';

interface ConfettiProps {
  isActive: boolean;
  particleCount?: number;
  colors?: string[];
  className?: string;
}

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  rotation: number;
  scale: number;
  color: string;
}

export default function Confetti({ 
  isActive, 
  particleCount = 100,
  colors = ['#FFBF00', '#5E412B', '#F57F17', '#F7E152', '#FEF55B'],
  className = ''
}: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (isActive) {
      const newParticles: Particle[] = [];
      
     for (let i = 0; i < particleCount; i++) {
  newParticles.push({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.6,          // 0–0.6s (optional)
    duration: Math.random() * 3 + 4,     // 4–7 seconds ✅
    rotation: Math.random() * 360,
    scale: Math.random() * 0.75 + 1,
    color: colors[Math.floor(Math.random() * colors.length)],
  });
}

      
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [isActive, particleCount, colors]);

  if (!isActive) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <svg
          key={particle.id}
          className="absolute animate-confetti-fall"
          width={6.6 * particle.scale}
          height={6.6 * particle.scale}
          viewBox="0 0 6.6 6.6"
          style={{
            left: `${particle.left}%`,
            top: 0,
            color: particle.color,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        >
          <path
            fill="currentColor"
            d="M-.017 6.91L4.035.012l2.587 1.52L2.57 8.43z"
            transform={`rotate(${particle.rotation}, 3.3, 3.3)`}
          />
        </svg>
      ))}
    </div>
  );
}