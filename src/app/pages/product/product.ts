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
import { CartService, MAX_QTY } from '../../data/cart.service';
import { CatalogService, STORE_URL } from '../../data/catalog.service';
import { CATEGORY_LABEL } from '../../data/product.model';
import { MagneticDirective, MaskDirective, RevealDirective, StaggerDirective } from '../../motion/directives';
import { MotionService } from '../../motion/motion.service';
import { IconComponent } from '../../ui/icon';
import { IdrPipe, ProductImageComponent, cdn } from '../../ui/product-image';
import { ProductCardComponent } from '../../ui/product-card';

@Component({
  selector: 'app-product-page',
  imports: [RouterLink, IconComponent, IdrPipe, ProductImageComponent, ProductCardComponent, MagneticDirective, MaskDirective, RevealDirective, StaggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './product.scss',
  template: `
    @if (product(); as p) {
      <article class="pd">
        <nav class="crumbs container" aria-label="Breadcrumb">
          <a routerLink="/">Beranda</a><span aria-hidden="true">/</span>
          <a routerLink="/belanja">Belanja</a><span aria-hidden="true">/</span>
          <span aria-current="page">{{ p.name }}</span>
        </nav>

        <div class="pd-grid container">
          <!-- ── Gallery: scroll-snap strip (native swipe on touch), thumbnails + cursor zoom on desktop ── -->
          <div class="gal" dReveal [revealY]="24">
            <div class="strip" #strip (scroll)="onStripScroll()" role="group" aria-roledescription="carousel" aria-label="Galeri foto produk" tabindex="0" (keydown)="onStripKey($event)">
              @for (img of p.images; track img; let i = $index) {
                <div
                  class="slide"
                  [attr.aria-label]="'Foto ' + (i + 1) + ' dari ' + p.images.length"
                  role="group"
                  aria-roledescription="slide"
                  [style.view-transition-name]="i === 0 && vtName() ? 'product-hero' : null"
                  (pointermove)="zoom($event, slide)"
                  (pointerleave)="unzoom(slide)"
                  #slide
                >
                  <app-pimg [src]="img" [alt]="p.name + ' — foto ' + (i + 1)" [eager]="i === 0" sizes="(min-width: 900px) 46vw, 100vw" />
                </div>
              }
            </div>
            <div class="dots" aria-hidden="true">
              @for (img of p.images; track img; let i = $index) {
                <span [class.is-active]="idx() === i"></span>
              }
            </div>
            <ul class="thumbs" aria-label="Pilih foto">
              @for (img of p.images; track img; let i = $index) {
                <li>
                  <button type="button" [class.is-active]="idx() === i" (click)="goTo(i)" [attr.aria-label]="'Tampilkan foto ' + (i + 1)" [attr.aria-current]="idx() === i ? 'true' : null">
                    <img [src]="thumb(img)" width="96" height="96" alt="" loading="lazy" />
                  </button>
                </li>
              }
            </ul>
          </div>

          <!-- ── Purchase panel ── -->
          <div class="info" dStagger [staggerStep]="0.07" [staggerY]="18" staggerSelector=":scope > [data-i]">
            <p class="eyebrow" data-i>{{ cat(p.category) }}</p>
            <h1 data-i dMask [maskDelay]="0.1"><span class="ml"><span class="ml-i">{{ p.name }}</span></span></h1>
            <p class="tag" data-i>{{ p.tagline }}</p>

            <div class="price-row" data-i aria-live="polite">
              <strong class="price">{{ variant().price | idr }}</strong>
              @if (variant().compare; as c) { <s>{{ c | idr }}</s> }
              @if (saving() > 0) { <span class="save">Hemat {{ saving() | idr }}</span> }
              <span class="stock" [class.is-out]="!variant().available">
                <i aria-hidden="true"></i>{{ variant().available ? 'Tersedia' : 'Stok habis' }}
              </span>
            </div>

            @if (p.variants.length > 1) {
              <div class="variants-wrap" data-i>
                <p class="vlabel" id="vlabel">Pilih varian</p>
                <div class="variants" role="radiogroup" aria-labelledby="vlabel" [style.--n]="p.variants.length" [style.--k]="vIndex()" (keydown)="onVariantKey($event)">
                  <span class="vpill" aria-hidden="true"></span>
                  @for (v of p.variants; track v.id; let i = $index) {
                    <button type="button" role="radio" class="vopt" [attr.aria-checked]="vIndex() === i" [tabindex]="vIndex() === i ? 0 : -1" [class.is-on]="vIndex() === i" [disabled]="!v.available" (click)="vIndex.set(i)">
                      <span>{{ v.title }}</span>
                      <small>{{ v.price | idr }}</small>
                    </button>
                  }
                </div>
              </div>
            }

            <div class="buy" data-i #buy>
              <div class="qty" role="group" aria-label="Jumlah">
                <button type="button" (click)="qty.set(max(qty() - 1, 1))" [disabled]="qty() <= 1" aria-label="Kurangi jumlah"><app-icon name="minus" [size]="18" [stroke]="2.5" /></button>
                <output aria-live="polite">{{ qty() }}</output>
                <button type="button" (click)="qty.set(min(qty() + 1, maxQty))" [disabled]="qty() >= maxQty" aria-label="Tambah jumlah"><app-icon name="plus" [size]="18" [stroke]="2.5" /></button>
              </div>
              <button type="button" class="btn buy-btn" dMagnetic [class.is-done]="added()" [disabled]="!variant().available" (click)="add()">
                <span class="btn-label">
                  @if (added()) { <app-icon name="check" /> Ditambahkan } @else { <app-icon name="bag" /> Tambah ke keranjang }
                </span>
              </button>
            </div>
            <a class="buy-now" data-i [href]="buyNowUrl()" rel="noopener">Beli sekarang <app-icon name="arrow-up-right" [size]="16" /></a>

            <ul class="assure" data-i>
              <li><app-icon name="shield" [size]="18" /> Formula lembut, no harmful ingredients</li>
              <li><app-icon name="truck" [size]="18" /> Checkout aman di toko resmi DODORA</li>
            </ul>

            <div class="acc" data-i>
              @for (s of sections(); track s.id) {
                <div class="acc-item" [class.is-open]="open() === s.id">
                  <h2 class="acc-h">
                    <button type="button" [id]="'acc-b-' + s.id" [attr.aria-expanded]="open() === s.id" [attr.aria-controls]="'acc-p-' + s.id" (click)="toggle(s.id)">
                      {{ s.title }} <app-icon name="chevron-down" [size]="20" />
                    </button>
                  </h2>
                  <div class="acc-p" [id]="'acc-p-' + s.id" role="region" [attr.aria-labelledby]="'acc-b-' + s.id" [attr.inert]="open() === s.id ? null : ''">
                    <div class="acc-in">
                      @for (line of s.lines; track $index) { <p>{{ line }}</p> }
                      @if (s.id === 'ship') {
                        <p>
                          <a href="https://dodoraofficial.com/pages/support/shipping-deliveries" rel="noopener">Info pengiriman</a> ·
                          <a href="https://dodoraofficial.com/pages/support/return" rel="noopener">Pengembalian</a> ·
                          <a href="https://dodoraofficial.com/pages/support/faq" rel="noopener">FAQ</a>
                        </p>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <section class="rel container" aria-labelledby="rel-t">
          <h2 id="rel-t" dReveal>Lengkapi rutinitasnya</h2>
          <div class="rel-grid" dStagger staggerSelector=".rel-i" [staggerY]="26">
            @for (r of related(); track r.id) { <div class="rel-i"><app-product-card [product]="r" /></div> }
          </div>
        </section>

        <!-- Mobile sticky add-to-cart: appears only once the main button scrolls out of view -->
        <div class="sticky" [class.is-show]="showSticky()" [attr.aria-hidden]="!showSticky()" [attr.inert]="showSticky() ? null : ''">
          <div class="sticky-txt"><strong>{{ p.name }}</strong><span>{{ variant().title !== 'Satuan' ? variant().title + ' · ' : '' }}{{ variant().price * qty() | idr }}</span></div>
          <button type="button" class="btn btn--sm" [disabled]="!variant().available" (click)="add()"><span class="btn-label">{{ added() ? 'Ditambahkan' : 'Tambah' }}</span></button>
        </div>
      </article>
    } @else {
      <section class="nf container">
        <h1>Produk tidak ditemukan</h1>
        <a routerLink="/belanja" class="btn"><span class="btn-label">Kembali belanja</span></a>
      </section>
    }
  `,
})
export class ProductPage {
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

