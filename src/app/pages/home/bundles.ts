import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../data/catalog.service';
import { FloatDirective, MagneticDirective, MaskDirective, RevealDirective, StaggerDirective } from '../../motion/directives';
import { IconComponent } from '../../ui/icon';
import { ProductCardComponent } from '../../ui/product-card';

@Component({
  selector: 'app-bundles',
  imports: [RouterLink, IconComponent, ProductCardComponent, MagneticDirective, MaskDirective, RevealDirective, StaggerDirective, FloatDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './bundles.scss',
  template: `
    <section class="bd" aria-labelledby="bd-title">
      <span class="orb orb--pink bd-orb" dFloat [floatAmp]="14" [floatDuration]="8" aria-hidden="true"></span>
      <div class="container">
        <header class="bd-head">
          <div>
            <p class="eyebrow" dReveal>Paket hemat</p>
            <h2 id="bd-title" dMask>
              <span class="ml"><span class="ml-i">Spesial bundling</span></span>
            </h2>
          </div>
          <a routerLink="/belanja" [queryParams]="{ kategori: 'bundle' }" class="btn btn--soft btn--sm" dMagnetic>
            <span class="btn-label">Semua bundling <app-icon name="arrow-right" [size]="18" /></span>
          </a>
        </header>
        <div class="bd-grid" dStagger staggerSelector=".bd-item" [staggerStep]="0.1" [staggerY]="34">
          @for (p of bundles; track p.id) {
            <div class="bd-item"><app-product-card [product]="p" /></div>
          }
        </div>
      </div>
    </section>
  `,
})
export class BundlesComponent {
  protected readonly bundles = inject(CatalogService).bundles();
}

