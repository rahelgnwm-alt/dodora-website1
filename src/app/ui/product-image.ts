import { ChangeDetectionStrategy, Component, Pipe, PipeTransform, computed, input } from '@angular/core';

const WIDTHS = [240, 360, 480, 640, 800, 1000];

/** Shopify CDN URL at a given width (the CDN negotiates WebP/AVIF from the Accept header). */
export function cdn(src: string, w: number): string {
  return `${src}?width=${w}`;
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
  styles: `
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      aspect-ratio: 1;
    }
  `,
  template: `<img
    [src]="url()"
    [attr.srcset]="srcset()"
    [attr.sizes]="sizes()"
    [alt]="alt()"
    width="800"
    height="800"
    [attr.loading]="eager() ? 'eager' : 'lazy'"
    [attr.fetchpriority]="eager() ? 'high' : null"
    decoding="async"
    draggable="false"
  />`,
})
export class ProductImageComponent {
  readonly src = input.required<string>();
  readonly alt = input<string>('');
  readonly sizes = input<string>('(min-width: 900px) 30vw, 90vw');
  readonly eager = input<boolean>(false);
  readonly url = computed(() => cdn(this.src(), 640));
  readonly srcset = computed(() => WIDTHS.map((w) => `${cdn(this.src(), w)} ${w}w`).join(', '));
}

