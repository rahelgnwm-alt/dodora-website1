/** Runtime capability checks used to scale (or skip) decorative motion. */
export interface MotionEnv {
  reduced: boolean;
  /** Mouse/trackpad primary input — pointer effects (magnetic, parallax, zoom) allowed. */
  finePointer: boolean;
  /** Weak device / data-saver: disable expensive decorative effects. */
  lite: boolean;
  /** Narrow viewport: reduce parallax intensity. */
  mobile: boolean;
}

export function readEnv(): MotionEnv {
  const mm = (q: string) => typeof matchMedia === 'function' && matchMedia(q).matches;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const lite =
    (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) ||
    (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2) ||
    nav.connection?.saveData === true;
  return {
    reduced: mm('(prefers-reduced-motion: reduce)'),
    finePointer: mm('(hover: hover) and (pointer: fine)'),
    lite,
    mobile: mm('(max-width: 899px)'),
  };
}

