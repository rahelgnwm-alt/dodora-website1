import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../../components/icon/icon';
import { IdrPipe, ProductImage } from '../../../../components/product-image/product-image';
import { CartService } from '../../../../data/cart.service';
import { CatalogService } from '../../../../data/catalog.service';
import { type LandingPhotoKey, SiteConfigService } from '../../../../data/site-config.service';
import { MagneticDirective } from '../../../../motion/directives';
import { MotionService } from '../../../../motion/motion.service';

/**
 * Product storytelling — pinned 4-stage sequence on desktop & tablet:
 *  1 product settles in  →  2 ingredient visuals emerge  →  3 verified info reveals  →  4 product
 *  settles beside the purchase CTA.
 * Product packaging is only ever translated / uniformly scaled — never skewed or cropped.
 * Mobile & reduced motion get a clean stacked layout with non-pinned scroll animations.
 * All copy below is taken from DODORA's own product listing / packaging graphics.
 */
@Component({
  selector: 'app-home-story',
  imports: [RouterLink, Icon, IdrPipe, ProductImage, MagneticDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-story.html',
  styleUrl: './home-story.scss',
})
export class HomeStory {
  private readonly catalog = inject(CatalogService);
  private readonly cart = inject(CartService);
  protected readonly siteConfig = inject(SiteConfigService);
  private readonly motion = inject(MotionService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  private readonly pin = viewChild.required<ElementRef<HTMLElement>>('pin');
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');

  protected readonly p = computed(() => this.catalog.byHandle('dodora-baby-and-kids-gentle-hair-shampoo') ?? this.catalog.all[0]);

  protected readonly ingredients: { name: string; benefit: string; photoKey: LandingPhotoKey }[] = [
    { name: 'Ekstrak Ginseng', benefit: 'Merangsang pertumbuhan rambut Si Kecil', photoKey: 'storyIng0' },
    { name: 'Aloe Vera', benefit: 'Melembapkan & menjaga kulit kepala Si Kecil tetap sehat', photoKey: 'storyIng1' },
    { name: 'Ekstrak Centella Asiatica', benefit: 'Menenangkan kulit kepala Si Kecil yang gatal', photoKey: 'storyIng2' },
    { name: 'Argan Oil', benefit: 'Kaya asam lemak dan Vitamin E untuk membantu memperkuat akar rambut', photoKey: 'storyIng3' },
  ];
  protected readonly claims = ['No paraben', 'No silicons', 'No mineral oil', 'pH balanced', 'Dapat digunakan anak 0+'];

  constructor() {
    afterNextRender(() => this.setup());
  }

  protected add() {
    const p = this.p();
    if (p) this.cart.add(p, p.variants[0]);
  }

  private async setup() {
    if (this.motion.env.reduced) return;
    const kit = await this.motion.whenKit();
    if (!kit) return;
    const { gsap, ScrollTrigger } = kit;
    const root = this.root().nativeElement;
    const q = gsap.utils.selector(root);
    const mm = gsap.matchMedia();

    // Pinned 4-stage storytelling choreography on all desktop & tablet viewports (no min-height or lite lockout)
    mm.add('(min-width: 768px)', () => {
      root.classList.add('is-pinned');
      const pinEl = this.pin().nativeElement;
      const stageEl = this.stage().nativeElement;
      const lines = q('.s-title .ml-i');
      const headMeta = q('.s-head .eyebrow, .s-sub');
      const fig = q('.s-fig');
      const figIn = q('.s-fig-in');
      const ingImgs = q('.ing-img');
      const ingTxt = q('.ing-txt');
      const claims = q('.s-claims li');
      const cta = q('.s-cta');

      gsap.set(fig, { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1 });
      gsap.set(figIn, { scale: 0.82, y: 64, autoAlpha: 0 });
      gsap.set(lines, { yPercent: 115 });
      gsap.set(headMeta, { autoAlpha: 0, y: 14 });
      gsap.set(ingImgs, { autoAlpha: 0, scale: 0.3 });
      gsap.set(ingTxt, { autoAlpha: 0, y: 16, clipPath: 'inset(0 0 100% 0)' });
      gsap.set(claims, { autoAlpha: 0, y: 12 });
      gsap.set(cta, { yPercent: -50, x: 70, autoAlpha: 0 });
      gsap.set(q('.sbg-2, .sbg-3'), { autoAlpha: 0 });

      // Stage 1 — Product & headline rise smoothly into center as the section enters view
      gsap
        .timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: root,
            start: 'top 82%',
            end: 'top top',
            scrub: 0.35,
            invalidateOnRefresh: true,
          },
        })
        .to(lines, { yPercent: 0, duration: 0.7, ease: 'expo.out' }, 0)
        .to(headMeta, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.08 }, 0.1)
        .to(figIn, { autoAlpha: 1, scale: 1, y: 0, duration: 0.9, ease: 'power2.out' }, 0.05);

      // Stages 2–4 — Pinned storytelling sequence
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: pinEl,
          start: 'top top',
          end: '+=210%',
          pin: true,
          scrub: 0.4,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Stage 2 — Ingredient visuals emerge radially from behind the centered product
      tl.to(q('.sbg-2'), { autoAlpha: 1, duration: 0.8 }, 0.05)
        .to(fig, { scale: 1.03, duration: 0.8, ease: 'sine.out' }, 0.05)
        .fromTo(
          ingImgs,
          {
            x: (_i, el: HTMLElement) => stageCenterDelta(gsap, el, stageEl).x,
            y: (_i, el: HTMLElement) => stageCenterDelta(gsap, el, stageEl).y,
            autoAlpha: 0,
            scale: 0.3,
          },
          { x: 0, y: 0, autoAlpha: 1, scale: 1, duration: 0.95, stagger: 0.1, ease: 'back.out(1.2)' },
          0.1,
        )
        // Stage 3 — Verified product information & formula claims reveal
        .to(q('.sbg-3'), { autoAlpha: 1, duration: 0.8 }, 1.15)
        .to(ingTxt, { autoAlpha: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.6, stagger: 0.1 }, 1.2)
        .to(claims, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.07 }, 1.5)
        // Stage 4 — Product settles beside the purchase CTA
        .to([q('.s-ings'), q('.s-claims')], { autoAlpha: 0, scale: 0.94, duration: 0.55, ease: 'power2.in' }, 2.35)
        .to(q('.sbg-2, .sbg-3'), { autoAlpha: 0, duration: 0.6 }, 2.35)
        .to(fig, { x: () => -stageEl.offsetWidth * 0.22, scale: 1, duration: 0.85, ease: 'power3.inOut' }, 2.4)
        .to(cta, { autoAlpha: 1, x: 0, duration: 0.7 }, 2.65)
        .to({}, { duration: 0.4 }); // short hold so the CTA is readable before unpin

      requestAnimationFrame(() => ScrollTrigger.refresh());
      return () => root.classList.remove('is-pinned');
    });

    // Mobile layouts: scrubbed depth + staggered scroll reveals without touch scroll-jacking
    mm.add('(max-width: 767px)', () => {
      const lines = q('.s-title .ml-i');
      const headMeta = q('.s-head .eyebrow, .s-sub');
      const figIn = q('.s-fig-in');
      const ings = q('.ing');
      const claims = q('.s-claims li');
      const cta = q('.s-cta');

      gsap.from(lines, {
        yPercent: 115,
        duration: 0.75,
        ease: 'expo.out',
        scrollTrigger: { trigger: q('.s-head')[0], start: 'top 86%' },
      });
      gsap.from(headMeta, {
        autoAlpha: 0,
        y: 14,
        duration: 0.55,
        stagger: 0.08,
        scrollTrigger: { trigger: q('.s-head')[0], start: 'top 86%' },
      });
      gsap.fromTo(
        figIn,
        { scale: 0.88, y: 36 },
        {
          scale: 1,
          y: 0,
          ease: 'none',
          scrollTrigger: { trigger: figIn[0], start: 'top 90%', end: 'center 55%', scrub: 0.4 },
        },
      );
      gsap.from(ings, {
        autoAlpha: 0,
        y: 26,
        scale: 0.96,
        duration: 0.6,
        stagger: 0.09,
        ease: 'power2.out',
        scrollTrigger: { trigger: q('.s-ings')[0], start: 'top 85%' },
      });
      gsap.from(claims, {
        autoAlpha: 0,
        y: 14,
        duration: 0.45,
        stagger: 0.06,
        scrollTrigger: { trigger: q('.s-claims')[0], start: 'top 88%' },
      });
      gsap.from(cta, {
        autoAlpha: 0,
        y: 28,
        duration: 0.65,
        ease: 'power2.out',
        scrollTrigger: { trigger: cta[0], start: 'top 88%' },
      });
    });

    this.destroyRef.onDestroy(() => {
      mm.revert();
      ScrollTrigger.refresh();
    });
  }
}

function stageCenterDelta(gsap: { getProperty(target: object, property: string): string | number }, el: HTMLElement, stageEl: HTMLElement) {
  const a = el.getBoundingClientRect();
  const b = stageEl.getBoundingClientRect();
  const tx = Number(gsap.getProperty(el, 'x')) || 0;
  const ty = Number(gsap.getProperty(el, 'y')) || 0;
  return {
    x: b.left + b.width / 2 - (a.left + a.width / 2 - tx),
    y: b.top + b.height / 2 - (a.top + a.height / 2 - ty),
  };
}
