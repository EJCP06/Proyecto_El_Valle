import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.verifySession();
  }

  verifySession() {
    if (!this.auth.isAuthenticated()) {
      this.auth.logout();
      if (window.location.pathname.startsWith('/app')) {
        this.router.navigate(['/login']);
      }
    }
  }
}
