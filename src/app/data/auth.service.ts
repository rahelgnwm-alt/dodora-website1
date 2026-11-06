import { Injectable, computed, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastService } from './toast.service';

export type UserRole = 'admin' | 'customer';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  address: string;
}

export type SessionUser = Omit<UserAccount, 'password'>;

const USERS_KEY = 'dodora:users:v1';
const SESSION_KEY = 'dodora:session:v1';

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr-admin-1',
    name: 'Admin DODORA',
    email: 'admin@dodora.id',
    password: 'admin123',
    role: 'admin',
    phone: '0811-9000-2026',
    address: 'DODORA Official HQ, Jakarta, Indonesia',
  },
  {
    id: 'usr-cust-1',
    name: 'Bunda Nadira',
    email: 'bunda@dodora.id',
    password: 'bunda123',
    role: 'customer',
    phone: '0812-8899-1020',
    address: 'Jl. Kemang Timur No. 24, Bangka, Mampang Prapatan, Jakarta Selatan 12730',
  },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  private readonly accounts = signal<UserAccount[]>(this.loadUsers());
  readonly user = signal<SessionUser | null>(this.loadSession());

  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'admin');
  readonly isCustomer = computed(() => this.user()?.role === 'customer');

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === USERS_KEY) this.accounts.set(this.loadUsers());
        if (e.key === SESSION_KEY) this.user.set(this.loadSession());
      });
    }
  }

  login(email: string, password: string): { ok: boolean; role?: UserRole; message?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const found = this.accounts().find((u) => u.email.toLowerCase() === cleanEmail && u.password === password);
    if (!found) {
      return { ok: false, message: 'Email atau kata sandi belum sesuai.' };
    }
    const session = this.stripPassword(found);
    this.user.set(session);
    this.saveSession(session);
    this.toast.success(`Selamat datang kembali, ${session.name}!`);
    return { ok: true, role: session.role };
  }

  register(input: { name: string; email: string; password: string; phone: string; address: string }): { ok: boolean; message?: string } {
    const cleanEmail = input.email.trim().toLowerCase();
    if (!input.name.trim() || !cleanEmail || input.password.length < 6) {
      return { ok: false, message: 'Lengkapi nama, email, dan kata sandi (minimal 6 karakter).' };
    }
    if (this.accounts().some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { ok: false, message: 'Email ini sudah terdaftar. Silakan masuk.' };
    }
    const nextUser: UserAccount = {
      id: 'usr-' + Date.now().toString(36),
      name: input.name.trim(),
      email: cleanEmail,
      password: input.password,
      role: 'customer',
      phone: input.phone.trim(),
      address: input.address.trim(),
    };
    const nextList = [...this.accounts(), nextUser];
    this.accounts.set(nextList);
    this.saveUsers(nextList);
    const session = this.stripPassword(nextUser);
    this.user.set(session);
    this.saveSession(session);
    this.toast.success(`Akun berhasil dibuat. Halo, ${session.name}!`);
    return { ok: true };
  }

  updateProfile(patch: { name: string; phone: string; address: string }) {
    const cur = this.user();
    if (!cur) return;
    const updatedList = this.accounts().map((u) =>
      u.id === cur.id ? { ...u, name: patch.name.trim() || u.name, phone: patch.phone.trim(), address: patch.address.trim() } : u,
    );
    this.accounts.set(updatedList);
    this.saveUsers(updatedList);
    const nextSession: SessionUser = {
      ...cur,
      name: patch.name.trim() || cur.name,
      phone: patch.phone.trim(),
      address: patch.address.trim(),
    };
    this.user.set(nextSession);
    this.saveSession(nextSession);
    this.toast.success('Profil berhasil diperbarui.');
  }

  logout(redirect = '/masuk') {
    this.user.set(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    this.toast.success('Kamu telah keluar dari akun.');
    this.router.navigateByUrl(redirect);
  }

  private stripPassword(u: UserAccount): SessionUser {
    const { password: _pw, ...rest } = u;
    return rest;
  }

  private loadUsers(): UserAccount[] {
    try {
      const raw = JSON.parse(localStorage.getItem(USERS_KEY) ?? 'null');
      if (Array.isArray(raw) && raw.length > 0) {
        // Ensure seeded demo accounts remain available alongside any newly registered accounts
        const byEmail = new Map<string, UserAccount>();
        for (const d of DEFAULT_USERS) byEmail.set(d.email.toLowerCase(), d);
        for (const r of raw) {
          if (r?.email && r?.password) byEmail.set(String(r.email).toLowerCase(), r);
        }
        return Array.from(byEmail.values());
      }
    } catch {
      /* fallback */
    }
    return [...DEFAULT_USERS];
  }

  private saveUsers(list: UserAccount[]) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }

  private loadSession(): SessionUser | null {
    try {
      const raw = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
      return raw?.id && raw?.email && raw?.role ? (raw as SessionUser) : null;
    } catch {
      return null;
    }
  }

  private saveSession(session: SessionUser) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      /* ignore */
    }
  }
}

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  return router.createUrlTree(['/masuk'], { queryParams: { redirect: state.url } });
};

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAdmin()) return true;
  if (auth.isLoggedIn()) return router.createUrlTree(['/akun']);
  return router.createUrlTree(['/masuk'], { queryParams: { redirect: state.url } });
};
