/**
 * DODORA motion utilities.
 *
 * Every utility:
 *  - is framework-agnostic (takes a GsapKit + element),
 *  - primes its own start state (so CSS pre-reveal rules only cover the pre-JS window),
 *  - returns a Disposer that kills every tween / ScrollTrigger / listener it created.
 * Angular directives in ./directives.ts bind these to component lifecycles.
 */
import type { GsapKit } from './gsap-loader';
import type { MotionEnv } from './env';
import { DUR, EASE, STAGGER } from './motion.tokens';

export type Disposer = () => void;
const noop: Disposer = () => undefined;
const markIn = (el: Element) => el.classList.add('is-in');
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// ───────────────────────── revealOnScroll ─────────────────────────
export interface RevealOpts {
  y?: number;
  x?: number;
  duration?: number;
  delay?: number;
  start?: string;
}

/** Soft rise-and-fade, fired once when the element enters the viewport. */
export function revealOnScroll(kit: GsapKit, el: HTMLElement, o: RevealOpts = {}): Disposer {
  const { gsap, ScrollTrigger } = kit;
  if (el.classList.contains('eyebrow')) {
    // Section labels use a CSS letter-spacing transition (see .eyebrow in styles.scss).
    const st = ScrollTrigger.create({ trigger: el, start: o.start ?? 'top 92%', once: true, onEnter: () => markIn(el) });
    return () => st.kill();
  }
  gsap.set(el, { autoAlpha: 0, y: o.y ?? 28, x: o.x ?? 0 });
  markIn(el);
  const tween = gsap.to(el, {
    autoAlpha: 1,
    x: 0,
    y: 0,
    duration: o.duration ?? DUR.card,
    delay: o.delay ?? 0,
    ease: EASE.out,
    paused: true,
    clearProps: 'opacity,visibility,transform',
  });
  const st = ScrollTrigger.create({ trigger: el, start: o.start ?? 'top 90%', once: true, onEnter: () => tween.play() });
  return () => {
    st.kill();
    tween.kill();
  };
}

// ───────────────────────── staggerChildren ─────────────────────────
export interface StaggerOpts extends RevealOpts {
  selector?: string;
  stagger?: number;
  scale?: number;
}

/** Reveals a group of children in sequence, with a single trigger for the whole group. */
export function staggerChildren(kit: GsapKit, parent: HTMLElement, o: StaggerOpts = {}): Disposer {
  const { gsap, ScrollTrigger } = kit;
  const items = o.selector ? Array.from(parent.querySelectorAll<HTMLElement>(o.selector)) : (Array.from(parent.children) as HTMLElement[]);
  if (!items.length) return noop;
  gsap.set(items, { autoAlpha: 0, y: o.y ?? 24, x: o.x ?? 0, scale: o.scale ?? 1 });
  items.forEach(markIn);
  markIn(parent);
  const tween = gsap.to(items, {
    autoAlpha: 1,
    x: 0,
    y: 0,
    scale: 1,
    duration: o.duration ?? DUR.card,
    delay: o.delay ?? 0,
    stagger: o.stagger ?? STAGGER.base,
    ease: EASE.out,
    paused: true,
    clearProps: 'opacity,visibility,transform',
  });
  const st = ScrollTrigger.create({ trigger: parent, start: o.start ?? 'top 85%', once: true, onEnter: () => tween.play() });
  return () => {
    st.kill();
    tween.kill();
  };
}

// ───────────────────────── maskedTextReveal ─────────────────────────
export interface MaskOpts {
  delay?: number;
  /** Play right away (e.g. hero) instead of waiting for scroll. */
  immediate?: boolean;
  start?: string;
  stagger?: number;
}

/**
 * Masked vertical line reveal. Expects markup: `<span class="ml"><span class="ml-i">Line</span></span>`.
 * Lines are real DOM text — selection, search and screen-reader order are untouched.
 */
