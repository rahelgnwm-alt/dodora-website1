import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icon } from '../../components/icon/icon';
import { IdrPipe, ProductImage } from '../../components/product-image/product-image';
import { AuthService } from '../../data/auth.service';
import { CartService } from '../../data/cart.service';
import { CatalogService } from '../../data/catalog.service';
import { ORDER_STATUS_LABEL, OrderService, TRACKING_STEPS, type Order, type OrderStatus } from '../../data/order.service';
import { ToastService } from '../../data/toast.service';

type StatusFilter = 'all' | 'active' | 'shipped' | 'delivered';

@Component({
  selector: 'app-customer',
  imports: [FormsModule, RouterLink, DatePipe, Icon, IdrPipe, ProductImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customer.html',
  styleUrl: './customer.scss',
})
export class Customer {
  protected readonly auth = inject(AuthService);
  protected readonly orderSvc = inject(OrderService);
  private readonly catalog = inject(CatalogService);
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);

  readonly order = input<string>();

  protected readonly steps = TRACKING_STEPS;
  protected readonly statusLabel = (s: OrderStatus) => ORDER_STATUS_LABEL[s];

  protected readonly filter = signal<StatusFilter>('all');
  protected readonly trackQuery = signal('');
  protected readonly expandedId = signal<string | null>(null);
  protected readonly editingProfile = signal(false);

  protected profName = '';
  protected profPhone = '';
  protected profAddress = '';

  protected readonly myOrders = computed(() => {
    const u = this.auth.user();
    if (!u) return [];
    return u.role === 'admin' ? this.orderSvc.orders() : this.orderSvc.forCustomer(u.email);
  });

  protected readonly inTransitCount = computed(() => this.myOrders().filter((o) => o.status === 'shipped').length);
  protected readonly completedCount = computed(() => this.myOrders().filter((o) => o.status === 'delivered').length);

  protected readonly filteredOrders = computed(() => {
    const f = this.filter();
    const q = this.trackQuery().trim().toLowerCase();
    return this.myOrders().filter((o) => {
      if (f === 'active' && o.status !== 'confirmed' && o.status !== 'processing') return false;
      if (f === 'shipped' && o.status !== 'shipped') return false;
      if (f === 'delivered' && o.status !== 'delivered') return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.trackingNumber.toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q))
      );
    });
  });

  constructor() {
    effect(() => {
      const qOrder = this.order();
      const list = this.myOrders();
      if (qOrder) {
        this.expandedId.set(qOrder);
      } else if (!this.expandedId() && list.length > 0) {
        this.expandedId.set(list[0].id);
      }
    });

    effect(() => {
      const u = this.auth.user();
      if (u && !this.editingProfile()) {
        this.profName = u.name;
        this.profPhone = u.phone;
        this.profAddress = u.address;
      }
    });
  }

  protected toggleOrder(id: string) {
    this.expandedId.update((cur) => (cur === id ? null : id));
  }

  protected stepIdx(status: OrderStatus): number {
    return this.orderSvc.stepIndex(status);
  }

  protected itemImage(item: Order['items'][number]): string {
    const live = this.catalog.byHandle(item.handle) ?? this.catalog.all.find((p) => p.id === item.productId);
    return live?.images[0] || item.image;
  }

  protected confirmReceived(ord: Order) {
    this.orderSvc.confirmReceivedByCustomer(ord.id);
  }

  protected reorder(ord: Order) {
    let addedCount = 0;
    for (const item of ord.items) {
      const prod = this.catalog.byHandle(item.handle) ?? this.catalog.all.find((p) => p.id === item.productId);
      if (prod) {
        const v = prod.variants.find((x) => x.id === item.variantId) ?? prod.variants[0];
        if (this.cart.add(prod, v, item.qty)) addedCount++;
      }
    }
    if (addedCount > 0) {
      this.cart.drawerOpen.set(true);
    } else {
      this.toast.error('Produk dari pesanan ini sudah tidak tersedia.');
    }
  }

  protected saveProfile() {
    this.auth.updateProfile({
      name: this.profName,
      phone: this.profPhone,
      address: this.profAddress,
    });
    this.editingProfile.set(false);
  }
}
