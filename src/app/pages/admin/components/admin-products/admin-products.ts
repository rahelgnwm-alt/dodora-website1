import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../../components/icon/icon';
import { IdrPipe, ProductImage } from '../../../../components/product-image/product-image';
import { CatalogService } from '../../../../data/catalog.service';
import { compressImageFile } from '../../../../data/image-upload';
import { CATEGORY_LABEL, type Category, type Product, type RoutineStep, type Variant } from '../../../../data/product.model';
import { ToastService } from '../../../../data/toast.service';

@Component({
  selector: 'app-admin-products',
  imports: [FormsModule, RouterLink, Icon, IdrPipe, ProductImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.scss',
})
export class AdminProducts {
  protected readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);

  protected readonly categories: (Category | 'all')[] = ['all', 'bath', 'hair', 'skin', 'bundle'];
  protected readonly productCategories: Category[] = ['bath', 'hair', 'skin', 'bundle'];
  protected readonly steps: { key: RoutineStep; label: string }[] = [
    { key: 'mandi', label: '01 — Mandi' },
    { key: 'lembap', label: '02 — Melembapkan' },
    { key: 'rambut', label: '03 — Merawat Rambut' },
    { key: 'bundle', label: 'Paket Bundling' },
  ];

  protected readonly catLabel = (c: Category | 'all') => CATEGORY_LABEL[c];

  protected readonly filterCat = signal<Category | 'all'>('all');
  protected readonly searchQuery = signal('');
  protected readonly editorOpen = signal(false);
  protected readonly uploadingImg = signal(false);
  protected readonly confirmDeleteId = signal<string | null>(null);
  protected readonly confirmReset = signal(false);

  // Form state
  protected editingId: string | undefined = undefined;
  protected formName = '';
  protected formTagline = '';
  protected formCategory: Category = 'bath';
  protected formStep: RoutineStep = 'mandi';
  protected formNetto = '';
  protected formBpom = '';
  protected formDesc = '';
  protected formImageUrl = '';
  protected readonly formImages = signal<string[]>([]);
  protected readonly formVariants = signal<Variant[]>([]);

  protected readonly filteredProducts = computed(() => {
    const cat = this.filterCat();
    const q = this.searchQuery().trim().toLowerCase();
    return this.catalog.byCategory(cat).filter((p) => {
      if (!q) return true;
      return (p.name + ' ' + p.tagline + ' ' + p.handle).toLowerCase().includes(q);
    });
  });

  protected openCreate() {
    this.editingId = undefined;
    this.formName = '';
    this.formTagline = '';
    this.formCategory = 'bath';
    this.formStep = 'mandi';
    this.formNetto = '250 ml';
    this.formBpom = '';
    this.formDesc = '';
    this.formImageUrl = '';
    this.formImages.set([]);
    this.formVariants.set([
      {
        id: 'var-' + Date.now().toString(36),
        title: 'Satuan',
        price: 112000,
        compare: null,
        available: true,
      },
    ]);
    this.editorOpen.set(true);
  }

  protected openEdit(p: Product) {
    this.editingId = p.id;
    this.formName = p.name;
    this.formTagline = p.tagline;
    this.formCategory = p.category;
    this.formStep = p.step;
    this.formNetto = p.netto.join(', ');
    this.formBpom = p.bpom.join(', ');
    this.formDesc = p.description.join('\n\n');
    this.formImageUrl = '';
    this.formImages.set([...p.images]);
    this.formVariants.set(p.variants.map((v) => ({ ...v })));
    this.editorOpen.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected closeEditor() {
    this.editorOpen.set(false);
  }

  protected async onUploadFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) return;
    this.uploadingImg.set(true);
    try {
      const compressed: string[] = [];
      for (const file of files) {
        compressed.push(await compressImageFile(file, 1080, 0.84));
      }
      this.formImages.update((cur) => [...cur, ...compressed]);
      this.toast.success(`${compressed.length} foto produk berhasil diunggah.`);
    } catch (err) {
      this.toast.error(err instanceof Error ? err.message : 'Gagal mengunggah foto.');
    } finally {
      this.uploadingImg.set(false);
    }
  }

  protected addImageUrl() {
    const url = this.formImageUrl.trim();
    if (!url) return;
    this.formImages.update((cur) => [...cur, url]);
    this.formImageUrl = '';
  }

  protected setPrimaryImage(index: number) {
    this.formImages.update((cur) => {
      if (index <= 0 || index >= cur.length) return cur;
      const copy = [...cur];
      const [picked] = copy.splice(index, 1);
      return [picked, ...copy];
    });
  }

  protected removeImage(index: number) {
    this.formImages.update((cur) => cur.filter((_, i) => i !== index));
  }

  protected addVariant() {
    this.formVariants.update((cur) => [
      ...cur,
      {
        id: 'var-' + Date.now().toString(36) + '-' + cur.length,
        title: `Bundling ${cur.length + 1} PCS`,
        price: 199000,
        compare: 224000,
        available: true,
      },
    ]);
  }

  protected removeVariant(index: number) {
    if (this.formVariants().length <= 1) return;
    this.formVariants.update((cur) => cur.filter((_, i) => i !== index));
  }

  protected async saveProduct() {
    if (!this.formName.trim()) {
      this.toast.error('Nama produk wajib diisi.');
      return;
    }
    if (!this.formImages().length) {
      this.toast.error('Unggah minimal 1 foto produk atau tambahkan URL gambar.');
      return;
    }
    await this.catalog.saveProduct({
      id: this.editingId,
      name: this.formName,
      tagline: this.formTagline,
      category: this.formCategory,
      step: this.formStep,
      netto: this.formNetto.split(',').map((s) => s.trim()).filter(Boolean),
      bpom: this.formBpom.split(',').map((s) => s.trim()).filter(Boolean),
      description: this.formDesc.split(/\n+/).map((s) => s.trim()).filter(Boolean),
      variants: this.formVariants(),
      images: this.formImages(),
    });
    this.editorOpen.set(false);
  }

  protected async confirmDelete(id: string) {
    await this.catalog.deleteProduct(id);
    this.confirmDeleteId.set(null);
  }

  protected async resetCatalog() {
    await this.catalog.resetCatalog();
    this.confirmReset.set(false);
  }

  protected minPrice(p: Product): number {
    return Math.min(...p.variants.map((v) => v.price));
  }

  protected inStock(p: Product): boolean {
    return p.variants.some((v) => v.available);
  }
}
