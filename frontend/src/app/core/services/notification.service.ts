import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  success(title: string, message?: string) {
    Swal.fire({ icon: 'success', title, text: message, timer: 2500, showConfirmButton: false, toast: true, position: 'top-end' });
  }

  error(title: string, message?: string) {
    Swal.fire({ icon: 'error', title, text: message, confirmButtonColor: '#dc2626' });
  }

  confirm(title: string, text: string): Promise<boolean> {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then((r) => r.isConfirmed);
  }

  loading() {
    return Swal.fire({ title: 'Guardando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  }

  close() {
    Swal.close();
  }
}
