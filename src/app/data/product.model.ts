export type Category = 'bath' | 'hair' | 'skin' | 'bundle';
export type RoutineStep = 'mandi' | 'lembap' | 'rambut' | 'bundle';

export interface Variant {
  id: string;
  title: string;
  /** IDR, whole rupiah */
  price: number;
  compare: number | null;
  available: boolean;
}

export interface Product {
  id: string;
  handle: string;
  name: string;
  tagline: string;
  fullTitle: string;
  category: Category;
  step: RoutineStep;
  /** Verified copy taken from the live DODORA store. */
  description: string[];
  netto: string[];
  /** BPOM notification numbers as printed on the store listing. */
  bpom: string[];
  variants: Variant[];
  /** Shopify CDN image URLs (no query string). */
  images: string[];
}

export interface CartLine {
  variantId: string;
  productId: string;
  handle: string;
  name: string;
  variantTitle: string;
  price: number;
  qty: number;
  image: string;
}

export const CATEGORY_LABEL: Record<Category | 'all', string> = {
  all: 'Semua',
  bath: 'Mandi',
  hair: 'Rambut',
  skin: 'Kulit',
  bundle: 'Bundling',
};

