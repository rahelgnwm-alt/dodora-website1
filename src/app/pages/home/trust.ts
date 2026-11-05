import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StaggerDirective } from '../../motion/directives';

@Component({
  selector: 'app-trust',
  imports: [StaggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './trust.scss',
  template: `
    <section class="trust" aria-label="Keunggulan DODORA" data-bg="#FFF4EE">
      <ul class="container trust-grid" dStagger [staggerStep]="0.09">
        @for (t of items; track t.label) {
          <li class="t-item">
            <img [src]="'img/' + t.icon" width="64" height="64" alt="" loading="lazy" decoding="async" />
            <div>
              <strong>{{ t.label }}</strong>
              <span>{{ t.note }}</span>
            </div>
          </li>
        }
      </ul>
    </section>
  `,
})
export class TrustComponent {
  protected readonly items = [
    { icon: 'icon-i4.webp', label: 'Safe for Newborn', note: 'Cocok sejak hari pertama' },
    { icon: 'icon-i1.webp', label: 'Hypoallergenic', note: 'Lembut untuk kulit sensitif' },
    { icon: 'icon-i2.webp', label: 'Natural Active Ingredients', note: 'Dari bahan alami pilihan' },
    { icon: 'icon-i3.webp', label: 'pH Balance Formula', note: 'Menjaga kulit tetap seimbang' },
  ];
}

