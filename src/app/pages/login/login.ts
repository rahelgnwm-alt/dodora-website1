import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '../../components/icon/icon';
import { AuthService } from '../../data/auth.service';
import { FloatDirective, MagneticDirective } from '../../motion/directives';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, Icon, FloatDirective, MagneticDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly redirect = input<string>();

  protected readonly mode = signal<'login' | 'register'>('login');
  protected readonly error = signal('');

  // Login fields
  protected email = '';
  protected password = '';

  // Register fields
  protected regName = '';
  protected regEmail = '';
  protected regPhone = '';
  protected regAddress = '';
  protected regPassword = '';

  protected switchMode(m: 'login' | 'register') {
    this.mode.set(m);
    this.error.set('');
  }

  protected submitLogin() {
    this.error.set('');
    const res = this.auth.login(this.email, this.password);
    if (!res.ok) {
      this.error.set(res.message ?? 'Gagal masuk.');
      return;
    }
    const target = this.redirect();
    if (target && target.startsWith('/')) {
      this.router.navigateByUrl(target);
      return;
    }
    this.router.navigateByUrl(res.role === 'admin' ? '/admin' : '/akun');
  }

  protected quickLogin(role: 'admin' | 'customer') {
    if (role === 'admin') {
      this.email = 'admin@dodora.id';
      this.password = 'admin123';
    } else {
      this.email = 'bunda@dodora.id';
      this.password = 'bunda123';
    }
    this.submitLogin();
  }

  protected submitRegister() {
    this.error.set('');
    const res = this.auth.register({
      name: this.regName,
      email: this.regEmail,
      phone: this.regPhone,
      address: this.regAddress,
      password: this.regPassword,
    });
    if (!res.ok) {
      this.error.set(res.message ?? 'Pendaftaran belum berhasil.');
      return;
    }
    const target = this.redirect();
    this.router.navigateByUrl(target && target.startsWith('/') ? target : '/akun');
  }
}
