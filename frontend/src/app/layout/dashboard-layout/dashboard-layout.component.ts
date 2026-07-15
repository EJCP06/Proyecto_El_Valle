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
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Top Navbar -->
        <app-navbar />

        <!-- Router Outlet Container -->
        <main class="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto bg-slate-100 dark:bg-slate-900/40 transition-colors duration-300 min-h-[calc(100vh-4rem)]">
          <div class="flex-1 flex flex-col min-h-0">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardLayoutComponent {}
