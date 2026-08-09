import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class SessionTimerService {
  private auth = inject(AuthService);
  private router = inject(Router);

  private readonly INACTIVITY_MS = 5 * 60 * 1000;
  private readonly WARNING_MS = 60 * 1000;
  private readonly SESSION_CHECK_MS = 20 * 1000;

  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private warningTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private sessionCheckId: ReturnType<typeof setInterval> | null = null;
  private lastActivity = 0;
  private isRunning = false;
  private swalVisible = false;

  private activityEvents = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastActivity = Date.now();

    this.activityEvents.forEach(event => {
      document.addEventListener(event, this.onActivity, { passive: true });
    });

    this.scheduleCheck();
    this.startSessionWatch();
  }

  stop(): void {
    this.isRunning = false;
    this.activityEvents.forEach(event => {
      document.removeEventListener(event, this.onActivity);
    });
    this.clearTimers();
    this.stopSessionWatch();
    this.closeSwal();
  }

  /**
   * Vigila la sesión en el servidor: consulta periódicamente si el token sigue válido.
   * Si fue revocada (login en otro dispositivo), el backend responde 401 SESSION_REVOKED
   * y el interceptor de auth muestra la alerta y cierra la sesión de inmediato.
   */
  private startSessionWatch(): void {
    this.stopSessionWatch();
    this.checkSessionNow();
    this.sessionCheckId = setInterval(() => this.checkSessionNow(), this.SESSION_CHECK_MS);
    // Al volver a la pestaña (focus/visibilidad), verificar de inmediato.
    window.addEventListener('focus', this.onWindowFocus);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private stopSessionWatch(): void {
    if (this.sessionCheckId) {
      clearInterval(this.sessionCheckId);
      this.sessionCheckId = null;
    }
    window.removeEventListener('focus', this.onWindowFocus);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private onWindowFocus = (): void => {
    this.checkSessionNow();
  };

  private onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.checkSessionNow();
    }
  };

  private checkSessionNow(): void {
    this.auth.checkSession().subscribe({ error: () => {} });
  }

  private onActivity = (): void => {
    this.lastActivity = Date.now();
    this.resetTimers();
  };

  private scheduleCheck(): void {
    this.clearTimers();
    const timeSinceActivity = Date.now() - this.lastActivity;
    const remaining = this.INACTIVITY_MS - timeSinceActivity;

    if (remaining <= 0) {
      this.showWarning();
      return;
    }

    if (remaining <= this.WARNING_MS) {
      this.warningTimeoutId = setTimeout(() => this.showWarning(), remaining);
    } else {
      this.warningTimeoutId = setTimeout(() => this.scheduleCheck(), remaining - this.WARNING_MS);
      this.timeoutId = setTimeout(() => this.showWarning(), remaining);
    }
  }

  private resetTimers(): void {
    this.clearTimers();
    this.scheduleCheck();
    this.closeSwal();
  }

  private clearTimers(): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningTimeoutId) clearTimeout(this.warningTimeoutId);
    this.timeoutId = this.warningTimeoutId = null;
  }

  private showWarning(): void {
    this.closeSwal();

    let countdown = Math.ceil(this.WARNING_MS / 1000);
    this.swalVisible = true;

    Swal.fire({
      title: '¿Seguir en la sesión?',
      html: `Tu sesión expirará en <b>${countdown}</b> segundos por inactividad.`,
      icon: 'warning',
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Continuar',
      allowOutsideClick: false,
      allowEscapeKey: false,
      timer: this.WARNING_MS,
      timerProgressBar: true,
      didOpen: () => {
        const timerInterval = setInterval(() => {
          countdown--;
          const htmlEl = Swal.getHtmlContainer();
          if (htmlEl) {
            const b = htmlEl.querySelector('b');
            if (b) b.textContent = countdown.toString();
          }
          if (countdown <= 0) clearInterval(timerInterval);
        }, 1000);
        (window as any).__sessionSwalInterval = timerInterval;
      },
      willClose: () => {
        const interval = (window as any).__sessionSwalInterval;
        if (interval) clearInterval(interval);
      },
    }).then((result) => {
      this.swalVisible = false;
      if (result.isConfirmed) {
        this.lastActivity = Date.now();
        this.scheduleCheck();
      } else {
        this.logout();
      }
    });
  }

  private closeSwal(): void {
    if (this.swalVisible) {
      Swal.close();
      this.swalVisible = false;
    }
  }

  private logout(): void {
    this.stop();
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}