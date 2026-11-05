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
import { FloatDirective, MagneticDirective } from '../../motion/directives';
import { MotionService } from '../../motion/motion.service';
import { pointerParallax, scrollParallax } from '../../motion/utilities';
import { pageTransition } from '../../motion/utilities';
import { IconComponent } from '../../ui/icon';
import { IdrPipe, ProductImageComponent } from '../../ui/product-image';

/**
 * Cinematic hero. Entrance is one coordinated GSAP timeline (times match the creative brief):
 *  0.0 gradient · 0.2 backing circle · 0.35 organic image mask · 0.5 headline lines ·
 *  0.7 paragraph · 0.85 CTAs (stagger) · 1.0 decorative shapes + idle motion.
 * After it plays, only decorative layers move (pointer parallax, scroll drift); the photo stays stable.
 */
@Component({
  selector: 'app-hero',
  imports: [RouterLink, IconComponent, IdrPipe, ProductImageComponent, MagneticDirective, FloatDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './hero.scss',
  template: `
    <section class="hero" #root aria-labelledby="hero-title" data-bg="#FFF4EE">
      <div class="hero-bg" aria-hidden="true">
        <div class="hero-grad" data-h-bg></div>
        <div class="layer" data-speed="140" style="left: -6%; top: 12%">
          <div class="layer-in" data-depth="26"><span class="blob hb1"></span></div>
        </div>
        <div class="layer" data-speed="220" style="left: 7%; top: 64%">
          <div class="layer-in" data-depth="-34"><span class="orb orb--blue h-orb" style="--s: 54px" dFloat [floatAmp]="14"></span></div>
        </div>
        <div class="layer" data-speed="260" style="right: 4%; top: 18%">
          <div class="layer-in" data-depth="42"><span class="orb orb--pink h-orb" style="--s: 92px" dFloat [floatAmp]="18" [floatDuration]="7"></span></div>
        </div>
        <div class="layer" data-speed="180" style="left: 46%; top: 8%">
          <div class="layer-in" data-depth="-22"><span class="orb orb--salmon orb--drop h-orb" style="--s: 38px" dFloat [floatAmp]="10"></span></div>
        </div>
        <div class="layer" data-speed="120" style="right: 12%; bottom: 14%">
          <div class="layer-in" data-depth="30"><span class="cloud h-orb" style="--s: 260px" dFloat [floatAmp]="8" [floatRotate]="0.5" [floatDuration]="9"></span></div>
        </div>
      </div>

      <div class="hero-grid container">
        <div class="hero-copy" #copy>
          <p class="eyebrow hero-eyebrow" data-h>Perawatan bayi &amp; anak</p>
          <h1 id="hero-title" class="hero-title" #title data-mask>
            <span class="ml"><span class="ml-i">Sentuhan Lembut</span></span>
            <span class="ml"><span class="ml-i">untuk Setiap Momen</span></span>
            <span class="ml"><span class="ml-i hl">Si Kecil</span></span>
          </h1>
          <p class="hero-lead" data-h>
            Rangkaian gentle care dengan natural active ingredients dan formula lembut, tanpa bahan berbahaya — cocok untuk Bunda dan Si Kecil sejak hari pertama.
          </p>
          <div class="hero-cta">
            <a routerLink="/belanja" class="btn" dMagnetic data-h-cta><span class="btn-label">Belanja Sekarang <app-icon name="arrow-right" /></span></a>
            <a routerLink="/" fragment="rutinitas" class="btn btn--soft" dMagnetic data-h-cta><span class="btn-label">Lihat Rutinitas</span></a>
          </div>
          <ul class="hero-cats" aria-label="Belanja per kategori" data-h>
            <li><a routerLink="/belanja" [queryParams]="{ kategori: 'bath' }">Mandi</a></li>
            <li><a routerLink="/belanja" [queryParams]="{ kategori: 'hair' }">Rambut</a></li>
            <li><a routerLink="/belanja" [queryParams]="{ kategori: 'skin' }">Kulit</a></li>
            <li><a routerLink="/belanja" [queryParams]="{ kategori: 'bundle' }">Bundling</a></li>
          </ul>
        </div>

        <div class="hero-visual" #visual>
          <span class="hv-circle" #circle aria-hidden="true"></span>
          <div class="hv-frame" #frame>
            <img
              #img
              src="img/hero-mother-toddler.webp"
              width="570"
              height="650"
              fetchpriority="high"
              decoding="async"
              alt="Bunda tersenyum bersama balita sambil memegang DODORA Body Bath"
            />
          </div>

          @if (feature(); as p) {
            <a class="hv-product" [routerLink]="['/produk', p.handle]" (click)="mark($event)" data-h-chip>
              <span class="hvp-img" #pimg><app-pimg [src]="p.images[1] ?? p.images[0]" [alt]="''" sizes="96px" [eager]="true" /></span>
              <span class="hvp-txt">
                <small>Best seller</small>
                <strong>{{ p.name }}</strong>
                <span>{{ p.variants[0].price | idr }}</span>
              </span>
              <button type="button" class="hvp-add" (click)="add($event)" [attr.aria-label]="'Tambah ' + p.name + ' ke keranjang'">
                <app-icon name="plus" [size]="20" [stroke]="2.6" />
              </button>
            </a>
          }
        </div>
      </div>
    </section>
  `,
})
export class HeroComponent {
  private readonly motion = inject(MotionService);
  private readonly catalog = inject(CatalogService);
  private readonly cart = inject(CartService);
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
      gsap.set(lines, { yPercent: 115 });
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
        .to(this.img().nativeElement, { scale: 1, duration: 1.5, ease: 'expo.out' }, 0.35)
        .to(lines, { yPercent: 0, duration: 0.85, stagger: 0.11, ease: 'expo.out', clearProps: 'transform' }, 0.5) // 0.5  headline
        .to(q('.hero-eyebrow'), { autoAlpha: 1, y: 0, duration: 0.6 }, 0.45)
        .to(q('.hero-lead'), { autoAlpha: 1, y: 0, duration: 0.7 }, 0.7) //               0.7  paragraph
        .to(q('[data-h-cta]'), { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.3)' }, 0.85) // 0.85 CTAs
        .to(q('.hero-cats'), { autoAlpha: 1, y: 0, duration: 0.6 }, 1.0)
        .to(q('[data-h-chip]'), { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.2)' }, 1.0) // 1.0  product chip
        .to(q('.h-orb'), { autoAlpha: 1, duration: 1.2, stagger: 0.12, ease: 'power2.out' }, 1.0); //        1.0  shapes (idle float runs)

      this.motion.whenPreloaderDone().then(() => tl.play());

      // ── Scroll-linked: layers drift at different speeds, copy leaves, product shifts on ──
      if (!env.lite) {
        const k = env.mobile ? 0.5 : 1;
        const st = { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.6 };
        gsap.to(this.copy().nativeElement, { y: -50 * k, autoAlpha: 0, ease: 'power1.out', scrollTrigger: { ...st, end: 'bottom 45%' } });
        gsap.to(this.visual().nativeElement, { y: -65 * k, ease: 'none', scrollTrigger: st });
        gsap.to(q('.hero-grad'), { yPercent: 12, ease: 'none', scrollTrigger: st });
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

