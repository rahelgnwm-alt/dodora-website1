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
import { Icon } from '../../../../components/icon/icon';
import { FloatDirective, MagneticDirective, MaskDirective, RevealDirective, StaggerDirective, WordsDirective } from '../../../../motion/directives';
import { MotionService } from '../../../../motion/motion.service';

/** Brand story: oversized outlined type drifts horizontally with scroll; editorial image + copy. */
@Component({
  selector: 'app-home-about',
  imports: [RouterLink, Icon, MagneticDirective, MaskDirective, RevealDirective, StaggerDirective, WordsDirective, FloatDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-about.html',
  styleUrl: './home-about.scss',
})
export class HomeAbout {
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
