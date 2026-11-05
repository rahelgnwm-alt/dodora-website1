import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Lucide-style stroke icons (24×24, 2px stroke, round caps) inlined to avoid an icon-font/network cost. */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[style.width.px]': 'size()', '[style.height.px]': 'size()' },
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
})
export class Icon {
  readonly name = input.required<string>();
  readonly size = input<number>(20);
  readonly stroke = input<number>(2);
}
