"use client";

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  pulseSpeed: number;
  pulsePhase: number;
  hasGlow: boolean;
  color: string;
}

export function FlowingParticleBackdrop({
  particleCount = 160,
  className = '',
}: {
  particleCount?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Warm, refined palette matching the editorial aesthetic
    const colors = [
      'rgba(254, 243, 199, ', // Warm Ivory / Starlight
      'rgba(251, 191, 36, ',  // Amber
      'rgba(245, 158, 11, ',  // Deep Amber
      'rgba(226, 232, 240, ', // Neutral Slate / White
      'rgba(56, 189, 248, ',  // Faint Hydrologic Sky
    ];

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const isLarge = Math.random() < 0.2;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.32,
        vy: -0.15 - Math.random() * 0.28, // Upward drift like atmospheric stardust
        radius: isLarge ? Math.random() * 1.8 + 1.8 : Math.random() * 1.3 + 0.7,
        baseAlpha: Math.random() * 0.45 + 0.3,
        alpha: 0.45,
        pulseSpeed: Math.random() * 0.025 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
        hasGlow: isLarge || Math.random() < 0.35,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animationFrameId: number;
    let isVisible = true;

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize, { passive: true });

    let t = 0;
    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      if (!isVisible) return;

      t += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Render subtle network links between proximal particles
      const linkDist = 85;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            const linkAlpha = (1 - dist / linkDist) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(254, 243, 199, ${linkAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // Render floating particles with soft ambient starlight glow
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Organic wave motion
        p.x += p.vx + Math.sin(t + p.pulsePhase) * 0.18;
        p.y += p.vy;

        // Wrap around viewport edges smoothly
        if (p.x < -15) p.x = width + 15;
        if (p.x > width + 15) p.x = -15;
        if (p.y < -15) p.y = height + 15;
        if (p.y > height + 15) p.y = -15;

        // Breathing shimmer
        p.pulsePhase += p.pulseSpeed;
        p.alpha = p.baseAlpha * (0.75 + Math.sin(p.pulsePhase) * 0.25);

        // Soft outer glow halo for luminous nodes
        if (p.hasGlow) {
          const glowRadius = p.radius * 3.2;
          const grad = ctx.createRadialGradient(p.x, p.y, p.radius * 0.2, p.x, p.y, glowRadius);
          grad.addColorStop(0, `${p.color}${p.alpha * 0.8})`);
          grad.addColorStop(0.4, `${p.color}${p.alpha * 0.3})`);
          grad.addColorStop(1, `${p.color}0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Crisp luminous particle core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.min(1, p.alpha * 1.3)})`;
        ctx.fill();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onResize);
    };
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-0 h-full w-full ${className}`}
      style={{ opacity: 0.95 }}
    />
  );
}
export default FlowingParticleBackdrop;
