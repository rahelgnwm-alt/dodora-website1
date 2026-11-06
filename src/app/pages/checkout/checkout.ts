import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '../../components/icon/icon';
import { IdrPipe, ProductImage } from '../../components/product-image/product-image';
import { AuthService } from '../../data/auth.service';
import { CartService } from '../../data/cart.service';
import { OrderService, type Order } from '../../data/order.service';
import { ToastService } from '../../data/toast.service';

interface CourierOption {
  id: string;
  label: string;
  eta: string;
  cost: number;
}

@Component({
  selector: 'app-checkout',
  imports: [FormsModule, RouterLink, Icon, IdrPipe, ProductImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  private readonly orders = inject(OrderService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly couriers: CourierOption[] = [
    { id: 'sicepat', label: 'SiCepat BEST', eta: 'Estimasi 1–2 hari', cost: 12000 },
    { id: 'jne', label: 'JNE Reguler', eta: 'Estimasi 2–3 hari', cost: 15000 },
    { id: 'jnt', label: 'J&T Express', eta: 'Estimasi 2–3 hari', cost: 14000 },
  ];
  protected readonly payments = ['QRIS Instan', 'BCA Virtual Account', 'Mandiri Virtual Account', 'COD (Bayar di Tempat)'];

  protected name = '';
  protected email = '';
  protected phone = '';
  protected address = '';
  protected notes = '';
  protected readonly selectedCourier = signal<CourierOption>(this.couriers[0]);
  protected readonly selectedPayment = signal<string>(this.payments[0]);
  protected readonly placedOrder = signal<Order | null>(null);

  protected readonly freeShipping = computed(() => this.cart.subtotal() >= 250000);
  protected readonly shippingCost = computed(() => (this.freeShipping() ? 0 : this.selectedCourier().cost));
  protected readonly grandTotal = computed(() => this.cart.subtotal() + this.shippingCost());

  constructor() {
    effect(() => {
      const u = this.auth.user();
      if (u) {
        if (!this.name) this.name = u.name;
        if (!this.email) this.email = u.email;
        if (!this.phone) this.phone = u.phone;
        if (!this.address) this.address = u.address;
      }
    });
  }

  protected placeOrder() {
    if (!this.cart.lines().length) {
      this.toast.error('Keranjang masih kosong.');
      return;
    }
    if (!this.name.trim() || !this.email.trim() || !this.phone.trim() || !this.address.trim()) {
      this.toast.error('Mohon lengkapi nama, email, nomor telepon, dan alamat pengiriman.');
      return;
    }
    const c = this.selectedCourier();
    const order = this.orders.placeOrder({
      customerEmail: this.email,
      customerName: this.name,
      phone: this.phone,
      address: this.address,
      notes: this.notes,
      courier: this.freeShipping() ? `${c.label} (Gratis Ongkir)` : c.label,
      shippingCost: this.shippingCost(),
      paymentMethod: this.selectedPayment(),
      items: this.cart.lines(),
    });
    this.cart.clear();
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/akun'], { queryParams: { order: order.id } });
    } else {
      this.placedOrder.set(order);
    }
  }
}
