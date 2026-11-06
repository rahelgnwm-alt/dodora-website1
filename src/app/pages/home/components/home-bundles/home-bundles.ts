import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../../components/icon/icon';
import { ProductCard } from '../../../../components/product-card/product-card';
import { CatalogService } from '../../../../data/catalog.service';
import { FloatDirective, MagneticDirective, MaskDirective, RevealDirective, StaggerDirective } from '../../../../motion/directives';

@Component({
  selector: 'app-home-bundles',
  imports: [RouterLink, Icon, ProductCard, MagneticDirective, MaskDirective, RevealDirective, StaggerDirective, FloatDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-bundles.html',
  styleUrl: './home-bundles.scss',
})
export class HomeBundles {
  private readonly catalog = inject(CatalogService);
  protected readonly bundles = computed(() => this.catalog.bundles());
}
