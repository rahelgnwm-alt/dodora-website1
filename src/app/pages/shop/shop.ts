import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CatalogService } from '../../data/catalog.service';
import { CATEGORY_LABEL, type Category } from '../../data/product.model';
import { FloatDirective, MaskDirective, RevealDirective } from '../../motion/directives';
import { IconComponent } from '../../ui/icon';
import { ProductCardComponent } from '../../ui/product-card';

type Filter = Category | 'all';

@Component({
  selector: 'app-shop',
  imports: [RouterLink, IconComponent, ProductCardComponent, MaskDirective, RevealDirective, FloatDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './shop.scss',
  template: `
    <section class="shop">
      <span class="orb orb--pink s-orb1" dFloat [floatAmp]="14" [floatDuration]="8" aria-hidden="true"></span>
      <span class="orb orb--blue s-orb2" dFloat [floatAmp]="10" aria-hidden="true"></span>
      <div class="container">
        <header class="s-head">
          <p class="eyebrow" dReveal>Belanja</p>
          <h1 dMask>
            <span class="ml"><span class="ml-i">{{ title() }}</span></span>
          </h1>
          <p class="s-count" aria-live="polite">{{ items().length }} produk@if (query()) { untuk “{{ query() }}” }</p>
        </header>

        <nav class="s-filters" aria-label="Filter kategori">
          @for (c of filters; track c) {
            <a class="s-chip" [routerLink]="[]" [queryParams]="{ kategori: c === 'all' ? null : c }" queryParamsHandling="merge" [class.is-active]="active() === c" [attr.aria-current]="active() === c ? 'true' : null">
              {{ label(c) }}
            </a>
          }
          @if (query()) {
            <a class="s-chip s-chip--clear" [routerLink]="[]" [queryParams]="{ q: null }" queryParamsHandling="merge"><app-icon name="close" [size]="16" /> Hapus pencarian</a>
          }
        </nav>

        <p class="s-age" dReveal>
          <app-icon name="shield" [size]="20" />
          <span>
            <strong>Panduan usia:</strong> seluruh rangkaian DODORA diformulasikan untuk bayi dan anak (Safe for Newborn). Gentle Hair Shampoo tercantum <em>dapat digunakan anak 0+</em>. Informasi lengkap tertera di kemasan dan halaman produk.
          </span>
        </p>

        @if (items().length) {
          <ul class="s-grid">
            @for (p of items(); track p.id; let i = $index) {
              <li class="s-item" [style.--i]="i"><app-product-card [product]="p" [eager]="i < 3" /></li>
            }
          </ul>
        } @else {
          <div class="s-empty">
            <p>Belum ada produk yang cocok.</p>
            <a routerLink="/belanja" class="btn"><span class="btn-label">Lihat semua produk</span></a>
          </div>
        }
      </div>
    </section>
  `,
})
export class ShopPage {
  private readonly catalog = inject(CatalogService);
  readonly router = inject(Router);

  // Bound from query params via withComponentInputBinding()
  readonly kategori = input<string>();
  readonly q = input<string>();

  protected readonly filters: Filter[] = ['all', 'bath', 'hair', 'skin', 'bundle'];
  protected readonly label = (c: Filter) => CATEGORY_LABEL[c];
  protected readonly active = computed<Filter>(() => {
    const k = this.kategori();
    return (this.filters as string[]).includes(k ?? '') ? (k as Filter) : 'all';
  });
  protected readonly query = computed(() => (this.q() ?? '').trim());
  protected readonly title = computed(() => (this.active() === 'all' ? 'Semua Produk' : CATEGORY_LABEL[this.active()]));
  protected readonly items = computed(() => {
    const base = this.catalog.byCategory(this.active());
    const t = this.query().toLowerCase();
    return t ? base.filter((p) => (p.name + ' ' + p.tagline + ' ' + p.fullTitle).toLowerCase().includes(t)) : base;
  });
}