export function maskedTextReveal(kit: GsapKit, el: HTMLElement, o: MaskOpts = {}): Disposer {
  const { gsap, ScrollTrigger } = kit;
  const lines = Array.from(el.querySelectorAll<HTMLElement>('.ml-i'));
  if (!lines.length) return noop;
  gsap.set(lines, { yPercent: 115 });
  markIn(el);
  const tween = gsap.to(lines, {
    yPercent: 0,
    duration: DUR.headline,
    delay: o.delay ?? 0,
    stagger: o.stagger ?? 0.1,
    ease: EASE.outExpo,
    paused: !o.immediate,
    clearProps: 'transform',
  });
  const st = o.immediate
    ? null
    : ScrollTrigger.create({ trigger: el, start: o.start ?? 'top 88%', once: true, onEnter: () => tween.play() });
  return () => {
    st?.kill();
    tween.kill();
  };
}

// ───────────────────────── words reveal (editorial text) ─────────────────────────
/** Splits plain text into word spans. Keeps the full sentence in aria-label; spans are aria-hidden. */
export function splitWords(el: HTMLElement): () => void {
  const original = el.textContent ?? '';
  el.setAttribute('aria-label', original.trim().replace(/\s+/g, ' '));
  el.textContent = '';
  original
    .trim()
    .split(/\s+/)
    .forEach((word, i, arr) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = word + (i < arr.length - 1 ? ' ' : '');
      el.appendChild(span);
    });
  return () => {
    el.textContent = original;
    el.removeAttribute('aria-label');
  };
}

export function wordsReveal(kit: GsapKit, el: HTMLElement, o: RevealOpts & { stagger?: number } = {}): Disposer {
  const { gsap, ScrollTrigger } = kit;
  const revert = splitWords(el);
  const words = Array.from(el.querySelectorAll<HTMLElement>('.w'));
  gsap.set(words, { autoAlpha: 0, y: '0.6em' });
  markIn(el);
  const tween = gsap.to(words, {
    autoAlpha: 1,
    y: 0,
    duration: DUR.card,
    delay: o.delay ?? 0,
    stagger: o.stagger ?? 0.03,
    ease: EASE.out,
    paused: true,
    clearProps: 'opacity,visibility,transform',
  });
  const st = ScrollTrigger.create({ trigger: el, start: o.start ?? 'top 88%', once: true, onEnter: () => tween.play() });
  return () => {
    st.kill();
    tween.kill();
    revert();
  };
}

// ───────────────────────── magneticButton ─────────────────────────
export interface MagneticOpts {
  /** Fraction of pointer offset the button follows. */
  strength?: number;
  /** Hard cap in px — movement always stays small. */
  max?: number;
  /** Extra detection margin around the button in px. */
  pad?: number;
}

/**
 * Soft spring-based magnetic pull toward the pointer. Button never moves away from the cursor;
 * the label moves with a smaller offset; release springs back. Disabled on touch / reduced motion.
 */
