import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../data/cart.service';
import { CATEGORY_LABEL, type Product } from '../../data/product.model';
import { CardHoverDirective } from '../../motion/directives';
import { pageTransition } from '../../motion/utilities';
import { Icon } from '../icon/icon';
import { IdrPipe, ProductImage } from '../product-image/product-image';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, Icon, IdrPipe, ProductImage, CardHoverDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  private readonly cart = inject(CartService);
  readonly product = input.required<Product>();
  readonly eager = input<boolean>(false);
  readonly size = input<'md' | 'lg'>('md');

  protected readonly variant = computed(() => this.product().variants.find((v) => v.available) ?? this.product().variants[0]);
  protected readonly from = computed(() => Math.min(...this.product().variants.map((v) => v.price)));
  protected readonly cat = computed(() => CATEGORY_LABEL[this.product().category]);
  protected readonly added = computed(() => this.cart.lastAdded() === this.variant().id);

  protected add() {
    this.cart.add(this.product(), this.variant());
  }

  protected markShared(el: HTMLElement) {
    pageTransition.markSource(el);
  }
}
