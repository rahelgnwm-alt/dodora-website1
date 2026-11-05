import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Curve } from '../curve/curve';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, Curve, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  protected readonly year = new Date().getFullYear();
}
