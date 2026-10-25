import { useRef, useEffect } from 'react';

interface TiltOptions {
  maxTilt?: number;
  scale?: number;
  glare?: boolean;
  speed?: number;
}

export function use3dTilt<T extends HTMLElement>(options: TiltOptions = {}) {
  const ref = useRef<T | null>(null);
  const { maxTilt = 10, scale = 1.02, speed = 400 } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isHovered = false;

    const handleMouseEnter = () => {
      isHovered = true;
      el.style.transition = `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovered) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((centerY - y) / centerY) * maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      el.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`;
    };

    const handleMouseLeave = () => {
      isHovered = false;
      el.style.transition = `transform ${speed}ms ease-out`;
      el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    };

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [maxTilt, scale, speed]);

  return ref;
}
