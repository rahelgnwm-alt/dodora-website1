import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MotionService } from '../../motion/motion.service';
import { backgroundMorph } from '../../motion/utilities';
import { CurveComponent } from '../../ui/curve';
import { AboutComponent } from './about';
import { BundlesComponent } from './bundles';
import { FeaturedComponent } from './featured';
import { HeroComponent } from './hero';
import { RoutineComponent } from './routine';
import { StoryComponent } from './story';
import { TrustComponent } from './trust';

/** Homepage: one continuous narrative — hero → trust → discovery → story → routine → brand → bundles. */
@Component({
  selector: 'app-home',
  imports: [HeroComponent, TrustComponent, FeaturedComponent, StoryComponent, RoutineComponent, AboutComponent, BundlesComponent, CurveComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home" #home>
      <app-hero />
      <app-trust />
      <app-featured />
      <app-curve fill="#FBD9D8" [shape]="1" />
      <app-story />
      <app-routine />
      <app-about />
      <app-curve fill="#EEF4FB" [shape]="3" />
      <app-bundles />
    </div>
  `,
  styles: `
    .home {
      display: block;
    }
  `,
})
export class HomePage {
  private readonly motion = inject(MotionService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly home = viewChild.required<ElementRef<HTMLElement>>('home');

  constructor() {
    this.route.fragment.pipe(takeUntilDestroyed()).subscribe((frag) => {
      if (!frag) return;
      requestAnimationFrame(() => this.motion.scrollToId(frag));
    });

    afterNextRender(async () => {
      const kit = await this.motion.whenKit();
      if (!kit || this.motion.env.reduced) return;

      // Ensure ScrollTrigger positions are calculated accurately after layout stabilizes
      setTimeout(() => kit.ScrollTrigger.refresh(), 120);

      // Gentle page-colour morph across the top group of sections (hero → trust → featured).
      const sections = Array.from(this.home().nativeElement.querySelectorAll<HTMLElement>('[data-bg]'));
      const dispose = backgroundMorph(kit, sections);
      // Re-align fragment scroll once ScrollTrigger pin spacers (e.g. StoryComponent) are in place.
      const frag = this.route.snapshot.fragment;
      if (frag) {
        requestAnimationFrame(() => this.motion.scrollToId(frag));
      }
      this.destroyRef.onDestroy(() => {
        dispose();
        document.body.style.removeProperty('--page-bg');
      });
    });
  }
}

