import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Curve } from '../../../../components/curve/curve';
import { Icon } from '../../../../components/icon/icon';
import { IdrPipe, ProductImage } from '../../../../components/product-image/product-image';
import { CartService } from '../../../../data/cart.service';
import { CatalogService } from '../../../../data/catalog.service';
import type { Product } from '../../../../data/product.model';
import { FloatDirective, MaskDirective, RevealDirective, WordsDirective } from '../../../../motion/directives';

interface Step {
  id: string;
  n: string;
  title: string;
  img: string;
  bg: string;
  accent: string;
  text: string;
  alt: string;
  handles: string[];
}

/**
 * Interactive daily routine: a real tablist (keyboard + screen-reader friendly) driven by Angular state.
 * Every step is reachable without animation; transitions are CSS-only and collapse under reduced motion.
 * On touch, the scene/panel also responds to horizontal swipes.
 */
@Component({
  selector: 'app-home-routine',
  imports: [RouterLink, Curve, Icon, IdrPipe, ProductImage, MaskDirective, RevealDirective, WordsDirective, FloatDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.--rt-bg]': 'step().bg' },
  templateUrl: './home-routine.html',
  styleUrl: './home-routine.scss',
})
export class HomeRoutine {
  protected readonly cart = inject(CartService);
  private readonly catalog = inject(CatalogService);

  protected readonly steps: Step[] = [
    {
      id: 'mandi',
      n: '01',
      title: 'Mandi',
      img: 'scene-bath.webp',
      bg: '#FBDDE6',
      accent: '#F1B0C4',
      alt: 'DODORA Body Bath di atas rak kayu bersama handuk lembut dan bebek mandi',
      text: 'Bersihkan dengan lembut. Body Bath berformula pH 5,5 dengan mild surfactant, lembut di mata dan cocok untuk kulit sensitif bayi, dengan active milk protein dan sodium PCA agar kulit tetap lembap.',
      handles: ['dodora-baby-and-kids-body-bath'],
    },
    {
      id: 'melembapkan',
      n: '02',
      title: 'Melembapkan',
      img: 'scene-lotion.webp',
      bg: '#FDDCD3',
      accent: '#F79C8A',
      alt: 'DODORA Body Lotion + Serum extra 3in1 dengan hyaluronate dan ceramide',
      text: 'Jaga kelembapan kulit. Serum Body Lotion dengan ceramide complex dan hyaluronate complex membantu melembutkan, menenangkan, dan membuat kulit halus dan kenyal. Multipurpose Balm menenangkan area kulit yang butuh perhatian ekstra.',
      handles: ['dodora-body-lotion-serum', 'dodora-multipurpose-balm'],
    },
    {
      id: 'rambut',
      n: '03',
      title: 'Merawat Rambut',
      img: 'scene-hair.webp',
      bg: '#DCE8F6',
      accent: '#89AEDB',
      alt: 'DODORA Nourish Hair Serum di atas handuk merah muda',
      text: 'Shampoo dengan Ginseng, Argan Oil, dan Centella Asiatica membersihkan kulit kepala tanpa pedih di mata. Nourish Hair Serum dengan milk based protein dan aloe vera menutrisi rambut dan membantu memperkuat akar rambut.',
      handles: ['dodora-baby-and-kids-gentle-hair-shampoo', 'dodora-nourish-hair-serum'],
    },
    {
      id: 'siap',
      n: '04',
      title: 'Siap Beraktivitas',
      img: 'toddler-joy.webp',
      bg: '#FFE6DB',
      accent: '#AE625B',
      alt: 'Balita tersenyum riang mengangkat kedua tangan',
      text: 'Kulit lembap, rambut wangi, Si Kecil siap bermain. Multipurpose Balm dengan lavender dan eucalyptus essential oil memberi rasa hangat dan nyaman. Lengkapi rutinitas dengan paket bundling hemat.',
      handles: ['dodora-multipurpose-balm', 'dodora-spesial-bundling-perawatan-kulit-harian-body-bath-lotion-multipurpose-balm'],
    },
  ];

  protected readonly active = signal(0);
  protected readonly step = computed(() => this.steps[this.active()]);
  protected swipeId = -1;
  private swipeX = 0;

  protected recos(i: number): Product[] {
    return this.steps[i].handles.map((h) => this.catalog.byHandle(h)).filter((p): p is Product => !!p);
  }

  protected go(i: number) {
    this.active.set(Math.min(this.steps.length - 1, Math.max(0, i)));
  }

  protected add(p: Product) {
    this.cart.add(p, p.variants.find((v) => v.available) ?? p.variants[0]);
  }

  protected onKey(e: KeyboardEvent) {
    const map: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next = this.active();
    if (e.key in map) next += map[e.key];
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = this.steps.length - 1;
    else return;
    e.preventDefault();
    this.go(next);
    queueMicrotask(() => document.getElementById('tab-' + this.steps[this.active()].id)?.focus());
  }

  protected swipeStart(e: PointerEvent) {
    if (e.pointerType === 'mouse') return;
    this.swipeId = e.pointerId;
    this.swipeX = e.clientX;
  }
  protected swipeEnd(e: PointerEvent) {
    if (e.pointerId !== this.swipeId) return;
    this.swipeId = -1;
    const dx = e.clientX - this.swipeX;
    if (Math.abs(dx) > 56) this.go(this.active() + (dx < 0 ? 1 : -1));
  }
}