export function magneticButton(kit: GsapKit, el: HTMLElement, env: MotionEnv, o: MagneticOpts = {}): Disposer {
  if (env.reduced || !env.finePointer || env.lite) return noop;
  const { gsap } = kit;
  const strength = o.strength ?? 0.28;
  const max = o.max ?? 10;
  const pad = o.pad ?? 44;
  const label = el.querySelector<HTMLElement>('.btn-label');
  let active = false;
  let frame = 0;
  let last: PointerEvent | null = null;

  const release = () => {
    if (!active) return;
    active = false;
    gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: EASE.springSoft, overwrite: 'auto' });
    if (label) gsap.to(label, { x: 0, y: 0, duration: 0.9, ease: EASE.springSoft, overwrite: 'auto' });
  };

  const tick = () => {
    frame = 0;
    const e = last;
    if (!e) return;
    const r = el.getBoundingClientRect();
    const inside = e.clientX > r.left - pad && e.clientX < r.right + pad && e.clientY > r.top - pad && e.clientY < r.bottom + pad;
    if (!inside) return release();
    active = true;
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const nx = clamp(dx * strength, -max, max);
    const ny = clamp(dy * strength, -max, max);
    gsap.to(el, { x: nx, y: ny, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
    if (label) gsap.to(label, { x: nx * 0.4, y: ny * 0.4, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  const onMove = (e: PointerEvent) => {
    last = e;
    if (!frame) frame = requestAnimationFrame(tick);
  };

  let listening = false;
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !listening) {
      window.addEventListener('pointermove', onMove, { passive: true });
      listening = true;
    } else if (!entry.isIntersecting && listening) {
      window.removeEventListener('pointermove', onMove);
      listening = false;
      release();
    }
  });
  io.observe(el);
  document.addEventListener('pointerleave', release);

  return () => {
    io.disconnect();
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', release);
    cancelAnimationFrame(frame);
    gsap.killTweensOf([el, label].filter(Boolean));
    gsap.set([el, label].filter(Boolean), { clearProps: 'transform' });
  };
}

// ───────────────────────── productFloat ─────────────────────────
export interface FloatOpts {
  /** Vertical travel in px. */
  amp?: number;
  /** Max rotation in degrees. */
  rotate?: number;
  /** Scale breathing amount (0.02 = 2%). */
  breathe?: number;
  /** Base period in seconds; x and scale use irrational ratios so the loop never visibly repeats. */
  duration?: number;
}

/**
 * Signature DODORA idle motion: very slow vertical float, gentle lateral drift and tiny scale
 * breathing on independent periods (organic, no jitter). Paused whenever offscreen.
 */
export function productFloat(kit: GsapKit, el: HTMLElement, env: MotionEnv, o: FloatOpts = {}): Disposer {
  if (env.reduced) return noop;
  const { gsap } = kit;
  const k = env.mobile ? 0.6 : 1;
  const amp = (o.amp ?? 12) * k;
  const base = o.duration ?? 5 + Math.random() * 2.5;
  const tweens: gsap.core.Tween[] = [
    gsap.fromTo(el, { y: amp * 0.5 }, { y: -amp * 0.5, duration: base, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true }),
  ];
  if (!env.lite) {
    const dx = amp * 0.35;
    tweens.push(
      gsap.fromTo(el, { x: -dx }, { x: dx, duration: base * 1.37, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true }),
      gsap.fromTo(
        el,
        { rotation: -(o.rotate ?? 2), scale: 1 - (o.breathe ?? 0.02) },
        { rotation: o.rotate ?? 2, scale: 1 + (o.breathe ?? 0.02), duration: base * 1.71, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true },
      ),
    );
  }
  tweens.forEach((t) => t.progress(Math.random()));
  const io = new IntersectionObserver(([e]) => tweens.forEach((t) => (e.isIntersecting ? t.play() : t.pause())), { rootMargin: '80px' });
  io.observe(el);
  return () => {
    io.disconnect();
    tweens.forEach((t) => t.kill());
  };
}

// ───────────────────────── backgroundMorph ─────────────────────────
/**
 * Morphs a CSS variable (default `--page-bg` on <body>) between each section's `data-bg` colour as
 * the section crosses the viewport centre — a continuous colour narrative with zero layout cost.
 */
export function backgroundMorph(kit: GsapKit, sections: HTMLElement[], target: HTMLElement = document.body, prop = '--page-bg'): Disposer {
  const { gsap, ScrollTrigger } = kit;
  const triggers = sections
    .filter((s) => s.dataset['bg'])
    .map((section) =>
      ScrollTrigger.create({
        trigger: section,
        start: 'top 62%',
        end: 'bottom 62%',
        onToggle: (self) => {
          if (self.isActive) gsap.to(target, { [prop]: section.dataset['bg'], duration: DUR.section, ease: EASE.inOut, overwrite: 'auto' });
        },
      }),
    );
  return () => {
    triggers.forEach((t) => t.kill());
    gsap.killTweensOf(target);
  };
}

// ───────────────────────── pointer + scroll parallax ─────────────────────────
/** Extremely subtle pointer parallax. Elements declare depth with `data-depth` (px of max travel). */
export function pointerParallax(kit: GsapKit, root: HTMLElement, env: MotionEnv, selector = '[data-depth]'): Disposer {
  if (env.reduced || !env.finePointer || env.lite || env.mobile) return noop;
  const { gsap } = kit;
  const layers = Array.from(root.querySelectorAll<HTMLElement>(selector)).map((el) => ({
    x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3.out' }),
    y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3.out' }),
    d: parseFloat(el.dataset['depth'] ?? '0'),
  }));
  const onMove = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    layers.forEach((l) => {
      l.x(nx * l.d);
      l.y(ny * l.d);
    });
  };
  const onLeave = () => layers.forEach((l) => (l.x(0), l.y(0)));
  root.addEventListener('pointermove', onMove, { passive: true });
  root.addEventListener('pointerleave', onLeave);
  return () => {
    root.removeEventListener('pointermove', onMove);
    root.removeEventListener('pointerleave', onLeave);
  };
}

