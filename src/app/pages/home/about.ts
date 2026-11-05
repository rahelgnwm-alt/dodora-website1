import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FloatDirective, MagneticDirective, MaskDirective, RevealDirective, StaggerDirective, WordsDirective } from '../../motion/directives';
import { MotionService } from '../../motion/motion.service';
import { IconComponent } from '../../ui/icon';

/** Brand story: oversized outlined type drifts horizontally with scroll; editorial image + copy. */
@Component({
  selector: 'app-about',
  imports: [RouterLink, IconComponent, MagneticDirective, MaskDirective, RevealDirective, StaggerDirective, WordsDirective, FloatDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './about.scss',
  template: `
    <section id="tentang" class="ab" #root aria-labelledby="ab-title">
      <div class="ab-big" aria-hidden="true">
        <span class="ab-row" #row1>Little skin · Little skin · Little skin ·</span>
        <span class="ab-row ab-row--fill" #row2>Big care · Big care · Big care · Big care ·</span>
      </div>

      <div class="container ab-grid">
        <div class="ab-media" dReveal [revealY]="40">
          <span class="blob ab-blob"></span>
          <div class="ab-frame">
            <img src="img/toddler-joy.webp" width="960" height="800" loading="lazy" decoding="async" alt="Balita tersenyum riang dengan kedua tangan terangkat" />
          </div>
          <span class="orb orb--blue ab-orb" style="--s: 74px" dFloat [floatAmp]="12" aria-hidden="true"></span>
          <span class="orb orb--salmon orb--drop ab-drop" style="--s: 40px" dFloat [floatAmp]="9" aria-hidden="true"></span>
        </div>

        <div class="ab-copy">
          <p class="eyebrow" dReveal>Tentang DODORA</p>
          <h2 id="ab-title" dMask>
            <span class="ml"><span class="ml-i">Perawatan lembut,</span></span>
            <span class="ml"><span class="ml-i">sejak hari pertama</span></span>
          </h2>
          <p class="ab-text" dWords>
            Rangkaian gentle care product yang mengandung natural active ingredients, formula lembut, tanpa bahan berbahaya, dengan kemasan yang cantik — cocok untuk Bunda dan Si Kecil sejak hari pertama.
          </p>
          <ul class="ab-pills" dStagger [staggerStep]="0.07" [staggerY]="14">
            <li><app-icon name="sparkles" [size]="18" /> Natural active ingredients</li>
            <li><app-icon name="heart" [size]="18" /> Formula lembut</li>
            <li><app-icon name="shield" [size]="18" /> No harmful ingredients</li>
            <li><app-icon name="droplet" [size]="18" /> pH balanced</li>
          </ul>
          <a routerLink="/belanja" class="btn" dMagnetic><span class="btn-label">Temukan produknya <app-icon name="arrow-right" /></span></a>
        </div>
      </div>
    </section>
  `,
})
export class AboutComponent {
  private readonly motion = inject(MotionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  private readonly row1 = viewChild.required<ElementRef<HTMLElement>>('row1');
  private readonly row2 = viewChild.required<ElementRef<HTMLElement>>('row2');

  constructor() {
    afterNextRender(() => this.setup());
  }

  private async setup() {
    if (this.motion.env.reduced || this.motion.env.lite) return;
    const kit = await this.motion.whenKit();
    if (!kit) return;
    const { gsap } = kit;
    const root = this.root().nativeElement;
    const k = this.motion.env.mobile ? 0.5 : 1;
    const ctx = gsap.context(() => {
      const st = { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true };
      gsap.fromTo(this.row1().nativeElement, { xPercent: 4 * k }, { xPercent: -22 * k, ease: 'none', scrollTrigger: st });
      gsap.fromTo(this.row2().nativeElement, { xPercent: -26 * k }, { xPercent: 2 * k, ease: 'none', scrollTrigger: st });
    }, root);
    this.destroyRef.onDestroy(() => ctx.revert());
  }
}

