import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  kind: 'success' | 'error';
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private seq = 0;

  show(kind: Toast['kind'], text: string, ms = 3200) {
    const id = ++this.seq;
    // Keep at most two on screen
    this.toasts.update((t) => [...t.slice(-1), { id, kind, text }]);
    setTimeout(() => this.dismiss(id), kind === 'error' ? ms + 1800 : ms);
  }
  success(text: string) {
    this.show('success', text);
  }
  error(text: string) {
    this.show('error', text);
  }
  dismiss(id: number) {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }
}

