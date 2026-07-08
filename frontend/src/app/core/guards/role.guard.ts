import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, _state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const requiredRoles: string[] = route.data?.['roles'] ?? [];
  const user = auth.currentUser();

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  if (requiredRoles.length === 0 || requiredRoles.includes(user.rol)) {
    return true;
  }

  return router.createUrlTree(['/app/dashboard']);
};
