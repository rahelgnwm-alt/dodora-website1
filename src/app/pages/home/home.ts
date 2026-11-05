import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Curve } from '../../components/curve/curve';
import { MotionService } from '../../motion/motion.service';
import { backgroundMorph } from '../../motion/utilities';
import { HomeAbout } from './components/home-about/home-about';
import { HomeBundles } from './components/home-bundles/home-bundles';
import { HomeFeatured } from './components/home-featured/home-featured';
import { HomeHero } from './components/home-hero/home-hero';
import { HomeRoutine } from './components/home-routine/home-routine';
import { HomeStory } from './components/home-story/home-story';
import { HomeTrust } from './components/home-trust/home-trust';

/** Homepage: one continuous narrative — hero → trust → discovery → story → routine → brand → bundles. */
@Component({
  selector: 'app-home',
  imports: [HomeHero, HomeTrust, HomeFeatured, HomeStory, HomeRoutine, HomeAbout, HomeBundles, Curve],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
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
      // Re-align fragment scroll once ScrollTrigger pin spacers (e.g. HomeStory) are in place.
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
