import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route, _state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const modulo = route.data?.['module'] as string | undefined;
  const accion = (route.data?.['action'] ?? 'ver') as string;

  if (!auth.currentUser()) {
    return router.createUrlTree(['/login']);
  }

  if (!modulo) {
    return true;
  }

  if (auth.hasPermission(modulo, accion)) {
    return true;
  }

  return router.createUrlTree(['/app/dashboard']);
};