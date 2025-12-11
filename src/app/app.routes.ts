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
import { AdminManageStationsComponent } from './pages/fire-station-root-admin/admin-manage-stations/admin-manage-stations.component';
import { AdminSettingsComponent } from './pages/fire-station-root-admin/admin-settings/admin-settings.component';
import { AdminManageUnitsComponent } from './pages/fire-station-root-admin/admin-manage-units/admin-manage-units.component';
import { AdminManageRespondersComponent } from './pages/fire-station-root-admin/admin-manage-responders/admin-manage-responders.component';
import { AdminManagePublicUsersComponent } from './pages/fire-station-root-admin/admin-manage-public-users/admin-manage-public-users.component';
import { AdminManageDeploymentComponent } from './pages/fire-station-root-admin/admin-manage-deployment/admin-manage-deployment.component';

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
      { path: 'admin-manage-stations', component: AdminManageStationsComponent },
      { path: 'admin-manage-units', component: AdminManageUnitsComponent },
      { path: 'admin-manage-responders', component: AdminManageRespondersComponent },
      { path: 'admin-manage-public-users', component: AdminManagePublicUsersComponent },
      { path: 'admin-manage-deployment', component: AdminManageDeploymentComponent},
      { path: 'admin-settings', component: AdminSettingsComponent },                 // 👈 ADDED
      { path: '', redirectTo: 'admin-dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
