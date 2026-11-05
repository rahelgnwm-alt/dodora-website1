import { Injectable } from '@angular/core';
import { PRODUCTS } from './products.data';
import type { Category, Product, RoutineStep } from './product.model';

export const STORE_URL = 'https://dodoraofficial.com';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  readonly all: readonly Product[] = PRODUCTS;

  byHandle(handle: string): Product | undefined {
    return this.all.find((p) => p.handle === handle);
  }
  byCategory(cat: Category | 'all'): Product[] {
    return cat === 'all' ? [...this.all] : this.all.filter((p) => p.category === cat);
  }
  singles(): Product[] {
    return this.all.filter((p) => p.category !== 'bundle');
  }
  bundles(): Product[] {
    return this.all.filter((p) => p.category === 'bundle');
  }
  forStep(step: RoutineStep): Product[] {
    return this.all.filter((p) => p.step === step);
  }
  related(p: Product, n = 3): Product[] {
    return this.all.filter((x) => x.id !== p.id && x.category === p.category).concat(this.all.filter((x) => x.id !== p.id && x.category !== p.category)).slice(0, n);
  }
  search(q: string): Product[] {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return this.all.filter((p) => (p.name + ' ' + p.tagline + ' ' + p.fullTitle).toLowerCase().includes(t)).slice(0, 6);
  }
}

