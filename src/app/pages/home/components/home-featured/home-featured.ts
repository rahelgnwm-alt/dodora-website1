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
import { ProductCard } from '../../../../components/product-card/product-card';
import { CatalogService } from '../../../../data/catalog.service';
import { FloatDirective, MagneticDirective, MaskDirective, RevealDirective, WordsDirective } from '../../../../motion/directives';
import { MotionService } from '../../../../motion/motion.service';

/**
 * Product discovery: the centre product rises from below, side products glide in from left/right,
 * decorative circles scale in behind. Transforms are cleared at the end so every card is a normal,
 * fully interactive element (hover, focus, tap).
 */
@Component({
  selector: 'app-home-featured',
  imports: [RouterLink, Icon, ProductCard, MagneticDirective, MaskDirective, RevealDirective, WordsDirective, FloatDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-featured.html',
  styleUrl: './home-featured.scss',
})
export class HomeFeatured {
  private readonly catalog = inject(CatalogService);
  private readonly motion = inject(MotionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');

  protected readonly left = computed(() => this.catalog.byHandle('dodora-baby-and-kids-gentle-hair-shampoo'));
  protected readonly center = computed(() => this.catalog.byHandle('dodora-baby-and-kids-body-bath'));
  protected readonly right = computed(() => this.catalog.byHandle('dodora-body-lotion-serum'));

  constructor() {
    afterNextRender(() => this.setup());
  }

  private async setup() {
    const env = this.motion.env;
    if (env.reduced) return;
    const kit = await this.motion.whenKit();
    if (!kit) return;
    const { gsap, ScrollTrigger } = kit;
    const root = this.root().nativeElement;
    const q = gsap.utils.selector(root);

    const ctx = gsap.context(() => {
      const side = env.mobile ? 0 : 140;
      const l = q('.fc-l');
      const c = q('.fc-c');
      const r = q('.fc-r');
      gsap.set(c, { y: 150, opacity: 0 });
      gsap.set(l, { x: -side, y: 60, opacity: 0 });
      gsap.set(r, { x: side, y: 60, opacity: 0 });
      gsap.set(q('.f-circle'), { scale: 0.6, autoAlpha: 0 });

      gsap
        .timeline({
          paused: false,
          defaults: { ease: 'expo.out' },
          scrollTrigger: { trigger: q('.feat-stage')[0], start: 'top 78%', once: true },
          // Release inline transforms so :hover lift/tilt and focus rings behave normally afterwards.
          onComplete: () => gsap.set([l, c, r], { clearProps: 'transform,opacity,visibility' }),
        })
        .to(q('.f-circle'), { scale: 1, autoAlpha: 1, duration: 1.3 }, 0)
        .to(c, { y: 0, opacity: 1, duration: 1.05 }, 0.05) // centre rises from below
        .to(l, { x: 0, y: 0, opacity: 1, duration: 1.0 }, 0.28) // sides enter from the sides
        .to(r, { x: 0, y: 0, opacity: 1, duration: 1.0 }, 0.34);
    }, root);

    this.destroyRef.onDestroy(() => {
      ctx.revert();
      ScrollTrigger.refresh();
    });
  }
}
