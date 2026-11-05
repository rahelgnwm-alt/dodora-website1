import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '../../components/icon/icon';
import { ProductCard } from '../../components/product-card/product-card';
import { CatalogService } from '../../data/catalog.service';
import { CATEGORY_LABEL, type Category } from '../../data/product.model';
import { FloatDirective, MaskDirective, RevealDirective } from '../../motion/directives';

type Filter = Category | 'all';

@Component({
  selector: 'app-shop',
  imports: [RouterLink, Icon, ProductCard, MaskDirective, RevealDirective, FloatDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shop.html',
  styleUrl: './shop.scss',
})
export class Shop {
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
