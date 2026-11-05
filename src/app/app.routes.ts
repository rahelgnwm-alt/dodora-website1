import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'DODORA — Sentuhan Lembut untuk Setiap Momen Si Kecil', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
  { path: 'belanja', title: 'Belanja — DODORA', loadComponent: () => import('./pages/shop/shop').then((m) => m.Shop) },
  { path: 'produk/:handle', loadComponent: () => import('./pages/product/product').then((m) => m.Product) },
  { path: '**', title: 'Halaman tidak ditemukan — DODORA', loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound) },
];
