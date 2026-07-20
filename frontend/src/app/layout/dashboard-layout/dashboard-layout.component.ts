import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarService } from '../../core/services/sidebar.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  template: `
    <div class="flex min-h-screen w-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <!-- Backdrop Overlay for Mobile Drawer -->
      <div
        (click)="sidebarService.close()"
        class="mobile-backdrop fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        [style.opacity]="sidebarService.isOpen() ? '1' : '0'"
        [style.pointer-events]="sidebarService.isOpen() ? 'auto' : 'none'"
      ></div>

      <!-- Sidebar -->
      <app-sidebar class="contents" />

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Top Navbar -->
        <app-navbar />

        <!-- Router Outlet Container -->
        <main class="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto bg-slate-100 dark:bg-slate-900/40 transition-colors duration-300">
          <div class="flex-1 flex flex-col min-h-0">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .mobile-backdrop {
      display: block;
    }
    @media (min-width: 1024px) {
      .mobile-backdrop {
        display: none !important;
      }
    }
  `]
})
export class DashboardLayoutComponent {
  sidebarService = inject(SidebarService);
}
