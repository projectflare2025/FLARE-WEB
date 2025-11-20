import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // If NOT logged in → redirect to login
  if (!auth.isLoggedIn()) {
    router.navigate(['/login'], { replaceUrl: true }); // Prevent back navigation
    return false;
  }

  return true;
};
