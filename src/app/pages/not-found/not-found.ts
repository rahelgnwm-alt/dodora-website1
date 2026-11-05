import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    section {
      display: grid;
      place-content: center;
      justify-items: center;
      gap: 18px;
      min-height: 80svh;
      padding: 120px var(--gutter) 60px;
      text-align: center;
    }
    h1 {
      font-size: clamp(2.4rem, 7vw, 5rem);
    }
  `,
  template: `
    <section>
      <h1>Halaman tidak ditemukan</h1>
      <p>Halaman yang kamu cari belum ada. Yuk, lanjut belanja perawatan lembut untuk Si Kecil.</p>
      <a routerLink="/belanja" class="btn"><span class="btn-label">Belanja sekarang</span></a>
    </section>
  `,
})
export class NotFoundPage {}

