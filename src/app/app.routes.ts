import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

// Pages
import { LoginComponent } from './pages/login/login.component';
import { LayoutComponent } from './pages/fire-station-admin/layout/layout.component';
import { DashboardComponent } from './pages/fire-station-admin/dashboard/dashboard.component';
import { IncidentReportsComponent } from './pages/fire-station-admin/incident-reports/incident-reports.component';
import { SettingsComponent } from './pages/fire-station-admin/settings/settings.component';
import { AdminLayoutComponent } from './pages/fire-station-root-admin/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './pages/fire-station-root-admin/admin-dashboard/admin-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

  {
    path: 'app',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'incident-reports', component: IncidentReportsComponent }, // 👈 ADDED
      { path: 'settings', component: SettingsComponent },                 // 👈 ADDED
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

    {
    path: 'admin-app',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'admin-dashboard', component: AdminDashboardComponent },
      { path: 'admin-settings', component: SettingsComponent },                 // 👈 ADDED
      { path: '', redirectTo: 'admin-dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
