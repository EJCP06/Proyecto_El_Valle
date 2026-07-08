import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  template: `
    <div class="flex min-h-screen w-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <!-- Sidebar -->
      <app-sidebar />

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Top Navbar -->
        <app-navbar />

        <!-- Router Outlet Container -->
        <main class="flex-1 p-6 overflow-y-auto bg-slate-100 dark:bg-slate-900/40 transition-colors duration-300">
          <div class="max-w-7xl mx-auto space-y-6">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardLayoutComponent {}
