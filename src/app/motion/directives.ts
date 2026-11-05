import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { MotionService } from './motion.service';
import type { GsapKit } from './gsap-loader';
import {
  type Disposer,
  magneticButton,
  maskedTextReveal,
  productCardHover,
  productFloat,
  revealOnScroll,
  staggerChildren,
  wordsReveal,
} from './utilities';

/**
 * Binds a motion utility to an element for the lifetime of its Angular host.
 * Waits for GSAP, skips when unavailable/reduced (content just shows), disposes on destroy.
 */
function attach(
  motion: MotionService,
  destroyRef: DestroyRef,
  el: HTMLElement,
  factory: (kit: GsapKit) => Disposer | void,
  reducedFallback = true,
) {
  if (motion.env.reduced) {
    if (reducedFallback) el.classList.add('is-in');
    return;
  }
  let dead = false;
  let dispose: Disposer | void;
  motion.whenKit().then((kit) => {
    if (dead) return;
    if (!kit) return el.classList.add('is-in');
    dispose = factory(kit);
  });
  destroyRef.onDestroy(() => {
    dead = true;
    if (dispose) dispose();
  });
}

abstract class MotionDirective {
  protected readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly motion = inject(MotionService);
  protected readonly destroyRef = inject(DestroyRef);
  protected bind(factory: (kit: GsapKit) => Disposer | void, reducedFallback = true) {
    afterNextRender(() => attach(this.motion, this.destroyRef, this.el, factory, reducedFallback));
  }
}

/** revealOnScroll */
@Directive({ selector: '[dReveal]', host: { 'data-reveal': '' } })
export class RevealDirective extends MotionDirective {
  readonly revealY = input<number>(28);
  readonly revealX = input<number>(0);
  readonly revealDelay = input<number>(0);
  constructor() {
    super();
    this.bind((kit) => revealOnScroll(kit, this.el, { y: this.revealY(), x: this.revealX(), delay: this.revealDelay() }));
  }
}

/** staggerChildren */
@Directive({ selector: '[dStagger]', host: { 'data-stagger': '' } })
export class StaggerDirective extends MotionDirective {
  readonly staggerSelector = input<string>();
  readonly staggerStep = input<number>(0.08);
  readonly staggerY = input<number>(24);
  readonly staggerScale = input<number>(1);
  constructor() {
    super();
    this.bind((kit) =>
      staggerChildren(kit, this.el, {
        selector: this.staggerSelector(),
        stagger: this.staggerStep(),
        y: this.staggerY(),
        scale: this.staggerScale(),
      }),
    );
  }
}

/** maskedTextReveal */
@Directive({ selector: '[dMask]', host: { 'data-mask': '' } })
export class MaskDirective extends MotionDirective {
  readonly maskDelay = input<number>(0);
  constructor() {
    super();
    this.bind((kit) => maskedTextReveal(kit, this.el, { delay: this.maskDelay() }));
  }
}

/** Editorial word stagger */
@Directive({ selector: '[dWords]', host: { 'data-words': '' } })
export class WordsDirective extends MotionDirective {
  constructor() {
    super();
    this.bind((kit) => wordsReveal(kit, this.el));
  }
}

/** magneticButton */
@Directive({ selector: '[dMagnetic]' })
export class MagneticDirective extends MotionDirective {
  constructor() {
    super();
    this.bind((kit) => magneticButton(kit, this.el, this.motion.env), false);
  }
}

/** productFloat */
@Directive({ selector: '[dFloat]' })
export class FloatDirective extends MotionDirective {
  readonly floatAmp = input<number>(12);
  readonly floatRotate = input<number>(2);
  readonly floatDuration = input<number>();
  constructor() {
    super();
    this.bind(
      (kit) => productFloat(kit, this.el, this.motion.env, { amp: this.floatAmp(), rotate: this.floatRotate(), duration: this.floatDuration() }),
      false,
    );
  }
}

/** productCardHover (pointer-tracked gradient) */
@Directive({ selector: '[dCardHover]' })
export class CardHoverDirective extends MotionDirective {
  constructor() {
    super();
    afterNextRender(() => {
      const d = productCardHover(this.el, this.motion.env);
      this.destroyRef.onDestroy(d);
    });
  }
}

export const MOTION_DIRECTIVES = [
  RevealDirective,
  StaggerDirective,
  MaskDirective,
  WordsDirective,
  MagneticDirective,
  FloatDirective,
  CardHoverDirective,
] as const;

