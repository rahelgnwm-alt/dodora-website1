import { Injectable, computed, inject, signal } from '@angular/core';
import type { CartLine } from './product.model';
import { PRODUCTS } from './products.data';
import { ToastService } from './toast.service';

export type OrderStatus = 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface TrackingEvent {
  status: OrderStatus;
  title: string;
  note: string;
  timestamp: string;
}

export interface Order {
  id: string;
  customerEmail: string;
  customerName: string;
  phone: string;
  address: string;
  notes?: string;
  createdAt: string;
  items: CartLine[];
  subtotal: number;
  shippingCost: number;
  total: number;
  courier: string;
  paymentMethod: string;
  trackingNumber: string;
  status: OrderStatus;
  timeline: TrackingEvent[];
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  confirmed: 'Pesanan Dikonfirmasi',
  processing: 'Sedang Dikemas',
  shipped: 'Dalam Pengiriman',
  delivered: 'Pesanan Selesai',
  cancelled: 'Dibatalkan',
};

export const TRACKING_STEPS: readonly { key: Exclude<OrderStatus, 'cancelled'>; label: string }[] = [
  { key: 'confirmed', label: 'Dikonfirmasi' },
  { key: 'processing', label: 'Dikemas' },
  { key: 'shipped', label: 'Dikirim' },
  { key: 'delivered', label: 'Diterima' },
];

const LEGACY_ORDERS_KEY = 'dodora:orders:v1';
const ORDERS_KEY = 'dodora:orders:v2';

function seedLine(handle: string, qty = 1): CartLine {
  const prod = PRODUCTS.find((p) => p.handle === handle) ?? PRODUCTS[0];
  const v = prod.variants[0];
  return {
    variantId: v.id,
    productId: prod.id,
    handle: prod.handle,
    name: prod.name,
    variantTitle: v.title,
    price: v.price,
    qty,
    image: prod.images[0],
  };
}

const SEED_LINE_BATH = seedLine('dodora-baby-and-kids-body-bath', 1);
const SEED_LINE_SHAMPOO = seedLine('dodora-baby-and-kids-gentle-hair-shampoo', 1);
const SEED_LINE_BUNDLE = seedLine('dodora-spesial-bundling-perawatan-kulit-harian-body-bath-lotion-multipurpose-balm', 1);

