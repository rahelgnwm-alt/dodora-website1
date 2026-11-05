import type { gsap as GsapCore } from 'gsap';
import type { ScrollTrigger as ScrollTriggerCore } from 'gsap/ScrollTrigger';

export interface GsapKit {
  gsap: typeof GsapCore;
  ScrollTrigger: typeof ScrollTriggerCore;
}

let pending: Promise<GsapKit> | null = null;

/**
 * Dynamically imports GSAP + ScrollTrigger once. Keeps the animation engine out of the
 * initial bundle so first paint isn't blocked by it.
 */
export function loadGsap(): Promise<GsapKit> {
  return (pending ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([g, s]) => {
    g.gsap.registerPlugin(s.ScrollTrigger);
    g.gsap.defaults({ ease: 'power3.out' });
    return { gsap: g.gsap, ScrollTrigger: s.ScrollTrigger };
  }));
}

