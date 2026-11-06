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
import { AuthService } from '../../data/auth.service';
import { CartService } from '../../data/cart.service';
import { CatalogService } from '../../data/catalog.service';
import { CATEGORY_LABEL, type Category } from '../../data/product.model';
import { MotionService } from '../../motion/motion.service';
import { stickyHeaderAnimation } from '../../motion/utilities';
import { Icon } from '../icon/icon';
import { IdrPipe, ProductImage } from '../product-image/product-image';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Icon, IdrPipe, ProductImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly auth = inject(AuthService);
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
