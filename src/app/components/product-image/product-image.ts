import { ChangeDetectionStrategy, Component, Pipe, PipeTransform, computed, effect, input, signal } from '@angular/core';

const WIDTHS = [240, 360, 480, 640, 800, 1000];

function isShopifyCdn(src: string): boolean {
  return src.includes('cdn.shopify.com') && !src.startsWith('data:') && !src.startsWith('blob:');
}

/** Shopify CDN URL at a given width; leaves uploaded data URLs, local assets, and external URLs untouched. */
export function cdn(src: string, w: number): string {
  if (!isShopifyCdn(src)) return src;
  const sep = src.includes('?') ? '&' : '?';
  return `${src}${sep}width=${w}`;
}

@Pipe({ name: 'idr' })
export class IdrPipe implements PipeTransform {
  private static readonly fmt = new Intl.NumberFormat('id-ID');
  transform(v: number): string {
    return 'Rp' + IdrPipe.fmt.format(v);
  }
}

/** Responsive, lazy product image with intrinsic size (zero CLS). */
@Component({
  selector: 'app-pimg',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:block' },
  templateUrl: './product-image.html',
  styleUrl: './product-image.scss',
})
export class ProductImage {
  readonly src = input.required<string>();
  readonly alt = input<string>('');
  readonly sizes = input<string>('(min-width: 900px) 30vw, 90vw');
  readonly eager = input<boolean>(false);

  private readonly failed = signal(false);

  constructor() {
    effect(() => {
      this.src();
      this.failed.set(false);
    });
  }

  protected readonly effectiveSrc = computed(() => (this.failed() || !this.src() ? 'img/scene-bath.webp' : this.src()));
  readonly url = computed(() => cdn(this.effectiveSrc(), 640));
  readonly srcset = computed(() =>
    isShopifyCdn(this.effectiveSrc()) ? WIDTHS.map((w) => `${cdn(this.effectiveSrc(), w)} ${w}w`).join(', ') : null,
  );

  protected onError() {
    if (!this.failed()) this.failed.set(true);
  }
}
