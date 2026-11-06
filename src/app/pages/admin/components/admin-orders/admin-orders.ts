import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../../../components/icon/icon';
import { IdrPipe, ProductImage } from '../../../../components/product-image/product-image';
import { ORDER_STATUS_LABEL, OrderService, type Order, type OrderStatus } from '../../../../data/order.service';

@Component({
  selector: 'app-admin-orders',
  imports: [FormsModule, DatePipe, Icon, IdrPipe, ProductImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.scss',
})
export class AdminOrders {
  protected readonly orderSvc = inject(OrderService);

  protected readonly statuses: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  protected readonly statusLabel = (s: OrderStatus) => ORDER_STATUS_LABEL[s];

  protected readonly filterStatus = signal<OrderStatus | 'all'>('all');
  protected readonly query = signal('');
  protected readonly openId = signal<string | null>(this.orderSvc.orders()[0]?.id ?? null);

  protected readonly draftStatus = signal<Record<string, OrderStatus>>({});
  protected readonly draftResi = signal<Record<string, string>>({});
  protected readonly draftNote = signal<Record<string, string>>({});

  protected readonly filtered = computed(() => {
    const st = this.filterStatus();
    const q = this.query().trim().toLowerCase();
    return this.orderSvc.orders().filter((o) => {
      if (st !== 'all' && o.status !== st) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.trackingNumber.toLowerCase().includes(q)
      );
    });
  });

  protected toggle(o: Order) {
    if (this.openId() === o.id) {
      this.openId.set(null);
      return;
    }
    this.openId.set(o.id);
    this.draftStatus.update((m) => ({ ...m, [o.id]: m[o.id] ?? o.status }));
    this.draftResi.update((m) => ({ ...m, [o.id]: m[o.id] ?? o.trackingNumber }));
  }

  protected setStatus(id: string, status: OrderStatus) {
    this.draftStatus.update((m) => ({ ...m, [id]: status }));
  }

  protected setResi(id: string, resi: string) {
    this.draftResi.update((m) => ({ ...m, [id]: resi }));
  }

  protected setNote(id: string, note: string) {
    this.draftNote.update((m) => ({ ...m, [id]: note }));
  }

  protected saveUpdate(o: Order) {
    const status = this.draftStatus()[o.id] ?? o.status;
    const resi = this.draftResi()[o.id] ?? o.trackingNumber;
    const note = this.draftNote()[o.id] ?? '';
    this.orderSvc.updateOrderStatus(o.id, status, resi, note);
    this.setNote(o.id, '');
  }
}
