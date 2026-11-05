import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Lucide-style stroke icons (24×24, 2px stroke, round caps) inlined to avoid an icon-font/network cost. */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[style.width.px]': 'size()', '[style.height.px]': 'size()' },
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="stroke()" stroke-linecap="round" stroke-linejoin="round">
      @switch (name()) {
        @case ('search') { <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /> }
        @case ('bag') { <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /> }
        @case ('menu') { <path d="M4 7h16M4 12h16M4 17h16" /> }
        @case ('close') { <path d="M18 6 6 18M6 6l12 12" /> }
        @case ('plus') { <path d="M5 12h14M12 5v14" /> }
        @case ('minus') { <path d="M5 12h14" /> }
        @case ('check') { <path d="M20 6 9 17l-5-5" /> }
        @case ('arrow-right') { <path d="M5 12h14M12 5l7 7-7 7" /> }
        @case ('arrow-left') { <path d="M19 12H5M12 19l-7-7 7-7" /> }
        @case ('arrow-up-right') { <path d="M7 7h10v10M7 17 17 7" /> }
        @case ('chevron-down') { <path d="m6 9 6 6 6-6" /> }
        @case ('droplet') { <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /> }
        @case ('sparkles') { <path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z" /><path d="M19 15v4M17 17h4" /> }
        @case ('shield') { <path d="M20 13c0 5-3.5 7.5-7.7 8.9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /> }
        @case ('heart') { <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" /> }
        @case ('truck') { <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.7a1 1 0 0 0-.2-.6l-3.3-4.2a1 1 0 0 0-.8-.4H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /> }
        @case ('alert') { <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /> }
        @case ('trash') { <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /> }
      }
    </svg>
  `,
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input<number>(20);
  readonly stroke = input<number>(2);
}

