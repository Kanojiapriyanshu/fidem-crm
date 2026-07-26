"use client"

import React, { useEffect, useState } from 'react'

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  rotationStart: number
  rotationEnd: number
  size: number
}

interface CustomConfettiProps {
  colors?: string[]
  particleCount?: number
  duration?: number // How long confetti stays visible (ms)
  className?: string
  style?: React.CSSProperties
}

export function CustomConfetti({
  colors = ['#FFBF00', '#5E412B', '#F57F17', '#F7E152', '#FEF55B'],
  particleCount = 180,
  duration = 2000,
  className = '',
  style = {},
}: CustomConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    // Generate confetti pieces
    const newPieces: ConfettiPiece[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // Random horizontal position (0-100%)
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5, // Random delay (0-0.5s)
      duration: 2 + Math.random() * 2, // Random fall duration (2-4s)
      rotationStart: Math.random() * 360, // Random initial rotation
      rotationEnd: Math.random() * 720 + 360, // Random end rotation
      size: 8 + Math.random() * 8, // Random size (8-16px)
    }))

    setPieces(newPieces)

    // Stop confetti after duration
    const timer = setTimeout(() => {
      setIsActive(false)
    }, duration)

    return () => clearTimeout(timer)
  }, [colors, particleCount, duration])

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes confetti-fall {
            0% {
              transform: translateY(0);
              opacity: 1;
            }
            70% {
              opacity: 1;
            }
            100% {
              transform: translateY(calc(30vh + 100px));
              opacity: 0;
            }
          }
        `
      }} />
      
      <div
        className={`pointer-events-none ${className}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          opacity: isActive ? 1 : 0,
          transition: 'opacity 0.8s ease-out',
          ...style,
        }}
      >
        {pieces.map((piece) => {
          const keyframesName = `rotate-${piece.id}`
          
          return (
            <React.Fragment key={piece.id}>
              <style dangerouslySetInnerHTML={{
                __html: `
                  @keyframes ${keyframesName} {
                    0% {
                      transform: translateY(0) rotate(${piece.rotationStart}deg);
                    }
                    100% {
                      transform: translateY(calc(30vh + 100px)) rotate(${piece.rotationEnd}deg);
                    }
                  }
                `
              }} />
              
              <div
                style={{
                  position: 'absolute',
                  left: `${piece.x}%`,
                  top: '-20px',
                  width: `${piece.size}px`,
                  height: `${piece.size}px`,
                  backgroundColor: piece.color,
                  borderRadius: '2px',
                  animation: isActive
                    ? `${keyframesName} ${piece.duration}s linear ${piece.delay}s forwards`
                    : 'none',
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.8s ease-out',
                  willChange: 'transform, opacity',
                }}
              />
            </React.Fragment>
          )
        })}
      </div>
    </>
  )
}