import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {
  stationName: string = '';
  showLogoutConfirm = false;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.stationName = sessionStorage.getItem('stationName') ?? '';
  }

  logout() {
    this.showLogoutConfirm = true;
  }

  cancelLogout() {
    this.showLogoutConfirm = false;
  }

  async confirmLogout() {
    await this.auth.logout();
    this.showLogoutConfirm = false;
    this.router.navigate(['/login']);
  }
}
