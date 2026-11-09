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
import { SiteConfigService } from '../../../../data/site-config.service';
import { FloatDirective, MagneticDirective } from '../../../../motion/directives';
import { MotionService } from '../../../../motion/motion.service';
import { pageTransition, pointerParallax, scrollParallax } from '../../../../motion/utilities';

/**
 * Cinematic hero. Entrance is one coordinated GSAP timeline (times match the creative brief):
 *  0.0 gradient · 0.2 backing circle · 0.35 organic image mask · 0.5 headline lines ·
 *  0.7 paragraph · 0.85 CTAs (stagger) · 1.0 decorative shapes + idle motion.
 * After it plays, only decorative layers move (pointer parallax, scroll drift); the photo stays stable.
 */
@Component({
  selector: 'app-home-hero',
  imports: [RouterLink, Icon, IdrPipe, ProductImage, MagneticDirective, FloatDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-hero.html',
  styleUrl: './home-hero.scss',
})
export class HomeHero {
  private readonly motion = inject(MotionService);
  private readonly catalog = inject(CatalogService);
  private readonly cart = inject(CartService);
  protected readonly siteConfig = inject(SiteConfigService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  private readonly title = viewChild.required<ElementRef<HTMLElement>>('title');
  private readonly circle = viewChild.required<ElementRef<HTMLElement>>('circle');
  private readonly frame = viewChild.required<ElementRef<HTMLElement>>('frame');
  private readonly img = viewChild.required<ElementRef<HTMLElement>>('img');
  private readonly copy = viewChild.required<ElementRef<HTMLElement>>('copy');
  private readonly visual = viewChild.required<ElementRef<HTMLElement>>('visual');

  protected readonly feature = computed(() => this.catalog.byHandle('dodora-baby-and-kids-body-bath') ?? this.catalog.all[0]);

  constructor() {
    afterNextRender(() => this.play());
  }

  protected add(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    const p = this.feature();
    this.cart.add(p, p.variants[0]);
  }
  protected mark(e: Event) {
    pageTransition.markSource((e.currentTarget as HTMLElement).querySelector('.hvp-img'));
  }

  private async play() {
    if (this.motion.env.reduced) return;
    const kit = await this.motion.whenKit();
    if (!kit) return;
    const { gsap, ScrollTrigger } = kit;
    const env = this.motion.env;
    const root = this.root().nativeElement;
    const q = gsap.utils.selector(root);
    const lines = q('.hero-title .ml-i');

    const ctx = gsap.context(() => {
      // ── Prime start states (content stays in DOM / readable for AT) ──
      gsap.set(q('[data-h-bg]'), { autoAlpha: 0 });
      gsap.set(this.circle().nativeElement, { scale: 0.55, autoAlpha: 0 });
      gsap.set(this.frame().nativeElement, { clipPath: 'circle(0% at 50% 62%)' });
      gsap.set(this.img().nativeElement, { scale: 1.16 });
      gsap.set(lines, { y: 0, yPercent: 115 });
      gsap.set(q('[data-h]'), { autoAlpha: 0, y: 22 });
      gsap.set(q('[data-h-cta]'), { autoAlpha: 0, y: 20, scale: 0.96 });
      gsap.set(q('[data-h-chip]'), { autoAlpha: 0, y: 30, scale: 0.94 });
      gsap.set(q('.h-orb'), { autoAlpha: 0 });
      this.title().nativeElement.classList.add('is-in');
      root.classList.add('is-primed');

      const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
      tl.to(q('[data-h-bg]'), { autoAlpha: 1, duration: 0.9 }, 0) //                     0.0  gradient
        .to(this.circle().nativeElement, { scale: 1, autoAlpha: 1, duration: 1.1, ease: 'expo.out' }, 0.2) // 0.2  backing circle
        .to(this.frame().nativeElement, { clipPath: 'circle(76% at 50% 50%)', duration: 1.15, ease: 'expo.out' }, 0.35) // 0.35 organic mask
        .to(this.img().nativeElement, { scale: 1, duration: 1.5, ease: 'expo.out', clearProps: 'transform' }, 0.35)
        .to(lines, { y: 0, yPercent: 0, duration: 0.85, stagger: 0.11, ease: 'expo.out', clearProps: 'transform' }, 0.5) // 0.5  headline
        .to(q('.hero-eyebrow'), { autoAlpha: 1, y: 0, duration: 0.6 }, 0.45)
        .to(q('.hero-lead'), { autoAlpha: 1, y: 0, duration: 0.7 }, 0.7) //               0.7  paragraph
        .to(q('[data-h-cta]'), { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.3)' }, 0.85) // 0.85 CTAs
        .to(q('.hero-cats'), { autoAlpha: 1, y: 0, duration: 0.6 }, 1.0)
        .to(q('[data-h-chip]'), { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.2)' }, 1.0) // 1.0  product chip
        .to(q('.h-orb'), { autoAlpha: 1, duration: 1.2, stagger: 0.12, ease: 'power2.out' }, 1.0); //        1.0  shapes (idle float runs)

      this.motion.whenPreloaderDone().then(() => tl.play());

      // ── Scroll-linked: decorative layers drift smoothly, photo & content stay stable and 100% visible ──
      if (!env.lite) {
        const k = env.mobile ? 0.4 : 0.7;
        const st = { trigger: root, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true };
        gsap.fromTo(q('.hero-grad'), { yPercent: 0 }, { yPercent: 8 * k, ease: 'none', scrollTrigger: st });
        gsap.fromTo(this.copy().nativeElement, { y: 0 }, { y: -20 * k, ease: 'none', scrollTrigger: st });
        gsap.fromTo(this.visual().nativeElement, { y: 0 }, { y: -24 * k, ease: 'none', scrollTrigger: st });
      }
    }, root);

    const parDispose = scrollParallax(kit, root, Array.from(root.querySelectorAll<HTMLElement>('.layer[data-speed]')), env);
    const ptrDispose = pointerParallax(kit, root, env);
    this.destroyRef.onDestroy(() => {
      ctx.revert();
      parDispose();
      ptrDispose();
      ScrollTrigger.refresh();
    });
  }
}
