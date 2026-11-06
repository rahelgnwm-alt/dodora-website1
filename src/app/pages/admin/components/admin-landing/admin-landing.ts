import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../../components/icon/icon';
import { compressImageFile } from '../../../../data/image-upload';
import { type LandingPhotoKey, SiteConfigService } from '../../../../data/site-config.service';
import { ToastService } from '../../../../data/toast.service';

@Component({
  selector: 'app-admin-landing',
  imports: [FormsModule, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-landing.html',
  styleUrl: './admin-landing.scss',
})
export class AdminLanding {
  protected readonly siteConfig = inject(SiteConfigService);
  private readonly toast = inject(ToastService);

  protected readonly busyKey = signal<LandingPhotoKey | null>(null);
  protected readonly urlInputs = signal<Partial<Record<LandingPhotoKey, string>>>({});
  protected readonly confirmResetAll = signal(false);

  protected readonly groups = computed(() => {
    const map = new Map<string, typeof this.siteConfig.slots[number][]>();
    for (const slot of this.siteConfig.slots) {
      const list = map.get(slot.group) ?? [];
      list.push(slot);
      map.set(slot.group, list);
    }
    return Array.from(map.entries()).map(([name, slots]) => ({ name, slots }));
  });

  protected setUrlInput(key: LandingPhotoKey, value: string) {
    this.urlInputs.update((cur) => ({ ...cur, [key]: value }));
  }

  protected async onFileChange(event: Event, key: LandingPhotoKey) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.busyKey.set(key);
    try {
      const dataUrl = await compressImageFile(file, 1280, 0.85);
      await this.siteConfig.updatePhoto(key, dataUrl);
    } catch (err) {
      this.toast.error(err instanceof Error ? err.message : 'Gagal memproses foto.');
    } finally {
      this.busyKey.set(null);
    }
  }

  protected async applyUrl(key: LandingPhotoKey) {
    const url = (this.urlInputs()[key] ?? '').trim();
    if (!url) {
      this.toast.error('Masukkan URL gambar terlebih dahulu.');
      return;
    }
    await this.siteConfig.updatePhoto(key, url);
    this.setUrlInput(key, '');
  }

  protected async resetAll() {
    await this.siteConfig.resetAll();
    this.confirmResetAll.set(false);
  }
}
