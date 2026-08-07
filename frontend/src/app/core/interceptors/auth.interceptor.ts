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
        if (code === 'SESSION_REVOKED') {
          Swal.fire({
            title: 'Sesión cerrada',
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
          return throwError(() => error);
        }
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
