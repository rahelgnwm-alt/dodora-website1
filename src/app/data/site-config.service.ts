import { Injectable, computed, inject, signal } from '@angular/core';
import { idbGet, idbSet } from './image-upload';
import { ToastService } from './toast.service';

export interface LandingPhotos {
  heroMain: string;
  routineBath: string;
  routineLotion: string;
  routineHair: string;
  routineReady: string;
  aboutMain: string;
  storyIng0: string;
  storyIng1: string;
  storyIng2: string;
  storyIng3: string;
}

export type LandingPhotoKey = keyof LandingPhotos;

export interface LandingPhotoSlot {
  key: LandingPhotoKey;
  group: string;
  label: string;
  hint: string;
  aspect: string;
}

export const DEFAULT_LANDING_PHOTOS: LandingPhotos = {
  heroMain: 'img/hero-mother-toddler.webp',
  routineBath: 'img/scene-bath.webp',
  routineLotion: 'img/scene-lotion.webp',
  routineHair: 'img/scene-hair.webp',
  routineReady: 'img/toddler-joy.webp',
  aboutMain: 'img/toddler-joy.webp',
  storyIng0: 'img/ing-ginseng.webp',
  storyIng1: 'img/ing-aloe.webp',
  storyIng2: 'img/ing-centella.webp',
  storyIng3: 'img/ing-argan.webp',
};

export const LANDING_PHOTO_SLOTS: readonly LandingPhotoSlot[] = [
  {
    key: 'heroMain',
    group: 'Hero Utama',
    label: 'Foto Hero Bunda & Si Kecil',
    hint: 'Tampil di sisi kanan bagian pembuka beranda (rasio potret ~7:8).',
    aspect: '7 / 8',
  },
  {
    key: 'routineBath',
    group: 'Rutinitas Harian',
    label: 'Langkah 01 — Mandi',
    hint: 'Ilustrasi / foto suasana mandi lembut Si Kecil.',
    aspect: '19 / 18',
  },
  {
    key: 'routineLotion',
    group: 'Rutinitas Harian',
    label: 'Langkah 02 — Melembapkan',
    hint: 'Foto perawatan kelembapan kulit setelah mandi.',
    aspect: '19 / 18',
  },
  {
    key: 'routineHair',
    group: 'Rutinitas Harian',
    label: 'Langkah 03 — Merawat Rambut',
    hint: 'Foto perawatan rambut & kulit kepala Si Kecil.',
    aspect: '19 / 18',
  },
  {
    key: 'routineReady',
    group: 'Rutinitas Harian',
    label: 'Langkah 04 — Siap Beraktivitas',
    hint: 'Foto Si Kecil ceria siap bermain.',
    aspect: '19 / 18',
  },
  {
    key: 'aboutMain',
    group: 'Tentang DODORA',
    label: 'Foto Editorial Tentang DODORA',
    hint: 'Foto utama di bagian cerita brand "Perawatan lembut, sejak hari pertama".',
    aspect: '6 / 5',
  },
  {
    key: 'storyIng0',
    group: 'Storytelling Bahan Aktif',
    label: 'Bahan Aktif 1 — Ekstrak Ginseng',
    hint: 'Visual lingkaran bahan aktif kiri atas (1:1).',
    aspect: '1 / 1',
  },
  {
    key: 'storyIng1',
    group: 'Storytelling Bahan Aktif',
    label: 'Bahan Aktif 2 — Aloe Vera',
    hint: 'Visual lingkaran bahan aktif kanan atas (1:1).',
    aspect: '1 / 1',
  },
  {
    key: 'storyIng2',
    group: 'Storytelling Bahan Aktif',
    label: 'Bahan Aktif 3 — Centella Asiatica',
    hint: 'Visual lingkaran bahan aktif kiri bawah (1:1).',
    aspect: '1 / 1',
  },
  {
    key: 'storyIng3',
    group: 'Storytelling Bahan Aktif',
    label: 'Bahan Aktif 4 — Argan Oil',
    hint: 'Visual lingkaran bahan aktif kanan bawah (1:1).',
    aspect: '1 / 1',
  },
];

const LS_KEY = 'dodora:landing-photos:v1';
const IDB_KEY = 'landing-photos';

@Injectable({ providedIn: 'root' })
export class SiteConfigService {
  private readonly toast = inject(ToastService);

  readonly photos = signal<LandingPhotos>(this.loadSync());
  readonly slots = LANDING_PHOTO_SLOTS;

  readonly customizedCount = computed(() => {
    const cur = this.photos();
    return (Object.keys(DEFAULT_LANDING_PHOTOS) as LandingPhotoKey[]).filter((k) => cur[k] !== DEFAULT_LANDING_PHOTOS[k]).length;
  });

  constructor() {
    this.hydrateFromIdb();
  }

  isCustomized(key: LandingPhotoKey): boolean {
    return this.photos()[key] !== DEFAULT_LANDING_PHOTOS[key];
  }

  async updatePhoto(key: LandingPhotoKey, src: string) {
    const clean = src.trim();
    if (!clean) return;
    const next: LandingPhotos = { ...this.photos(), [key]: clean };
    this.photos.set(next);
    await this.persist(next);
    const slot = LANDING_PHOTO_SLOTS.find((s) => s.key === key);
    this.toast.success(`Foto "${slot?.label ?? key}" berhasil diperbarui.`);
  }

  async resetPhoto(key: LandingPhotoKey) {
    const next: LandingPhotos = { ...this.photos(), [key]: DEFAULT_LANDING_PHOTOS[key] };
    this.photos.set(next);
    await this.persist(next);
    this.toast.success('Foto dikembalikan ke bawaan DODORA.');
  }

  async resetAll() {
    const next = { ...DEFAULT_LANDING_PHOTOS };
    this.photos.set(next);
    await this.persist(next);
    this.toast.success('Seluruh foto beranda dikembalikan ke bawaan.');
  }

  private loadSync(): LandingPhotos {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_KEY) ?? 'null');
      if (raw && typeof raw === 'object') {
        return { ...DEFAULT_LANDING_PHOTOS, ...raw };
      }
    } catch {
      /* ignore */
    }
    return { ...DEFAULT_LANDING_PHOTOS };
  }

  private async hydrateFromIdb() {
    const saved = await idbGet<Partial<LandingPhotos>>(IDB_KEY);
    if (saved && typeof saved === 'object') {
      this.photos.set({ ...DEFAULT_LANDING_PHOTOS, ...saved });
    }
  }

  private async persist(next: LandingPhotos) {
    await idbSet(IDB_KEY, next);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {
      // IndexedDB holds the full payload if localStorage reaches quota
    }
  }
}
