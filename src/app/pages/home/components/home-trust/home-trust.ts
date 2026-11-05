import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StaggerDirective } from '../../../../motion/directives';

@Component({
  selector: 'app-home-trust',
  imports: [StaggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-trust.html',
  styleUrl: './home-trust.scss',
})
export class HomeTrust {
  protected readonly items = [
    { icon: 'icon-i4.webp', label: 'Safe for Newborn', note: 'Cocok sejak hari pertama' },
    { icon: 'icon-i1.webp', label: 'Hypoallergenic', note: 'Lembut untuk kulit sensitif' },
    { icon: 'icon-i2.webp', label: 'Natural Active Ingredients', note: 'Dari bahan alami pilihan' },
    { icon: 'icon-i3.webp', label: 'pH Balance Formula', note: 'Menjaga kulit tetap seimbang' },
  ];
}
