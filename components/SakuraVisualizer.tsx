
import React, { useRef, useEffect, useMemo } from 'react';
import { RainDrop, Ripple, NoteParticle, Theme } from '../types';

interface Props {
  drops: RainDrop[];
  ripples: Ripple[];
  particles: NoteParticle[];
  width: number;
  height: number;
  theme: Theme;
}

const SakuraVisualizer: React.FC<Props> = React.memo(({ drops, ripples, particles, width, height, theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw Drops
    ctx.fillStyle = theme.rainColor;
    drops.forEach(drop => {
      ctx.beginPath();
      ctx.rect(drop.x, drop.y, 1.2, Math.min(drop.speed * 1.8, 25)); 
      ctx.fill();
    });

    // Draw Ripples
    ctx.lineWidth = 1.0;
    ripples.forEach(ripple => {
      ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.opacity * 0.6})`;
      ctx.beginPath();
      ctx.ellipse(ripple.x, ripple.y, ripple.size, ripple.size * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw Theme-Specific Particles
    particles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        
        const scale = p.size;

        if (theme.id === 'sakura_night') {
            // Glowing crystals for Night Sakura theme
            ctx.beginPath();
            const sides = 6;
            for(let i=0; i<sides; i++) {
                const angle = (i * Math.PI * 2) / sides;
                const r = i % 2 === 0 ? scale : scale / 2;
                ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            }
            ctx.closePath();
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#fff';
            ctx.fill();
        } else if (theme.id === 'night_garden') {
            // Soft floating orbs (fireflies)
            ctx.beginPath();
            ctx.arc(0, 0, scale / 2, 0, Math.PI * 2);
            ctx.shadowBlur = 12;
            ctx.shadowColor = theme.particleColor;
            ctx.fill();
        } else if (theme.id === 'old_capital') {
            // Golden dust / Autumn leaves (simple diamond)
            ctx.beginPath();
            ctx.moveTo(0, -scale);
            ctx.lineTo(scale * 0.6, 0);
            ctx.lineTo(0, scale);
            ctx.lineTo(-scale * 0.6, 0);
            ctx.closePath();
            ctx.fill();
        } else if (theme.id === 'tsumugi') {
            // Minimal stone/thread shards
            ctx.beginPath();
            ctx.rect(-scale/2, -scale/2, scale, scale/4);
            ctx.fill();
        } else {
            // Classic Sakura Petal
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(scale/2, -scale/2, scale, -scale/2, 0, -scale);
            ctx.bezierCurveTo(-scale, -scale/2, -scale/2, -scale/2, 0, 0);
            ctx.fill();
        }
        
        ctx.restore();
    });

  }, [drops, ripples, particles, width, height, theme]);

  return <canvas ref={canvasRef} width={width} height={height} className="absolute inset-0 pointer-events-none z-20" />;
});

SakuraVisualizer.displayName = 'SakuraVisualizer';

export default SakuraVisualizer;
