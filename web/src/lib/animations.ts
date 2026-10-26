import gsap from 'gsap';

/**
 * Luxury UI GSAP animation helpers for high-end intelligence HUD feel.
 * Implements silky ease curves (power3.out, expo.out).
 */

export function animateFadeInUp(target: string | Element, delay: number = 0, y: number = 24) {
  return gsap.fromTo(
    target,
    {
      opacity: 0,
      y,
      filter: 'blur(8px)',
    },
    {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.85,
      delay,
      ease: 'power3.out',
    }
  );
}

export function animateStaggerList(targets: string | Element[], stagger: number = 0.06, delay: number = 0.1) {
  return gsap.fromTo(
    targets,
    {
      opacity: 0,
      x: -16,
      filter: 'blur(4px)',
    },
    {
      opacity: 1,
      x: 0,
      filter: 'blur(0px)',
      duration: 0.65,
      stagger,
      delay,
      ease: 'power3.out',
    }
  );
}

export function animateDrawerSlide(target: string | Element, isOpen: boolean) {
  if (isOpen) {
    return gsap.fromTo(
      target,
      {
        x: '100%',
        opacity: 0,
      },
      {
        x: '0%',
        opacity: 1,
        duration: 0.5,
        ease: 'expo.out',
      }
    );
  } else {
    return gsap.to(target, {
      x: '100%',
      opacity: 0,
      duration: 0.35,
      ease: 'power3.in',
    });
  }
}

export function animateMetricCount(
  fromVal: number,
  toVal: number,
  onUpdate: (v: number) => void,
  duration: number = 1.2
) {
  const obj = { val: fromVal };
  return gsap.to(obj, {
    val: toVal,
    duration,
    ease: 'power2.out',
    onUpdate: () => onUpdate(Math.round(obj.val)),
  });
}
