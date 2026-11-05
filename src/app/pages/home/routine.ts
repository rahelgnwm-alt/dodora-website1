import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../data/cart.service';
import { CatalogService } from '../../data/catalog.service';
import type { Product } from '../../data/product.model';
import { FloatDirective, MaskDirective, RevealDirective, WordsDirective } from '../../motion/directives';
import { CurveComponent } from '../../ui/curve';
import { IconComponent } from '../../ui/icon';
import { IdrPipe, ProductImageComponent } from '../../ui/product-image';

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
  selector: 'app-routine',
  imports: [RouterLink, CurveComponent, IconComponent, IdrPipe, ProductImageComponent, MaskDirective, RevealDirective, WordsDirective, FloatDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.--rt-bg]': 'step().bg' },
  styleUrl: './routine.scss',
  template: `
    <app-curve fill="var(--rt-bg)" [shape]="2" />
    <section id="rutinitas" class="rt" aria-labelledby="rt-title" [style.--rt-accent]="step().accent" data-bg="#FFF4EE">
      <span class="orb orb--pink rt-orb rt-orb1" dFloat [floatAmp]="16" [floatDuration]="8" aria-hidden="true"></span>
      <span class="orb orb--blue rt-orb rt-orb2" dFloat [floatAmp]="12" aria-hidden="true"></span>

      <div class="container">
        <header class="rt-head">
          <p class="eyebrow" dReveal>Rutinitas harian</p>
          <h2 id="rt-title" dMask>
            <span class="ml"><span class="ml-i">Dari mandi sampai</span></span>
            <span class="ml"><span class="ml-i">siap bermain</span></span>
          </h2>
          <p class="rt-lead" dWords>Empat langkah lembut yang membuat hari Si Kecil dimulai dengan nyaman.</p>
        </header>

        <div class="rt-progress" aria-hidden="true">
          <span class="rt-count">Langkah {{ active() + 1 }} / {{ steps.length }}</span>
          <span class="rt-track"><span class="rt-fill" [style.transform]="'scaleX(' + (active() + 1) / steps.length + ')'"></span></span>
        </div>

        <div class="rt-tabs" role="tablist" aria-label="Langkah rutinitas" (keydown)="onKey($event)">
          @for (s of steps; track s.id; let i = $index) {
            <button
              type="button"
              role="tab"
              class="rt-tab"
              [id]="'tab-' + s.id"
              [attr.aria-selected]="active() === i"
              [attr.aria-controls]="'panel-' + s.id"
              [tabindex]="active() === i ? 0 : -1"
              [class.is-active]="active() === i"
              [class.is-done]="i < active()"
              (click)="go(i)"
            >
              <span class="rt-tab-n">{{ s.n }}</span>
              <span class="rt-tab-t">{{ s.title }}</span>
            </button>
          }
        </div>

        <div class="rt-body" (pointerdown)="swipeStart($event)" (pointerup)="swipeEnd($event)" (pointercancel)="swipeId = -1">
          <div class="rt-scene" aria-hidden="false">
            <span class="rt-blob"></span>
            <div class="rt-frame">
              @for (s of steps; track s.id; let i = $index) {
                <img
                  class="rt-img"
                  [class.is-active]="active() === i"
                  [src]="'img/' + s.img"
                  width="760"
                  height="724"
                  [alt]="active() === i ? s.alt : ''"
                  [attr.aria-hidden]="active() === i ? null : 'true'"
                  [attr.loading]="i === 0 ? 'eager' : 'lazy'"
                  decoding="async"
                  draggable="false"
                />
              }
            </div>
            <span class="orb orb--salmon rt-sorb" style="--s: 70px" dFloat [floatAmp]="10" aria-hidden="true"></span>
            <div class="rt-nav">
              <button type="button" (click)="go(active() - 1)" [disabled]="active() === 0" aria-label="Langkah sebelumnya"><app-icon name="arrow-left" [size]="20" /></button>
              <button type="button" (click)="go(active() + 1)" [disabled]="active() === steps.length - 1" aria-label="Langkah berikutnya"><app-icon name="arrow-right" [size]="20" /></button>
            </div>
          </div>

          <div class="rt-panels">
            @for (s of steps; track s.id; let i = $index) {
              <div class="rt-panel" role="tabpanel" [id]="'panel-' + s.id" [attr.aria-labelledby]="'tab-' + s.id" [hidden]="active() !== i" [attr.tabindex]="active() === i ? 0 : null">
                <span class="rt-big" aria-hidden="true">{{ s.n }}</span>
                <h3>{{ s.title }}</h3>
                <p class="rt-text">{{ s.text }}</p>
                <h4 class="rt-reco-h">Rekomendasi produk</h4>
                <ul class="rt-reco">
                  @for (p of recos(i); track p.id) {
                    <li class="reco">
                      <a class="reco-img" [routerLink]="['/produk', p.handle]" tabindex="-1" aria-hidden="true"><app-pimg [src]="p.images[0]" sizes="76px" /></a>
                      <div class="reco-txt">
                        <a [routerLink]="['/produk', p.handle]">{{ p.name }}</a>
                        <span>{{ p.variants[0].price | idr }}</span>
                      </div>
                      <button type="button" class="reco-add" [class.is-added]="cart.lastAdded() === p.variants[0].id" (click)="add(p)" [attr.aria-label]="'Tambah ' + p.name + ' ke keranjang'">
                        <app-icon [name]="cart.lastAdded() === p.variants[0].id ? 'check' : 'plus'" [size]="20" [stroke]="2.6" />
                      </button>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
        </div>
      </div>
    </section>
    <app-curve fill="#FDEDF1" [shape]="3" />
  `,
})
export class RoutineComponent {
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

