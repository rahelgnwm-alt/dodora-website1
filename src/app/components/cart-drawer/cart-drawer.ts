import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../data/cart.service';
import { MotionService } from '../../motion/motion.service';
import { Icon } from '../icon/icon';
import { IdrPipe, ProductImage } from '../product-image/product-image';

/**
 * Cart drawer on a native <dialog>. Checkout is a plain link to the store's cart permalink, so
 * purchasing never depends on animation or script completion.
 */
@Component({
  selector: 'app-cart-drawer',
  imports: [RouterLink, Icon, IdrPipe, ProductImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.scss',
})
export class CartDrawer {
  protected readonly cart = inject(CartService);
  private readonly motion = inject(MotionService);
  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');

  constructor() {
    effect(() => {
      const open = this.cart.drawerOpen();
      const d = this.dlg().nativeElement;
      if (open && !d.open) {
        this.motion.lockScroll(true);
        d.showModal();
      } else if (!open && d.open) {
        d.close();
      }
    });
  }

  protected onClose() {
    if (this.cart.drawerOpen()) this.motion.lockScroll(false);
    this.cart.drawerOpen.set(false);
  }
  protected backdrop(e: MouseEvent) {
    if (e.target === this.dlg().nativeElement) this.dlg().nativeElement.close();
  }
}
