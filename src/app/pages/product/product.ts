import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Icon } from '../../components/icon/icon';
import { ProductCard } from '../../components/product-card/product-card';
import { IdrPipe, ProductImage, cdn } from '../../components/product-image/product-image';
import { CartService, MAX_QTY } from '../../data/cart.service';
import { CatalogService, STORE_URL } from '../../data/catalog.service';
import { CATEGORY_LABEL } from '../../data/product.model';
import { MagneticDirective, MaskDirective, RevealDirective, StaggerDirective } from '../../motion/directives';
import { MotionService } from '../../motion/motion.service';

@Component({
  selector: 'app-product',
  imports: [RouterLink, Icon, IdrPipe, ProductImage, ProductCard, MagneticDirective, MaskDirective, RevealDirective, StaggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product.html',
  styleUrl: './product.scss',
})
export class Product {
  private readonly catalog = inject(CatalogService);
  private readonly cart = inject(CartService);
  private readonly title = inject(Title);
  private readonly motion = inject(MotionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly handle = input.required<string>();

  protected readonly maxQty = MAX_QTY;
  protected readonly max = Math.max;
  protected readonly min = Math.min;
  protected readonly cat = (c: keyof typeof CATEGORY_LABEL) => CATEGORY_LABEL[c];

  protected readonly product = computed(() => this.catalog.byHandle(this.handle()));
  protected readonly vIndex = signal(0);
  protected readonly variant = computed(() => {
    const p = this.product()!;
    return p.variants[Math.min(this.vIndex(), p.variants.length - 1)];
  });
  protected readonly qty = signal(1);
  protected readonly idx = signal(0);
  protected readonly open = signal<string | null>('about');
  protected readonly showSticky = signal(false);
  protected readonly vtName = signal(true);

  protected readonly added = computed(() => this.cart.lastAdded() === this.variant().id);
  /** Bundle saving vs buying singles (computed from real prices, never hard-coded). */
  protected readonly saving = computed(() => {
    const p = this.product();
    if (!p || p.variants.length < 2) return 0;
    const v = this.variant();
    const m = /(\d+)\s*PCS/i.exec(v.title);
    return m ? Math.max(0, p.variants[0].price * +m[1] - v.price) : 0;
  });
  protected readonly buyNowUrl = computed(() => `${STORE_URL}/cart/${this.variant().id}:${this.qty()}`);
  protected readonly related = computed(() => (this.product() ? this.catalog.related(this.product()!, 3) : []));

  protected readonly sections = computed(() => {
    const p = this.product();
    if (!p) return [];
    return [
      { id: 'about', title: 'Tentang produk', lines: p.description.length ? p.description : [p.fullTitle] },
      {
        id: 'info',
        title: 'Informasi produk',
        lines: [
          ...(p.netto.length ? [`Netto: ${p.netto.join(' · ')}`] : []),
          ...(p.bpom.length ? [`Notifikasi BPOM: ${p.bpom.join(' · ')}`] : []),
          'Disimpan di tempat sejuk dan kering, hindarkan dari sinar matahari langsung.',
        ],
      },
      { id: 'ship', title: 'Pengiriman & pengembalian', lines: ['Pengiriman, pembayaran, dan pengembalian diproses melalui toko resmi DODORA.'] },
    ];
  });

  private readonly strip = viewChild<ElementRef<HTMLElement>>('strip');
  private readonly buy = viewChild<ElementRef<HTMLElement>>('buy');
  private raf = 0;

  constructor() {
    effect(() => {
      const p = this.product();
      this.title.setTitle(p ? `${p.name} — DODORA` : 'Produk tidak ditemukan — DODORA');
      // reset per-product state when navigating between products
      this.vIndex.set(0);
      this.qty.set(1);
      this.idx.set(0);
      this.strip()?.nativeElement.scrollTo({ left: 0 });
    });

    afterNextRender(() => {
      // Release the shared-element name once the view transition has captured it.
      const t = setTimeout(() => this.vtName.set(false), 900);
      this.destroyRef.onDestroy(() => clearTimeout(t));
    });

    // Sticky bar: observe the main purchase button
    effect((onCleanup) => {
      const el = this.buy()?.nativeElement;
      if (!el) return;
      const io = new IntersectionObserver(([e]) => {
        // show once the button has scrolled ABOVE the viewport (never before it is reached)
        this.showSticky.set(!e.isIntersecting && e.boundingClientRect.top < 0);
      });
      io.observe(el);
      onCleanup(() => io.disconnect());
    });
  }

  protected thumb(src: string) {
    return cdn(src, 160);
  }

  protected add() {
    const p = this.product();
    if (p) this.cart.add(p, this.variant(), this.qty());
  }

  protected toggle(id: string) {
    this.open.update((o) => (o === id ? null : id));
  }

  // ── gallery ──
  protected onStripScroll() {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => {
      const el = this.strip()?.nativeElement;
      if (el && el.clientWidth) this.idx.set(Math.round(el.scrollLeft / el.clientWidth));
    });
  }
  protected goTo(i: number) {
    const el = this.strip()?.nativeElement;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: this.motion.env.reduced ? 'auto' : 'smooth' });
    this.idx.set(i);
  }
  protected onStripKey(e: KeyboardEvent) {
    const n = this.product()?.images.length ?? 0;
    if (e.key === 'ArrowRight') this.goTo(Math.min(n - 1, this.idx() + 1));
    else if (e.key === 'ArrowLeft') this.goTo(Math.max(0, this.idx() - 1));
    else return;
    e.preventDefault();
  }
  protected zoom(e: PointerEvent, slide: HTMLElement) {
    if (e.pointerType !== 'mouse' || this.motion.env.reduced) return;
    const r = slide.getBoundingClientRect();
    slide.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
    slide.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
    slide.classList.add('is-zoom');
  }
  protected unzoom(slide: HTMLElement) {
    slide.classList.remove('is-zoom');
  }

  // ── variants ──
  protected onVariantKey(e: KeyboardEvent) {
    const n = this.product()?.variants.length ?? 0;
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = (this.vIndex() + d + n) % n;
    this.vIndex.set(next);
    queueMicrotask(() => (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role=radio]')[next]?.focus());
  }
}
