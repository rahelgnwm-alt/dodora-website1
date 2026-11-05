import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../data/toast.service';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-toasts',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toasts.html',
  styleUrl: './toasts.scss',
})
export class Toasts {
  protected readonly toasts = inject(ToastService);
}
