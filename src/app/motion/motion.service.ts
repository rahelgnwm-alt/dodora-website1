import { Injectable, signal } from '@angular/core';
import { readEnv, type MotionEnv } from './env';
import { loadGsap, type GsapKit } from './gsap-loader';

/** Flip to false to fall back to native scrolling everywhere. */
const ENABLE_LENIS = true;

/**
 * Central motion runtime: capability flags, lazy GSAP kit, optional Lenis smooth scroll,
 * and the preloader hand-off that gates the hero intro.
 */
@Injectable({ providedIn: 'root' })
export class MotionService {
  readonly env: MotionEnv = readEnv();
  /** True once the cinematic preloader has opened (hero intro waits for this). */
  readonly preloaderDone = signal(this.env.reduced);

  private kitPromise: Promise<GsapKit | null> | null = null;
  private lenis: { stop(): void; start(): void; scrollTo(v: number | HTMLElement, o?: object): void } | null = null;
  private locks = 0;
  private preloaderWaiters: Array<() => void> = [];

  /** Resolves with GSAP (or null if it failed to load — callers then show content immediately). */
  whenKit(): Promise<GsapKit | null> {
    if (this.env.reduced) return Promise.resolve(null);
    return (this.kitPromise ??= loadGsap()
      .then(async (kit) => {
        await this.initLenis(kit);
        return kit;
      })
      .catch(() => {
        document.documentElement.classList.remove('motion'); // never leave content hidden
        return null;
      }));
  }

  /** Resolves when the preloader is gone; immediately if it never ran. */
  whenPreloaderDone(): Promise<void> {
    return this.preloaderDone() ? Promise.resolve() : new Promise((res) => this.preloaderWaiters.push(res));
  }

  markPreloaderDone() {
    this.preloaderDone.set(true);
    this.preloaderWaiters.splice(0).forEach((r) => r());
  }

  /** Lock / unlock page scroll (modal drawers, mobile menu). Counts nested locks. */
  lockScroll(lock: boolean) {
    this.locks = Math.max(0, this.locks + (lock ? 1 : -1));
    if (this.locks > 0) this.lenis?.stop();
    else this.lenis?.start();
  }

  /** Smoothly scroll to an element by ID, accounting for sticky header and Lenis when active. */
  scrollToId(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    if (this.lenis && !this.env.reduced) {
      this.lenis.scrollTo(el, { offset: -88, duration: 1.05 });
    } else {
      el.scrollIntoView({ behavior: this.env.reduced ? 'auto' : 'smooth', block: 'start' });
    }
  }

  private async initLenis(kit: GsapKit) {
    // Lenis only on fine-pointer, capable desktops: touch/keyboard/AT users keep 100% native scroll.
    const { finePointer, lite, mobile } = this.env;
    if (!ENABLE_LENIS || !finePointer || lite || mobile) return;
    try {
      const { default: Lenis } = await import('lenis');
      const lenis = new Lenis({
        duration: 0.9,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        anchors: false,
        wheelMultiplier: 0.95,
      });

      // Synchronize Lenis with GSAP ScrollTrigger
      lenis.on('scroll', kit.ScrollTrigger.update);
      kit.gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      // lagSmoothing(0) prevents GSAP from clamping Lenis RAF delta on scroll start
      kit.gsap.ticker.lagSmoothing(0);
      this.lenis = lenis;
    } catch {
      /* native scroll remains */
    }
  }
}

