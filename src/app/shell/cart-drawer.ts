import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../data/cart.service';
import { MotionService } from '../motion/motion.service';
import { IconComponent } from '../ui/icon';
import { IdrPipe, ProductImageComponent } from '../ui/product-image';

/**
 * Cart drawer on a native <dialog>. Checkout is a plain link to the store's cart permalink, so
 * purchasing never depends on animation or script completion.
 */
@Component({
  selector: 'app-cart-drawer',
  imports: [RouterLink, IconComponent, IdrPipe, ProductImageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './cart-drawer.scss',
  template: `
    <dialog #dlg class="drawer" aria-labelledby="cart-title" (click)="backdrop($event)" (close)="onClose()">
      <div class="d-in">
        <header class="d-head">
          <h2 id="cart-title">Keranjang <span>({{ cart.count() }})</span></h2>
          <button type="button" class="x" (click)="dlg.close()" aria-label="Tutup keranjang"><app-icon name="close" [size]="22" /></button>
        </header>

        <div class="d-body" data-lenis-prevent>
          @if (cart.lines().length === 0) {
            <div class="empty">
              <span class="orb orb--pink" style="--s: 84px; position: relative"></span>
              <p>Keranjangmu masih kosong.</p>
              <a routerLink="/belanja" class="btn btn--salmon" (click)="dlg.close()"><span class="btn-label">Mulai belanja <app-icon name="arrow-right" /></span></a>
            </div>
          } @else {
            <ul class="lines">
              @for (l of cart.lines(); track l.variantId) {
                <li class="line">
                  <a class="l-img" [routerLink]="['/produk', l.handle]" (click)="dlg.close()" tabindex="-1" aria-hidden="true">
                    <app-pimg [src]="l.image" sizes="88px" />
                  </a>
                  <div class="l-info">
                    <a class="l-name" [routerLink]="['/produk', l.handle]" (click)="dlg.close()">{{ l.name }}</a>
                    <span class="l-var">{{ l.variantTitle }}</span>
                    <div class="l-row">
                      <div class="qty" role="group" [attr.aria-label]="'Jumlah ' + l.name">
                        <button type="button" (click)="cart.setQty(l.variantId, l.qty - 1)" [attr.aria-label]="'Kurangi ' + l.name"><app-icon name="minus" [size]="16" [stroke]="2.5" /></button>
                        <output [attr.aria-live]="'polite'">{{ l.qty }}</output>
                        <button type="button" (click)="cart.setQty(l.variantId, l.qty + 1)" [attr.aria-label]="'Tambah ' + l.name"><app-icon name="plus" [size]="16" [stroke]="2.5" /></button>
                      </div>
                      <strong class="l-price">{{ l.price * l.qty | idr }}</strong>
                    </div>
                  </div>
                  <button type="button" class="l-rm" (click)="cart.remove(l.variantId)" [attr.aria-label]="'Hapus ' + l.name"><app-icon name="trash" [size]="18" /></button>
                </li>
              }
            </ul>
          }
        </div>

        @if (cart.lines().length) {
          <footer class="d-foot">
            <div class="sub"><span>Subtotal</span><strong>{{ cart.subtotal() | idr }}</strong></div>
            <p class="note">Ongkos kirim dan pembayaran dihitung di checkout toko resmi DODORA.</p>
            <a class="btn btn--block" [href]="cart.checkoutUrl()" rel="noopener">
              <span class="btn-label">Lanjut ke checkout <app-icon name="arrow-right" /></span>
            </a>
          </footer>
        }
      </div>
    </dialog>
  `,
})
export class CartDrawerComponent {
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

