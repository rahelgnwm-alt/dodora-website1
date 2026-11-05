import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs';
import { CartDrawer } from './components/cart-drawer/cart-drawer';
import { Footer } from './components/footer/footer';
import { Header } from './components/header/header';
import { Preloader } from './components/preloader/preloader';
import { Toasts } from './components/toasts/toasts';
import { pageTransition } from './motion/utilities';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, CartDrawer, Preloader, Toasts],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
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
