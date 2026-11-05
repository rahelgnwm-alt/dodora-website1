import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NavigationStart, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { CartService } from '../data/cart.service';
import { CatalogService } from '../data/catalog.service';
import { CATEGORY_LABEL, type Category } from '../data/product.model';
import { MotionService } from '../motion/motion.service';
import { stickyHeaderAnimation } from '../motion/utilities';
import { IconComponent } from '../ui/icon';
import { IdrPipe, ProductImageComponent } from '../ui/product-image';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, IconComponent, IdrPipe, ProductImageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './header.scss',
  template: `
    <div class="sentinel" #sentinel aria-hidden="true"></div>
    <header class="hdr" #hdr>
      <div class="hdr-pill">
        <a routerLink="/" class="logo" aria-label="DODORA — beranda">
          <span class="logo-mark" aria-hidden="true"></span>
        </a>

        <nav class="nav" aria-label="Navigasi utama">
          <a routerLink="/" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link"><span>Beranda</span></a>
          <a routerLink="/belanja" routerLinkActive="is-active" class="nav-link"><span>Belanja</span></a>
          <a routerLink="/" fragment="rutinitas" class="nav-link" (click)="jumpTo('rutinitas')"><span>Rutinitas</span></a>
          <a routerLink="/" fragment="tentang" class="nav-link" (click)="jumpTo('tentang')"><span>Tentang</span></a>
        </nav>

        <div class="actions">
          <button type="button" class="icon-btn" (click)="openSearch()" aria-label="Cari produk" aria-haspopup="dialog">
            <app-icon name="search" [size]="22" />
          </button>
          <button type="button" class="icon-btn cart-btn" (click)="cart.drawerOpen.set(true)" [attr.aria-label]="'Buka keranjang, ' + cart.count() + ' item'" aria-haspopup="dialog">
            <app-icon name="bag" [size]="22" />
            <span class="badge" [class.bump]="bump()" [hidden]="cart.count() === 0">{{ cart.count() }}</span>
          </button>
          <button type="button" class="icon-btn menu-btn" (click)="openMenu()" aria-label="Buka menu" aria-haspopup="dialog">
            <app-icon name="menu" [size]="24" />
          </button>
        </div>
      </div>
    </header>

    <!-- Search panel -->
    <dialog class="panel search" #searchDlg aria-label="Cari produk" (click)="backdrop($event, searchDlg)" (close)="closed()">
      <div class="panel-in" data-lenis-prevent>
        <form class="search-form" (submit)="submitSearch($event, searchDlg)" role="search">
          <app-icon name="search" [size]="24" />
          <input #q type="search" name="q" autocomplete="off" placeholder="Cari body bath, shampoo, balm…" aria-label="Cari produk" [value]="query()" (input)="query.set(q.value)" />
          <button type="button" class="icon-btn" (click)="searchDlg.close()" aria-label="Tutup pencarian"><app-icon name="close" [size]="22" /></button>
        </form>
        @if (query().trim()) {
          <ul class="results" aria-live="polite">
            @for (p of results(); track p.id) {
              <li>
                <a [routerLink]="['/produk', p.handle]" (click)="searchDlg.close()">
                  <span class="r-img"><app-pimg [src]="p.images[0]" sizes="64px" /></span>
                  <span class="r-txt"><strong>{{ p.name }}</strong><small>{{ p.tagline }}</small></span>
                  <span class="r-price">{{ p.variants[0].price | idr }}</span>
                </a>
              </li>
            } @empty {
              <li class="none">Tidak ada produk untuk “{{ query() }}”.</li>
            }
          </ul>
        } @else {
          <div class="quick">
            <span>Kategori populer</span>
            <div>
              @for (c of cats; track c) {
                <a class="chip" routerLink="/belanja" [queryParams]="{ kategori: c }" (click)="searchDlg.close()">{{ label(c) }}</a>
              }
            </div>
          </div>
        }
      </div>
    </dialog>

    <!-- Mobile drawer -->
    <dialog class="panel menu" #menuDlg aria-label="Menu" (click)="backdrop($event, menuDlg)" (close)="closed()">
      <div class="menu-in" data-lenis-prevent>
        <div class="menu-top">
          <span class="logo-mark" aria-hidden="true"></span>
          <button type="button" class="icon-btn" (click)="menuDlg.close()" aria-label="Tutup menu"><app-icon name="close" [size]="24" /></button>
        </div>
        <nav aria-label="Menu seluler" class="menu-nav">
          <a routerLink="/" style="--i: 0" (click)="menuDlg.close()"><span>Beranda</span><app-icon name="arrow-right" /></a>
          <a routerLink="/belanja" style="--i: 1" (click)="menuDlg.close()"><span>Belanja</span><app-icon name="arrow-right" /></a>
          <a routerLink="/" fragment="rutinitas" style="--i: 2" (click)="menuDlg.close(); jumpTo('rutinitas')"><span>Rutinitas</span><app-icon name="arrow-right" /></a>
          <a routerLink="/" fragment="tentang" style="--i: 3" (click)="menuDlg.close(); jumpTo('tentang')"><span>Tentang</span><app-icon name="arrow-right" /></a>
        </nav>
        <div class="menu-foot" style="--i: 4">
          <button type="button" class="btn btn--salmon" (click)="menuDlg.close(); cart.drawerOpen.set(true)">
            <span class="btn-label"><app-icon name="bag" /> Keranjang ({{ cart.count() }})</span>
          </button>
          <p>Little Skin, Big Care.</p>
        </div>
      </div>
    </dialog>
  `,
})
export class HeaderComponent {
  protected readonly cart = inject(CartService);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly motion = inject(MotionService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly hdr = viewChild.required<ElementRef<HTMLElement>>('hdr');
  private readonly sentinel = viewChild.required<ElementRef<HTMLElement>>('sentinel');
  private readonly searchDlg = viewChild.required<ElementRef<HTMLDialogElement>>('searchDlg');
  private readonly menuDlg = viewChild.required<ElementRef<HTMLDialogElement>>('menuDlg');

  protected readonly cats: Category[] = ['bath', 'hair', 'skin', 'bundle'];
  protected readonly query = signal('');
  protected readonly results = signal<ReturnType<CatalogService['search']>>([]);
  protected readonly bump = signal(false);
  protected readonly label = (c: Category) => CATEGORY_LABEL[c];

  private lastCount = this.cart.count();

  constructor() {
    afterNextRender(() => {
      const d = stickyHeaderAnimation(this.hdr().nativeElement, this.sentinel().nativeElement);
      this.destroyRef.onDestroy(d);
    });
    // search results follow the query
    effect(() => this.results.set(this.catalog.search(this.query())));
    // cart badge bump on change
    effect(() => {
      const n = this.cart.count();
      if (n > this.lastCount) {
        this.bump.set(false);
        requestAnimationFrame(() => this.bump.set(true));
        setTimeout(() => this.bump.set(false), 600);
      }
      this.lastCount = n;
    });
    // close any open panel on navigation
    const nav = toSignal(this.router.events.pipe(filter((e) => e instanceof NavigationStart), map(() => Date.now())));
    effect(() => {
      nav();
      for (const d of [this.searchDlg(), this.menuDlg()]) if (d.nativeElement.open) d.nativeElement.close();
    });
  }

  protected openSearch() {
    const d = this.searchDlg().nativeElement;
    if (d.open) return;
    this.motion.lockScroll(true);
    d.showModal();
    queueMicrotask(() => d.querySelector<HTMLInputElement>('input')?.focus());
  }
  protected openMenu() {
    const d = this.menuDlg().nativeElement;
    if (d.open) return;
    this.motion.lockScroll(true);
    d.showModal();
  }
  protected closed() {
    this.motion.lockScroll(false);
  }
  protected backdrop(e: MouseEvent, d: HTMLDialogElement) {
    if (e.target === d) d.close();
  }
  protected submitSearch(e: Event, d: HTMLDialogElement) {
    e.preventDefault();
    const q = this.query().trim();
    if (!q) return;
    d.close();
    this.router.navigate(['/belanja'], { queryParams: { q } });
  }
  protected jumpTo(id: string) {
    requestAnimationFrame(() => this.motion.scrollToId(id));
  }
}

