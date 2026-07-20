import { Component, HostListener, inject, signal, OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../core/services/auth.service";
import { SidebarService } from "../../core/services/sidebar.service";
import { NAV_ITEMS, NavItem } from "../../core/constants/navigation";
import {
  LucideAngularModule,
  Building2,
  LogOut,
  X,
} from "lucide-angular";

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <aside
      class="sidebar-responsive relative h-[100dvh] w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none z-50 top-0 bottom-0 left-0"
      [ngClass]="{'mobile-open': sidebarService.isOpen()}"
    >
      <!-- Close button - top right -->
      <button
        (click)="sidebarService.close()"
        class="mobile-close-btn absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer z-10"
        title="Cerrar menú"
      >
        <lucide-icon [name]="X" class="w-4 h-4"></lucide-icon>
      </button>

      <!-- Logo Header -->
      <div
        class="relative pb-4 overflow-hidden shrink-0 logo-header"
      >
        <div class="flex items-center gap-3 pl-3 pr-3">
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0"
            >
              <lucide-icon
                [name]="Building2"
                class="w-5 h-5 text-white"
              ></lucide-icon>
            </div>
            <div class="min-w-0">
              <div
                class="flex flex-col leading-none animate-in fade-in duration-200 text-center mt-2 whitespace-nowrap"
              >
                <span
                  class="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider"
                  >Sistema Comunal</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav
        class="flex-1 overflow-y-auto pt-6 sm:pt-16 pb-4 px-4 space-y-1.5 sm:space-y-3 touch-scroll hide-scrollbar"
      >
        @for (item of visibleItems(); track item.route) {
          <a
            [routerLink]="item.route"
            (click)="onLinkClick()"
            class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white active:bg-slate-100 dark:active:bg-slate-800/80 transition-all duration-200 group text-sm font-semibold cursor-pointer"
            [title]="item.label"
          >
            <lucide-icon
              [name]="item.icon"
              class="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform text-slate-500 dark:text-slate-400"
            ></lucide-icon>
            <span
              class="truncate animate-in fade-in duration-200 uppercase text-[11px] tracking-wider font-bold"
              >{{ item.label }}</span
            >
          </a>
        }
      </nav>

      <!-- Footer: Logout Button Only -->
      <div class="p-4 shrink-0">
        <button
          (click)="logout()"
          [disabled]="logoutLoading()"
          class="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Cerrar sesión"
        >
          @if (!logoutLoading()) {
            <lucide-icon
              [name]="LogOut"
              class="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform"
            ></lucide-icon>
            <span
              class="truncate font-bold uppercase text-[11px] tracking-wider"
              >Cerrar Sesión</span
            >
          } @else {
            <div
              class="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-[800ms] w-full"
            >
              <div
                class="w-5 h-5 border-2 border-rose-600/30 dark:border-rose-400/30 border-t-rose-600 dark:border-t-rose-400 rounded-full animate-spin"
              ></div>
              <span
                class="animate-pulse font-bold uppercase text-[11px] tracking-wider text-rose-600 dark:text-rose-400"
                >Cerrando...</span
              >
            </div>
          }
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .logo-header {
      padding-top: 2.5rem;
    }
    .sidebar-responsive {
      position: fixed;
      transform: translateX(-100%);
      transition: transform 0.3s ease-in-out;
    }
    .sidebar-responsive.mobile-open {
      transform: translateX(0) !important;
    }
    .mobile-close-btn {
      position: absolute !important;
      top: 0.75rem !important;
      right: 0.75rem !important;
      left: auto !important;
    }
    @media (min-width: 1024px) {
      .sidebar-responsive {
        position: static !important;
        transform: translateX(0) !important;
        transition: none !important;
      }
      .mobile-close-btn {
        display: none !important;
      }
    }
  `],
})
export class SidebarComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);
  sidebarService = inject(SidebarService);

  isDesktop = signal(true);
  logoutLoading = signal(false);

  readonly LogOut = LogOut;
  readonly Building2 = Building2;
  readonly X = X;

  ngOnInit() {
    this.syncResponsiveState();
  }

  @HostListener("window:resize")
  onWindowResize() {
    this.syncResponsiveState();
  }

  private syncResponsiveState() {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) {
        this.sidebarService.close();
        this.isDesktop.set(true);
      } else {
        this.isDesktop.set(false);
        this.sidebarService.close();
      }
    }
  }

  onLinkClick() {
    this.sidebarService.close();
  }

  visibleItems() {
    const user = this.auth.currentUser();
    return NAV_ITEMS.filter(
      (item) => !item.roles || (user && item.roles.includes(user.rol)),
    );
  }

  initials(): string {
    const name = this.auth.currentUser()?.nombre ?? "";
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  logout() {
    this.logoutLoading.set(true);
    const MIN_CARGANDO = 2000;
    setTimeout(() => {
      this.auth.logout();
      this.sidebarService.close();
      this.logoutLoading.set(false);
      this.router.navigate(["/login"]);
    }, MIN_CARGANDO);
  }
}