const SEEDED_ORDERS: Order[] = [
  {
    id: 'DDR-261105-418',
    customerEmail: 'bunda@dodora.id',
    customerName: 'Bunda Nadira',
    phone: '0812-8899-1020',
    address: 'Jl. Kemang Timur No. 24, Bangka, Mampang Prapatan, Jakarta Selatan 12730',
    notes: 'Tolong titip di pos sekuriti jika sedang tidur siang ya, terima kasih!',
    createdAt: '2026-11-05T09:15:00+07:00',
    items: [SEED_LINE_BATH, SEED_LINE_SHAMPOO],
    subtotal: SEED_LINE_BATH.price + SEED_LINE_SHAMPOO.price,
    shippingCost: 12000,
    total: SEED_LINE_BATH.price + SEED_LINE_SHAMPOO.price + 12000,
    courier: 'SiCepat BEST',
    paymentMethod: 'QRIS',
    trackingNumber: '004928174621',
    status: 'shipped',
    timeline: [
      {
        status: 'confirmed',
        title: 'Pembayaran diterima & pesanan dikonfirmasi',
        note: 'Pembayaran QRIS terverifikasi otomatis.',
        timestamp: '2026-11-05T09:16:00+07:00',
      },
      {
        status: 'processing',
        title: 'Pesanan dikemas dengan bubble wrap aman',
        note: 'Quality check lulus oleh tim gudang DODORA Jakarta.',
        timestamp: '2026-11-05T13:40:00+07:00',
      },
      {
        status: 'shipped',
        title: 'Paket diserahkan ke kurir SiCepat BEST',
        note: 'Paket sedang dalam perjalanan menuju Hub Mampang, Jakarta Selatan (Resi: 004928174621).',
        timestamp: '2026-11-06T08:20:00+07:00',
      },
    ],
  },
  {
    id: 'DDR-261021-109',
    customerEmail: 'bunda@dodora.id',
    customerName: 'Bunda Nadira',
    phone: '0812-8899-1020',
    address: 'Jl. Kemang Timur No. 24, Bangka, Mampang Prapatan, Jakarta Selatan 12730',
    createdAt: '2026-10-21T14:10:00+07:00',
    items: [SEED_LINE_BUNDLE],
    subtotal: SEED_LINE_BUNDLE.price,
    shippingCost: 0,
    total: SEED_LINE_BUNDLE.price,
    courier: 'JNE Reguler (Gratis Ongkir)',
    paymentMethod: 'BCA Virtual Account',
    trackingNumber: 'JP9938104728',
    status: 'delivered',
    timeline: [
      {
        status: 'confirmed',
        title: 'Pesanan dikonfirmasi',
        note: 'Pembayaran BCA Virtual Account berhasil diterima.',
        timestamp: '2026-10-21T14:12:00+07:00',
      },
      {
        status: 'processing',
        title: 'Pesanan sedang disiapkan',
        note: 'Paket bundling dikemas rapi di gudang DODORA.',
        timestamp: '2026-10-21T16:30:00+07:00',
      },
      {
        status: 'shipped',
        title: 'Dalam pengiriman kurir JNE',
        note: 'Paket dikirim dengan nomor resi JP9938104728.',
        timestamp: '2026-10-22T09:05:00+07:00',
      },
      {
        status: 'delivered',
        title: 'Paket telah diterima',
        note: 'Diterima langsung oleh Bunda Nadira.',
        timestamp: '2026-10-23T15:22:00+07:00',
      },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly toast = inject(ToastService);

  readonly orders = signal<Order[]>(this.load());

  readonly totalRevenue = computed(() =>
    this.orders()
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0),
  );

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === ORDERS_KEY) this.orders.set(this.load());
      });
    }
  }

  forCustomer(email: string): Order[] {
    const clean = email.trim().toLowerCase();
    return this.orders().filter((o) => o.customerEmail.toLowerCase() === clean);
  }

  byId(id: string): Order | undefined {
    const clean = id.trim().toUpperCase();
    return this.orders().find((o) => o.id.toUpperCase() === clean || o.trackingNumber.toUpperCase() === clean);
  }

  placeOrder(input: {
    customerEmail: string;
    customerName: string;
    phone: string;
    address: string;
    notes?: string;
    courier: string;
    shippingCost: number;
    paymentMethod: string;
    items: CartLine[];
  }): Order {
    const now = new Date();
    const ymd =
      String(now.getFullYear()).slice(-2) +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(100 + Math.random() * 900);
    const id = `DDR-${ymd}-${rand}`;
    const resi = 'DDR' + Math.floor(100000000 + Math.random() * 900000000);
    const subtotal = input.items.reduce((s, l) => s + l.price * l.qty, 0);
    const order: Order = {
      id,
      customerEmail: input.customerEmail.trim().toLowerCase(),
      customerName: input.customerName.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      notes: input.notes?.trim() || undefined,
      createdAt: now.toISOString(),
      items: input.items.map((i) => ({ ...i })),
      subtotal,
      shippingCost: input.shippingCost,
      total: subtotal + input.shippingCost,
      courier: input.courier,
      paymentMethod: input.paymentMethod,
      trackingNumber: resi,
      status: 'confirmed',
      timeline: [
        {
          status: 'confirmed',
          title: 'Pesanan berhasil dibuat & dikonfirmasi',
          note: `Metode pembayaran ${input.paymentMethod} tercatat. Menunggu pengemasan gudang DODORA.`,
          timestamp: now.toISOString(),
        },
      ],
    };
    const next = [order, ...this.orders()];
    this.orders.set(next);
    this.persist(next);
    this.toast.success(`Pesanan ${id} berhasil dibuat!`);
    return order;
  }

  updateOrderStatus(orderId: string, status: OrderStatus, trackingNumber?: string, customNote?: string) {
    const now = new Date().toISOString();
    const defaultTitles: Record<OrderStatus, string> = {
      confirmed: 'Pesanan dikonfirmasi oleh Admin DODORA',
      processing: 'Pesanan sedang dikemas di gudang DODORA',
      shipped: 'Paket telah diserahkan ke kurir pengiriman',
      delivered: 'Paket telah tiba di alamat tujuan',
      cancelled: 'Pesanan dibatalkan',
    };
    const next = this.orders().map((o) => {
      if (o.id !== orderId) return o;
      const nextResi = trackingNumber?.trim() || o.trackingNumber;
      const event: TrackingEvent = {
        status,
        title: defaultTitles[status],
        note: customNote?.trim() || (status === 'shipped' ? `Nomor resi pengiriman: ${nextResi} (${o.courier}).` : ORDER_STATUS_LABEL[status]),
        timestamp: now,
      };
      return {
        ...o,
        status,
        trackingNumber: nextResi,
        timeline: [...o.timeline, event],
      };
    });
    this.orders.set(next);
    this.persist(next);
    this.toast.success(`Status pesanan ${orderId} diperbarui ke ${ORDER_STATUS_LABEL[status]}.`);
  }

  confirmReceivedByCustomer(orderId: string) {
    this.updateOrderStatus(orderId, 'delivered', undefined, 'Dikonfirmasi diterima langsung oleh pelanggan.');
  }

  stepIndex(status: OrderStatus): number {
    if (status === 'cancelled') return -1;
    return TRACKING_STEPS.findIndex((s) => s.key === status);
  }

  private load(): Order[] {
    const seedIds = new Set(SEEDED_ORDERS.map((s) => s.id));
    const repairOrder = (o: Order): Order => ({
      ...o,
      items: o.items.map((it) => {
        if (!it.image || it.image.includes('0693/1133/2584')) {
          const match = PRODUCTS.find((p) => p.handle === it.handle || p.id === it.productId);
          if (match?.images[0]) return { ...it, image: match.images[0] };
        }
        return it;
      }),
    });

    try {
      const v2 = JSON.parse(localStorage.getItem(ORDERS_KEY) ?? 'null');
      if (Array.isArray(v2) && v2.length > 0) return v2.map(repairOrder);

      const v1 = JSON.parse(localStorage.getItem(LEGACY_ORDERS_KEY) ?? 'null');
      if (Array.isArray(v1) && v1.length > 0) {
        const custom = (v1 as Order[]).filter((o) => !seedIds.has(o.id)).map(repairOrder);
        const merged = [...custom, ...SEEDED_ORDERS];
        this.persist(merged);
        localStorage.removeItem(LEGACY_ORDERS_KEY);
        return merged;
      }
    } catch {
      /* fallback */
    }
    return [...SEEDED_ORDERS];
  }

  private persist(list: Order[]) {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }
}

