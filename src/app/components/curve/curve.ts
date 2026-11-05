import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Soft curved SVG section divider. Three distinct silhouettes so sections never share the same edge.
 * `fill` is the colour of the NEXT section; place it at the bottom of the current one.
 */
@Component({
  selector: 'app-curve',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[class.flip]': 'flip()' },
  templateUrl: './curve.html',
  styleUrl: './curve.scss',
})
export class Curve {
  readonly fill = input<string>('#FFF4EE');
  readonly shape = input<1 | 2 | 3>(1);
  readonly flip = input<boolean>(false);
}
