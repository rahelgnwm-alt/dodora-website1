import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurveComponent } from '../ui/curve';
import { IconComponent } from '../ui/icon';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, CurveComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './footer.scss',
  template: `
    <footer class="ft">
      <app-curve fill="#AE625B" [shape]="2" />
      <div class="ft-in container">
        <div class="ft-brand">
          <span class="ft-logo" aria-hidden="true"></span>
          <p>Little Skin, Big Care. Gentle care untuk Bunda dan Si Kecil sejak hari pertama.</p>
          <a class="ft-ext" href="https://dodoraofficial.com/" rel="noopener">dodoraofficial.com <app-icon name="arrow-up-right" [size]="16" /></a>
        </div>
        <nav aria-label="Toko">
          <h2>Toko</h2>
          <a routerLink="/belanja">Semua produk</a>
          <a routerLink="/belanja" [queryParams]="{ kategori: 'bath' }">Mandi</a>
          <a routerLink="/belanja" [queryParams]="{ kategori: 'hair' }">Rambut</a>
          <a routerLink="/belanja" [queryParams]="{ kategori: 'skin' }">Kulit</a>
          <a routerLink="/belanja" [queryParams]="{ kategori: 'bundle' }">Bundling</a>
        </nav>
        <nav aria-label="Bantuan">
          <h2>Bantuan</h2>
          <a href="https://dodoraofficial.com/pages/support/faq" rel="noopener">FAQ</a>
          <a href="https://dodoraofficial.com/pages/support/shipping-deliveries" rel="noopener">Pengiriman</a>
          <a href="https://dodoraofficial.com/pages/support/payment" rel="noopener">Pembayaran</a>
          <a href="https://dodoraofficial.com/pages/support/return" rel="noopener">Pengembalian</a>
          <a href="https://dodoraofficial.com/pages/contact" rel="noopener">Kontak</a>
        </nav>
      </div>
      <p class="ft-copy container">© {{ year }} DODORA. Seluruh hak cipta dilindungi.</p>
    </footer>
  `,
})
export class FooterComponent {
  protected readonly year = new Date().getFullYear();
}