/** Scroll-linked vertical drift (scrubbed, no artificial delay). `data-speed` is the y travel in px. */
export function scrollParallax(kit: GsapKit, trigger: HTMLElement, targets: HTMLElement[], env: MotionEnv): Disposer {
  if (env.reduced || env.lite) return noop;
  const { gsap } = kit;
  const k = env.mobile ? 0.35 : 0.7;
  const ctx = gsap.context(() => {
    targets.forEach((el) => {
      const dist = parseFloat(el.dataset['speed'] ?? '60') * k;
      gsap.fromTo(
        el,
        { y: -dist * 0.5 },
        { y: dist * 0.5, ease: 'none', scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: 0.8 } },
      );
    });
  }, trigger);
  return () => ctx.revert();
}

// ───────────────────────── productCardHover ─────────────────────────
/**
 * Pointer-tracked gradient highlight for product cards. The lift / image scale / shadow / CTA
 * emphasis are pure CSS (cheaper, and always keyboard-reachable via :focus-within).
 */
export function productCardHover(el: HTMLElement, env: MotionEnv): Disposer {
  if (env.reduced || !env.finePointer) return noop;
  let frame = 0;
  const onMove = (e: PointerEvent) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  };
  el.addEventListener('pointermove', onMove, { passive: true });
  return () => {
    el.removeEventListener('pointermove', onMove);
    cancelAnimationFrame(frame);
  };
}

// ───────────────────────── stickyHeaderAnimation ─────────────────────────
/** Toggles `.is-compact` once the page leaves the top. IO-based: no scroll handler, no layout reads. */
export function stickyHeaderAnimation(header: HTMLElement, sentinel: HTMLElement): Disposer {
  const io = new IntersectionObserver(([e]) => header.classList.toggle('is-compact', !e.isIntersecting), { rootMargin: '0px' });
  io.observe(sentinel);
  return () => io.disconnect();
}

// ───────────────────────── pageTransition (View Transitions API) ─────────────────────────
export const pageTransition = {
  supported: () => typeof document !== 'undefined' && 'startViewTransition' in document,
  /** Marks the clicked product image as the shared element for the next view transition. */
  markSource(el: HTMLElement | null) {
    this.clear();
    if (!el || !this.supported()) return;
    el.style.setProperty('view-transition-name', 'product-hero');
    el.dataset['vtSource'] = '1';
  },
  clear() {
    document.querySelectorAll<HTMLElement>('[data-vt-source]').forEach((n) => {
      n.style.removeProperty('view-transition-name');
      delete n.dataset['vtSource'];
    });
  },
};

