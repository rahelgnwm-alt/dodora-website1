import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './data/auth.service';

export const routes: Routes = [
  { path: '', title: 'DODORA — Sentuhan Lembut untuk Setiap Momen Si Kecil', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
  { path: 'belanja', title: 'Belanja — DODORA', loadComponent: () => import('./pages/shop/shop').then((m) => m.Shop) },
  { path: 'produk/:handle', loadComponent: () => import('./pages/product/product').then((m) => m.Product) },
  { path: 'masuk', title: 'Masuk atau Daftar — DODORA', loadComponent: () => import('./pages/login/login').then((m) => m.Login) },
  { path: 'login', redirectTo: 'masuk', pathMatch: 'full' },
  { path: 'checkout', title: 'Checkout Pesanan — DODORA', loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout) },
  { path: 'akun', title: 'Akun & Lacak Pesanan — DODORA', canActivate: [authGuard], loadComponent: () => import('./pages/customer/customer').then((m) => m.Customer) },
  { path: 'customer', redirectTo: 'akun', pathMatch: 'full' },
  { path: 'admin', title: 'Admin Panel — DODORA', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/admin').then((m) => m.Admin) },
  { path: '**', title: 'Halaman tidak ditemukan — DODORA', loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound) },
];
