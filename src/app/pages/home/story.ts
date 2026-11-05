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
import { CartService } from '../../data/cart.service';
import { CatalogService } from '../../data/catalog.service';
import { MagneticDirective } from '../../motion/directives';
import { MotionService } from '../../motion/motion.service';
import { IconComponent } from '../../ui/icon';
import { IdrPipe, ProductImageComponent } from '../../ui/product-image';

/**
 * Product storytelling — one short pinned sequence (~1.8 screens), only on capable desktops:
 *  1 product settles in  →  2 ingredient visuals emerge  →  3 verified info reveals  →  4 product
 *  settles beside the purchase CTA.
 * Product packaging is only ever translated / uniformly scaled — never skewed or cropped.
 * Mobile & reduced motion get a clean, fully-visible stacked layout (no pinning).
 * All copy below is taken from DODORA's own product listing / packaging graphics.
 */
@Component({
  selector: 'app-story',
  imports: [RouterLink, IconComponent, IdrPipe, ProductImageComponent, MagneticDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './story.scss',
  template: `
    <section class="story" #root aria-labelledby="story-title" data-bg="#FBD9D8">
      <div class="s-pin" #pin>
        <div class="s-bg" aria-hidden="true">
          <span class="sbg sbg-1"></span>
          <span class="sbg sbg-2"></span>
          <span class="sbg sbg-3"></span>
          <span class="orb orb--pink" style="--s: 120px; left: 6%; top: 18%"></span>
          <span class="orb orb--blue" style="--s: 66px; right: 9%; top: 12%"></span>
          <span class="orb orb--salmon" style="--s: 90px; right: 14%; bottom: 10%"></span>
        </div>

        <div class="container s-wrap">
          <header class="s-head">
            <p class="eyebrow">Kenali lebih dekat</p>
            <h2 id="story-title" class="s-title">
              <span class="ml"><span class="ml-i">Gentle Hair Shampoo</span></span>
            </h2>
            <p class="s-sub">Membersihkan kulit kepala dengan lembut</p>
          </header>

          <div class="s-stage" #stage>
            @if (p(); as prod) {
              <div class="s-fig">
                <app-pimg [src]="prod.images[0]" [alt]="prod.name + ' — kemasan produk'" sizes="(min-width: 900px) 30vw, 80vw" />
              </div>
            }

            <ul class="s-ings" aria-label="Bahan aktif alami">
              @for (ing of ingredients; track ing.name; let i = $index) {
                <li class="ing" [class]="'ing ing-' + i">
                  <img class="ing-img" [src]="'img/' + ing.img" width="120" height="120" alt="" loading="lazy" decoding="async" />
                  <div class="ing-txt">
                    <h3>{{ ing.name }}</h3>
                    <p>{{ ing.benefit }}</p>
                  </div>
                </li>
              }
            </ul>

            <ul class="s-claims" aria-label="Klaim formula">
              @for (c of claims; track c) {
                <li><app-icon name="check" [size]="16" [stroke]="3" /> {{ c }}</li>
              }
            </ul>

            @if (p(); as prod) {
              <div class="s-cta">
                <p class="eyebrow">Siap dibawa pulang</p>
                <h3>{{ prod.name }}</h3>
                <p class="s-meta">Netto {{ prod.netto[0] }} · BPOM {{ prod.bpom[0] }}</p>
                <p class="s-price">{{ prod.variants[0].price | idr }}</p>
                <div class="s-actions">
                  <button type="button" class="btn" dMagnetic (click)="add()"><span class="btn-label"><app-icon name="bag" /> Tambah ke keranjang</span></button>
                  <a class="btn btn--soft" dMagnetic [routerLink]="['/produk', prod.handle]"><span class="btn-label">Lihat detail</span></a>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class StoryComponent {
  private readonly catalog = inject(CatalogService);
  private readonly cart = inject(CartService);
  private readonly motion = inject(MotionService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  private readonly pin = viewChild.required<ElementRef<HTMLElement>>('pin');
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');

  protected readonly p = computed(() => this.catalog.byHandle('dodora-baby-and-kids-gentle-hair-shampoo'));

  protected readonly ingredients = [
    { name: 'Ekstrak Ginseng', benefit: 'Merangsang pertumbuhan rambut Si Kecil', img: 'ing-ginseng.webp' },
    { name: 'Aloe Vera', benefit: 'Melembapkan & menjaga kulit kepala Si Kecil tetap sehat', img: 'ing-aloe.webp' },
    { name: 'Ekstrak Centella Asiatica', benefit: 'Menenangkan kulit kepala Si Kecil yang gatal', img: 'ing-centella.webp' },
    { name: 'Argan Oil', benefit: 'Kaya asam lemak dan Vitamin E untuk membantu memperkuat akar rambut', img: 'ing-argan.webp' },
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

    // Pinned choreography only on wide, capable screens (lite devices get the static layout).
    const cond = this.motion.env.lite ? '(min-width: 99999px)' : '(min-width: 900px) and (min-height: 620px)';
    mm.add(cond, () => {
      root.classList.add('is-pinned');
      const stageEl = this.stage().nativeElement;
      const lines = q('.s-title .ml-i');
      const ingImgs = q('.ing-img');
      const ingTxt = q('.ing-txt');
      const claims = q('.s-claims li');

      gsap.set(lines, { yPercent: 115 });
      gsap.set(q('.s-sub, .eyebrow'), { autoAlpha: 0, y: 14 });
      gsap.set(q('.s-fig'), { autoAlpha: 0, scale: 0.84, y: 70 });
      gsap.set(ingImgs, { autoAlpha: 0, scale: 0.3 });
      gsap.set(ingTxt, { autoAlpha: 0, y: 18, clipPath: 'inset(0 0 100% 0)' });
      gsap.set(claims, { autoAlpha: 0, y: 12 });
      gsap.set(q('.s-cta'), { autoAlpha: 0, x: 70 });
      gsap.set(q('.sbg-2, .sbg-3'), { autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: this.pin().nativeElement,
          start: 'top top',
          end: '+=190%',
          pin: true,
          scrub: 0.35,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Stage 1 — product appears with soft depth + subtle scale
      tl.to(lines, { yPercent: 0, duration: 0.7, ease: 'expo.out' }, 0)
        .to(q('.s-sub, .eyebrow'), { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1 }, 0.15)
        .to(q('.s-fig'), { autoAlpha: 1, scale: 1, y: 0, duration: 1, ease: 'expo.out' }, 0.05)
        // Stage 2 — ingredient visuals emerge around the product (from behind it, outward)
        .to(q('.sbg-2'), { autoAlpha: 1, duration: 0.8 }, 1)
        .fromTo(
          ingImgs,
          {
            x: (_i, el: HTMLElement) => centerDelta(el, q('.s-fig')[0]).x,
            y: (_i, el: HTMLElement) => centerDelta(el, q('.s-fig')[0]).y,
          },
          { x: 0, y: 0, autoAlpha: 1, scale: 1, duration: 0.9, stagger: 0.12, ease: 'back.out(1.15)' },
          1,
        )
        // Stage 3 — verified product information, animated text reveals
        .to(q('.sbg-3'), { autoAlpha: 1, duration: 0.8 }, 2)
        .to(ingTxt, { autoAlpha: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.6, stagger: 0.12 }, 2.05)
        .to(claims, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.08 }, 2.35)
        // Stage 4 — product settles beside the purchase CTA
        .to([q('.s-ings'), q('.s-claims')], { autoAlpha: 0, scale: 0.94, duration: 0.55, ease: 'power2.in' }, 3.15)
        .to(q('.sbg-2, .sbg-3'), { autoAlpha: 0, duration: 0.6 }, 3.15)
        .to(q('.s-fig'), { x: () => -stageEl.offsetWidth * 0.2, duration: 0.8, ease: 'power3.inOut' }, 3.2)
        .to(q('.s-cta'), { autoAlpha: 1, x: 0, duration: 0.7 }, 3.45)
        .to({}, { duration: 0.35 }); // short hold so the CTA is readable before unpin

      return () => root.classList.remove('is-pinned');
    });

    // Non-pinned layouts: simple, readable staggered reveals
    mm.add('(max-width: 899px)', () => {
      const items = q('.ing, .s-claims li');
      gsap.from(items, { autoAlpha: 0, y: 22, duration: 0.6, stagger: 0.07, scrollTrigger: { trigger: q('.s-ings')[0], start: 'top 85%', once: true } });
    });

    this.destroyRef.onDestroy(() => {
      mm.revert();
      ScrollTrigger.refresh();
    });
  }
}

function centerDelta(el: HTMLElement, center: Element) {
  const a = el.getBoundingClientRect();
  const b = center.getBoundingClientRect();
  return { x: b.left + b.width / 2 - (a.left + a.width / 2), y: b.top + b.height / 2 - (a.top + a.height / 2) };
}

