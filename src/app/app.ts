import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs';
import { CartDrawerComponent } from './shell/cart-drawer';
import { FooterComponent } from './shell/footer';
import { HeaderComponent } from './shell/header';
import { PreloaderComponent } from './shell/preloader';
import { ToastsComponent } from './ui/toasts';
import { pageTransition } from './motion/utilities';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CartDrawerComponent, PreloaderComponent, ToastsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main" (click)="skip($event)">Lewati ke konten utama</a>
    <app-preloader />
    <app-header />
    <main id="main" #main tabindex="-1"><router-outlet /></main>
    <app-footer />
    <app-cart-drawer />
    <app-toasts />
    <p class="sr-only" role="status" aria-live="polite">{{ announce() }}</p>
  `,
  styles: `
    main {
      outline: 0;
      min-height: 100svh;
    }
  `,
})
export class App {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  protected readonly announce = signal('');
  private first = true;

  constructor() {
    // Focus management for client-side navigations: move focus to <main> and announce the new page.
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      pageTransition.clear();
      if (this.first) {
        this.first = false;
        return;
      }
      if (e.urlAfterRedirects.includes('#')) return; // in-page anchor: let the browser/router scroll
      setTimeout(() => {
        this.main().nativeElement.focus({ preventScroll: true });
        this.announce.set(`Halaman dimuat: ${this.title.getTitle()}`);
      }, 60);
    });
  }

  protected skip(e: Event) {
    e.preventDefault();
    this.main().nativeElement.focus();
    this.main().nativeElement.scrollIntoView();
  }
}
