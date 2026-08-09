import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();

  const authReq = token
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const code = error.error?.code;
        if (code === 'SESSION_REVOKED' || code === 'SESSION_INACTIVE') {
          // La alerta se muestra UNA sola vez por sesión de login (la bandera solo se
          // reinicia al volver a iniciar sesión), y solo si el usuario sigue autenticado.
          if (auth.isAuthenticated() && !auth.sessionAlertShown) {
            auth.markSessionAlertShown();
            Swal.fire({
              title: code === 'SESSION_INACTIVE' ? 'Sesión terminada' : 'Sesión cerrada',
              text: error.error?.message || 'Tu sesión fue cerrada porque iniciaste sesión en otro dispositivo.',
              icon: 'warning',
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#2563eb',
              allowOutsideClick: false,
              allowEscapeKey: false,
            }).then(() => {
              auth.logout();
              router.navigate(['/login']);
            });
          } else if (!auth.isAuthenticated()) {
            auth.logout();
            router.navigate(['/login']);
          }
          return throwError(() => error);
        }
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
