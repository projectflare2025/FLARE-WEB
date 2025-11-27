import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule]
})
export class LoginComponent {

  email = '';
  password = '';
  errorMessage = '';
  showPassword = false;

  // Forgot password modal
  forgotOpen = false;
  forgotEmail = '';
  resetLoading = false;
  resetMsg = '';
  resetColor = 'red';

  // Email verification
  showVerifyModal = false;
  verifyMsg = '';
  verifyColor = 'red';
  resendDisabled = false;
  countdown = 0;
  countdownInterval: any;

  constructor(private auth: AuthService, private router: Router) {
   if (this.auth.isLoggedIn()) {
  const role = sessionStorage.getItem('accountType');

  if (role === 'admin') {
    this.router.navigate(['/admin-app/admin-dashboard'], { replaceUrl: true });
  } else if (role === 'firestation') {
    this.router.navigate(['/app/dashboard'], { replaceUrl: true });
  }
}

  }

  /** LOGIN BUTTON */
  async login() {
    const res = await this.auth.login(this.email, this.password);

    if (!res.success) {
      if (res.message.includes('not verified')) {
        this.showVerifyModal = true;
      }
      this.errorMessage = res.message;
      return;
    }

    const accountType = res.accountType;

    if (accountType === 'admin') {
      this.router.navigate(['/admin-app/admin-dashboard'], { replaceUrl: true });
      return;
    }

    if (accountType === 'firestation') {
      this.router.navigate(['/app/dashboard'], { replaceUrl: true });
      return;
    }

    this.errorMessage = 'Unknown account type.';
  }

  /** RESEND EMAIL VERIFICATION */
  async resendVerify() {
    const result = await this.auth.sendVerificationEmail();
    this.verifyMsg = result.message;
    this.verifyColor = result.success ? 'green' : 'red';

    if (result.success) {
      this.startCountdown(100);
    }
  }

  startCountdown(seconds: number) {
    this.resendDisabled = true;
    this.countdown = seconds;

    this.countdownInterval = setInterval(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.resendDisabled = false;
      }
    }, 1000);
  }

  /** FORGOT PASSWORD MODAL */
  openForgot() {
    this.forgotOpen = true;
  }

  closeForgot() {
    this.forgotOpen = false;
    this.resetMsg = '';
  }

  async sendResetLink() {
    this.resetLoading = true;
    const result = await this.auth.sendResetLink(this.forgotEmail);
    this.resetMsg = result.message;
    this.resetColor = result.success ? 'green' : 'red';
    this.resetLoading = false;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
