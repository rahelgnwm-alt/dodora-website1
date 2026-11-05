/**
 * DODORA animation tokens. Mirrors the CSS custom properties in styles.scss.
 * Durations are in seconds (GSAP units); `ms` helpers are provided for CSS/Web APIs.
 */
export const DUR = {
  hover: 0.22, // 180–250ms
  button: 0.3, // 200–350ms
  card: 0.56, // 450–650ms
  headline: 0.78, // 650–900ms
  section: 0.9, // 700–1100ms
  page: 0.56, // 450–800ms
} as const;

export const EASE = {
  /** Natural ease-out — default for reveals. */
  out: 'power3.out',
  /** Softer, longer ease-out for large masks/headlines. */
  outExpo: 'expo.out',
  inOut: 'power2.inOut',
  /** Spring-like settle with a very small overshoot (no cartoon bounce). */
  spring: 'back.out(1.25)',
  /** Release of magnetic buttons. */
  springSoft: 'elastic.out(1, 0.5)',
  float: 'sine.inOut',
} as const;

export const STAGGER = {
  tight: 0.05,
  base: 0.08,
  loose: 0.14,
} as const;

export const BRAND = {
  salmon: '#F79C8A',
  pink: '#F1B0C4',
  blue: '#89AEDB',
  brown: '#AE625B',
  cream: '#FFF4EE',
} as const;

export const ms = (s: number) => Math.round(s * 1000);

