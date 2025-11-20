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

  // Password toggle
  showPassword = false;

  // Forgot password modal
  forgotOpen = false;
  forgotEmail = '';
  resetLoading = false;
  resetMsg = '';
  resetColor = 'red';

  constructor(private auth: AuthService, private router: Router) {

    // 🚀 Prevent back button going to login page
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/app/dashboard'], { replaceUrl: true });
    }
  }

  // LOGIN
  async login() {
    const res = await this.auth.login(this.email, this.password);

    if (!res.success) {
      this.errorMessage = res.message;
      return;
    }

    this.router.navigate(['/app /dashboard'], { replaceUrl: true });
  }

  // Show/Hide password
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // Forgot modal open
  openForgot() {
    this.forgotOpen = true;
  }

  // Forgot modal close
  closeForgot() {
    this.forgotOpen = false;
    this.resetMsg = '';
  }

  // SEND RESET LINK
  async sendResetLink() {
    this.resetLoading = true;

    const result = await this.auth.sendResetLink(this.forgotEmail);

    this.resetMsg = result.message;
    this.resetColor = result.success ? 'green' : 'red';
    this.resetLoading = false;
  }
}
