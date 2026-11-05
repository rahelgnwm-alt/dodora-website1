import { Injectable, computed, inject, signal } from '@angular/core';
import type { CartLine, Product, Variant } from './product.model';
import { STORE_URL } from './catalog.service';
import { ToastService } from './toast.service';

const KEY = 'dodora:cart:v1';
export const MAX_QTY = 20;

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly toast = inject(ToastService);

  readonly lines = signal<CartLine[]>(this.load());
  readonly drawerOpen = signal(false);
  /** Last added variant — drives the brief "added" confirmation state on buttons. */
  readonly lastAdded = signal<string | null>(null);

  readonly count = computed(() => this.lines().reduce((n, l) => n + l.qty, 0));
  readonly subtotal = computed(() => this.lines().reduce((n, l) => n + l.qty * l.price, 0));

  /**
   * Real checkout lives on the DODORA Shopify store. A cart permalink is a plain link, so checkout
   * never depends on any animation or client-side script finishing.
   */
  readonly checkoutUrl = computed(() => {
    const items = this.lines().map((l) => `${l.variantId}:${l.qty}`).join(',');
    return items ? `${STORE_URL}/cart/${items}` : `${STORE_URL}/cart`;
  });

  constructor() {
    // Keep multiple tabs consistent
    addEventListener('storage', (e) => {
      if (e.key === KEY) this.lines.set(this.load());
    });
  }

  /** Optimistic add: UI updates instantly; if persistence or validation fails it is rolled back and reported. */
  add(product: Product, variant: Variant, qty = 1): boolean {
    if (!variant.available) {
      this.toast.error(`${product.name} (${variant.title}) sedang tidak tersedia.`);
      return false;
    }
    const prev = this.lines();
    const existing = prev.find((l) => l.variantId === variant.id);
    const nextQty = (existing?.qty ?? 0) + qty;
    if (nextQty > MAX_QTY) {
      this.toast.error(`Maksimal ${MAX_QTY} pcs per produk dalam satu pesanan.`);
      return false;
    }
    const next = existing
      ? prev.map((l) => (l.variantId === variant.id ? { ...l, qty: nextQty } : l))
      : [
          ...prev,
          {
            variantId: variant.id,
            productId: product.id,
            handle: product.handle,
            name: product.name,
            variantTitle: variant.title,
            price: variant.price,
            qty,
            image: product.images[0],
          },
        ];
    this.lines.set(next);
    if (!this.persist(next)) {
      this.lines.set(prev);
      this.toast.error('Keranjang gagal diperbarui. Silakan coba lagi.');
      return false;
    }
    this.lastAdded.set(variant.id);
    setTimeout(() => this.lastAdded() === variant.id && this.lastAdded.set(null), 1600);
    this.toast.success(`${product.name} ditambahkan ke keranjang`);
    return true;
  }

  setQty(variantId: string, qty: number) {
    if (qty <= 0) return this.remove(variantId);
    if (qty > MAX_QTY) return this.toast.error(`Maksimal ${MAX_QTY} pcs per produk.`);
    this.commit(this.lines().map((l) => (l.variantId === variantId ? { ...l, qty } : l)));
  }

  remove(variantId: string) {
    this.commit(this.lines().filter((l) => l.variantId !== variantId));
  }

  private commit(next: CartLine[]) {
    const prev = this.lines();
    this.lines.set(next);
    if (!this.persist(next)) {
      this.lines.set(prev);
      this.toast.error('Keranjang gagal diperbarui. Silakan coba lagi.');
    }
  }

  private persist(lines: CartLine[]): boolean {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
      return true;
    } catch {
      return false;
    }
  }

  private load(): CartLine[] {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      return Array.isArray(raw) ? raw.filter((l) => l?.variantId && l.qty > 0) : [];
    } catch {
      return [];
    }
  }
}

