import { Injectable, inject, signal } from '@angular/core';
import { idbGet, idbSet } from './image-upload';
import type { Category, Product, RoutineStep, Variant } from './product.model';
import { PRODUCTS } from './products.data';
import { ToastService } from './toast.service';

export const STORE_URL = 'https://dodoraofficial.com';

const LS_KEY = 'dodora:catalog:v1';
const IDB_KEY = 'catalog-products';

export interface ProductDraft {
  id?: string;
  name: string;
  tagline: string;
  fullTitle?: string;
  category: Category;
  step: RoutineStep;
  description: string[];
  netto: string[];
  bpom: string[];
  variants: Variant[];
  images: string[];
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'produk-dodora';
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly toast = inject(ToastService);

  readonly products = signal<Product[]>(this.loadSync());

  /** Reactive getter: any `computed()` reading `catalog.all` tracks `products()` automatically. */
  get all(): readonly Product[] {
    return this.products();
  }

  constructor() {
    this.hydrateFromIdb();
  }

  byHandle(handle: string): Product | undefined {
    return this.products().find((p) => p.handle === handle);
  }
  byCategory(cat: Category | 'all'): Product[] {
    const list = this.products();
    return cat === 'all' ? [...list] : list.filter((p) => p.category === cat);
  }
  singles(): Product[] {
    return this.products().filter((p) => p.category !== 'bundle');
  }
  bundles(): Product[] {
    return this.products().filter((p) => p.category === 'bundle');
  }
  forStep(step: RoutineStep): Product[] {
    return this.products().filter((p) => p.step === step);
  }
  related(p: Product, n = 3): Product[] {
    const list = this.products();
    return list
      .filter((x) => x.id !== p.id && x.category === p.category)
      .concat(list.filter((x) => x.id !== p.id && x.category !== p.category))
      .slice(0, n);
  }
  search(q: string): Product[] {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return this.products()
      .filter((p) => (p.name + ' ' + p.tagline + ' ' + p.fullTitle).toLowerCase().includes(t))
      .slice(0, 6);
  }

  async saveProduct(draft: ProductDraft): Promise<Product> {
    const cur = this.products();
    const existing = draft.id ? cur.find((p) => p.id === draft.id) : undefined;
    const baseHandle = existing?.handle ?? this.uniqueHandle(slugify('dodora-' + draft.name));
    const id = existing?.id ?? 'prd-' + Date.now().toString(36);

    const variants: Variant[] =
      draft.variants.length > 0
        ? draft.variants.map((v, idx) => ({
            id: v.id || `${id}-v${idx + 1}`,
            title: v.title.trim() || 'Satuan',
            price: Math.max(0, Math.round(Number(v.price) || 0)),
            compare: v.compare && Number(v.compare) > Number(v.price) ? Math.round(Number(v.compare)) : null,
            available: v.available !== false,
          }))
        : [
            {
              id: `${id}-v1`,
              title: 'Satuan',
              price: 99000,
              compare: null,
              available: true,
            },
          ];

    const images = draft.images.map((s) => s.trim()).filter(Boolean);
    const saved: Product = {
      id,
      handle: baseHandle,
      name: draft.name.trim(),
      tagline: draft.tagline.trim() || 'Perawatan lembut untuk Si Kecil',
      fullTitle: draft.fullTitle?.trim() || `DODORA ${draft.name.trim()}`,
      category: draft.category,
      step: draft.step,
      description: draft.description.map((d) => d.trim()).filter(Boolean),
      netto: draft.netto.map((n) => n.trim()).filter(Boolean),
      bpom: draft.bpom.map((b) => b.trim()).filter(Boolean),
      variants,
      images: images.length ? images : ['img/scene-bath.webp'],
    };

    const next = existing ? cur.map((p) => (p.id === existing.id ? saved : p)) : [saved, ...cur];
    this.products.set(next);
    await this.persist(next);
    this.toast.success(existing ? `Produk "${saved.name}" berhasil diperbarui.` : `Produk "${saved.name}" berhasil ditambahkan.`);
    return saved;
  }

  async deleteProduct(id: string) {
    const target = this.products().find((p) => p.id === id);
    const next = this.products().filter((p) => p.id !== id);
    this.products.set(next);
    await this.persist(next);
    if (target) this.toast.success(`Produk "${target.name}" dihapus.`);
  }

  async resetCatalog() {
    const next = PRODUCTS.map((p) => structuredClone(p));
    this.products.set(next);
    await this.persist(next);
    this.toast.success('Katalog produk dikembalikan ke bawaan DODORA.');
  }

  private uniqueHandle(base: string): string {
    const taken = new Set(this.products().map((p) => p.handle));
    if (!taken.has(base)) return base;
    let n = 2;
    while (taken.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
  }

  private loadSync(): Product[] {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_KEY) ?? 'null');
      if (Array.isArray(raw) && raw.length > 0) return raw;
    } catch {
      /* fallback */
    }
    return PRODUCTS.map((p) => ({ ...p, variants: p.variants.map((v) => ({ ...v })), images: [...p.images] }));
  }

  private async hydrateFromIdb() {
    const saved = await idbGet<Product[]>(IDB_KEY);
    if (Array.isArray(saved) && saved.length > 0) {
      this.products.set(saved);
    }
  }

  private async persist(list: Product[]) {
    await idbSet(IDB_KEY, list);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(list));
    } catch {
      // IndexedDB preserves full catalog including large data-URI product images
    }
  }
}
