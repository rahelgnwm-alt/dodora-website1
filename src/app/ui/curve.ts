import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Soft curved SVG section divider. Three distinct silhouettes so sections never share the same edge.
 * `fill` is the colour of the NEXT section; place it at the bottom of the current one.
 */
@Component({
  selector: 'app-curve',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[class.flip]': 'flip()' },
  styles: `
    :host {
      display: block;
      line-height: 0;
      height: clamp(36px, 7vw, 110px);
      margin-top: calc(clamp(36px, 7vw, 110px) * -1 + 1px);
      position: relative;
      z-index: 2;
      pointer-events: none;
    }
    :host(.flip) {
      transform: scaleY(-1);
      margin-top: 0;
      margin-bottom: calc(clamp(36px, 7vw, 110px) * -1 + 1px);
    }
    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  `,
  template: `
    <svg viewBox="0 0 1440 120" preserveAspectRatio="none" focusable="false">
      @switch (shape()) {
        @case (1) { <path [style.fill]="fill()" d="M0 120V70C180 20 360 0 540 28c200 32 330 78 540 56 150-16 260-48 360-80v116Z" /> }
        @case (2) { <path [style.fill]="fill()" d="M0 120V40c120 36 240 50 360 36s240-58 360-58 240 50 360 58 240-20 360-52v96Z" /> }
        @default { <path [style.fill]="fill()" d="M0 120V84C240 -4 480 -8 720 52s480 52 720-24v92Z" /> }
      }
    </svg>
  `,
})
export class CurveComponent {
  readonly fill = input<string>('#FFF4EE');
  readonly shape = input<1 | 2 | 3>(1);
  readonly flip = input<boolean>(false);
}

