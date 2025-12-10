import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';

import { AuthService } from '../../../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, NgClass, RouterOutlet, RouterLink],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
})
export class AdminLayoutComponent {
  stationName: string = '';
  showLogoutConfirm = false;
  showAppUsersSubmenu = false;

  activeParent: string = 'dashboard';  // default active
  activeChild: string = '';            // no child active initially

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.stationName = sessionStorage.getItem('stationName') ?? '';

    // Track current route and auto-activate parent/child
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects;

        // List of children under Application Users
        const appUsersChildren = [
          '/admin-app/admin-manage-units',
          '/admin-app/admin-manage-responders',
          '/admin-app/admin-manage-public-users'
        ];

        if (appUsersChildren.some(r => url.startsWith(r))) {
          this.activeParent = 'appUsers';
          this.activeChild = url; // store the child route as active
          this.showAppUsersSubmenu = true;
        } else if (url.startsWith('/admin-app/admin-dashboard')) {
          this.activeParent = 'dashboard';
          this.activeChild = '';
          this.showAppUsersSubmenu = false;
        } else if (url.startsWith('/admin-app/admin-manage-stations')) {
          this.activeParent = 'stations';
          this.activeChild = '';
          this.showAppUsersSubmenu = false;
        } else if (url.startsWith('/admin-app/admin-settings')) {
          this.activeParent = 'settings';
          this.activeChild = '';
          this.showAppUsersSubmenu = false;
        } else {
          // fallback: keep Dashboard active by default
          this.activeParent = 'dashboard';
          this.activeChild = '';
          this.showAppUsersSubmenu = false;
        }
      });
  }

  toggleParent(parentName: string) {
    this.showAppUsersSubmenu = !this.showAppUsersSubmenu;
    this.activeParent = parentName; // mark parent active
    this.activeChild = '';          // no child active yet
  }

  setActiveChild(childRoute: string) {
    this.activeChild = childRoute;
    this.activeParent = 'appUsers'; // keep parent active
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
