import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login'], { replaceUrl: true });
    return false;
  }

  const role = sessionStorage.getItem('accountType');

  // Route protection based on role
  if (router.url.startsWith('/admin-app') && role !== 'admin') {
    router.navigate(['/login'], { replaceUrl: true });
    return false;
  }

  if (router.url.startsWith('/app') && role !== 'firestation') {
    router.navigate(['/login'], { replaceUrl: true });
    return false;
  }

  return true;
};


