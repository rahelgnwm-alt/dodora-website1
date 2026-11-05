import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { MotionService } from '../../motion/motion.service';

const SEEN_KEY = 'dodora:intro-seen';

/**
 * Cinematic preloader.
 *  Phase 1 — salmon circle appears and expands (organic ease)
 *  Phase 2 — logo emerges through a masked reveal while translucent shapes float
 *  Phase 3 — cream layer lifts away through a curved (SVG clip-path) mask, revealing the page
 * ≈1.7s total. Full sequence once per session; a ~0.4s fade on return. Not rendered at all for
 * reduced-motion users. The app is already mounted underneath — nothing is delayed.
 */
@Component({
  selector: 'app-preloader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './preloader.html',
  styleUrl: './preloader.scss',
})
export class Preloader {
  private readonly motion = inject(MotionService);
  protected readonly visible = signal(!this.motion.env.reduced);

  private readonly clip = viewChild<ElementRef<SVGPathElement>>('clip');
  private readonly layer = viewChild<ElementRef<HTMLElement>>('layer');
  private readonly circle = viewChild<ElementRef<HTMLElement>>('circle');
  private readonly logo = viewChild<ElementRef<HTMLElement>>('logo');

  constructor() {
    afterNextRender(() => this.run());
  }

  private async run() {
    if (this.motion.env.reduced) return this.motion.markPreloaderDone();
    document.documentElement.style.overflow = 'hidden';
    const returning = sessionStorage.getItem(SEEN_KEY) === '1';
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* private mode — harmless */
    }
    const kit = await this.motion.whenKit();
    const layer = this.layer()?.nativeElement;
    if (!kit || !layer) return this.finish();
    const { gsap } = kit;
    const path = this.clip()!.nativeElement;
    const circle = this.circle()!.nativeElement;
    const logo = this.logo()!.nativeElement;
    layer.style.clipPath = 'url(#pre-clip)';

    const done = () => this.finish();

    if (returning) {
      // Returning visit: a brief, quiet fade only.
      gsap.set(logo, { yPercent: 0 });
      gsap.set(circle, { scale: 0 });
      gsap
        .timeline({ onComplete: done })
        .call(() => this.motion.markPreloaderDone(), undefined, 0.12)
        .to(layer, { autoAlpha: 0, duration: 0.38, ease: 'power2.out' }, 0.1);
      return;
    }

    const curve = { p: 0 };
    const draw = () => {
      const e = 1 - curve.p; // edge height at the sides
      const bulge = 0.38 * Math.sin(Math.PI * curve.p); // belly of the curtain lags behind the sides
      path.setAttribute('d', curve.p >= 1 ? 'M0 0Z' : `M0 0H1V${e}Q0.5 ${e + bulge} 0 ${e}Z`);
    };

    gsap.set(circle, { scale: 0.12, autoAlpha: 1 });
    gsap.set(logo, { yPercent: 118 });
    gsap.set('.pre-orb', { scale: 0.4, autoAlpha: 0 });

    gsap
      .timeline({ onComplete: done, defaults: { ease: 'power3.out' } })
      // Phase 1 — circle appears + expands
      .to(circle, { scale: 1, duration: 0.62, ease: 'expo.out' }, 0)
      // Phase 2 — masked logo + floating translucent shapes
      .to(logo, { yPercent: 0, duration: 0.6, ease: 'expo.out' }, 0.28)
      .to('.pre-orb', { scale: 1, autoAlpha: 1, duration: 0.7, stagger: 0.06, ease: 'back.out(1.4)' }, 0.3)
      .to(circle, { scale: 1.06, duration: 0.5, ease: 'sine.inOut' }, 0.62)
      // Phase 3 — curved mask opens
      .to(
        curve,
        { p: 1, duration: 0.72, ease: 'power3.inOut', onUpdate: draw },
        0.98,
      )
      .call(() => this.motion.markPreloaderDone(), undefined, 1.25);
  }

  private finish() {
    document.documentElement.style.overflow = '';
    this.visible.set(false);
    this.motion.markPreloaderDone();
  }
}
