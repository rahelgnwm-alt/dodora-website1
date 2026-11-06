import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../components/icon/icon';
import { IdrPipe } from '../../components/product-image/product-image';
import { AuthService } from '../../data/auth.service';
import { CatalogService } from '../../data/catalog.service';
import { OrderService } from '../../data/order.service';
import { SiteConfigService } from '../../data/site-config.service';
import { AdminLanding } from './components/admin-landing/admin-landing';
import { AdminOrders } from './components/admin-orders/admin-orders';
import { AdminProducts } from './components/admin-products/admin-products';

type AdminTab = 'products' | 'landing' | 'orders';

@Component({
  selector: 'app-admin',
  imports: [RouterLink, Icon, IdrPipe, AdminProducts, AdminLanding, AdminOrders],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {
  protected readonly auth = inject(AuthService);
  protected readonly catalog = inject(CatalogService);
  protected readonly siteConfig = inject(SiteConfigService);
  protected readonly orderSvc = inject(OrderService);

  protected readonly tab = signal<AdminTab>('products');
}
