import { Component, HostListener, inject, signal, OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../core/services/auth.service";
import {
  LucideAngularModule,
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  Settings,
  UserCog,
  UserCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-angular";

interface NavItem {
  label: string;
  icon: any;
  route: string;
  roles?: string[];
}

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <aside
      [class.w-72]="!isCollapsed()"
      [class.w-20]="isCollapsed()"
      class="h-[100dvh] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-all duration-300 relative select-none z-50"
    >
<!-- Logo Header -->
       <div
         class="px-6 pt-16 pb-8 flex items-center justify-center overflow-hidden shrink-0"
       >
        <div
          class="flex items-center justify-center gap-3.5 min-w-0 text-center"
        >
          @if (!isCollapsed()) {
            <div
              class="flex flex-col min-w-0 animate-in fade-in duration-200 text-center mt-2"
            >
              <span
                class="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider leading-none"
                >Sistema de Gestión Comunal</span
              >
            </div>
          }
        </div>

        @if (!isDesktop() && !isCollapsed()) {
          <button
            (click)="collapsed.set(true)"
            class="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Contraer menú"
          >
            <lucide-icon [name]="ChevronLeft" class="w-4 h-4"></lucide-icon>
          </button>
        } @else if (!isDesktop()) {
          <button
            (click)="collapsed.set(false)"
            class="absolute right-[-16px] top-7 w-8 h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer z-50"
            title="Expandir menú"
          >
            <lucide-icon [name]="ChevronRight" class="w-4 h-4"></lucide-icon>
          </button>
        }
      </div>

<!-- Navigation List -->
       <nav
         class="flex-1 overflow-y-auto pt-16 pb-4 px-4 space-y-1.5 touch-scroll hide-scrollbar"
       >
        @for (item of visibleItems(); track item.route) {
          <a
            [routerLink]="item.route"
            class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-all duration-200 group text-sm font-semibold cursor-pointer"
            [title]="item.label"
          >
            <lucide-icon
              [name]="item.icon"
              class="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform text-slate-500 dark:text-slate-400"
            ></lucide-icon>
            @if (!isCollapsed()) {
              <span
                class="truncate animate-in fade-in duration-200 uppercase text-[11px] tracking-wider font-bold"
                >{{ item.label }}</span
              >
            }
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
            @if (!isCollapsed()) {
              <span
                class="truncate font-bold uppercase text-[11px] tracking-wider"
                >Cerrar Sesión</span
              >
            }
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
  styles: [],
})
export class SidebarComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);

  collapsed = signal(false);
  isDesktop = signal(true);
  logoutLoading = signal(false);

  // Expose icons to template
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly LogOut = LogOut;

  private readonly navItems: NavItem[] = [
    { label: "Dashboard", icon: LayoutDashboard, route: "/app/dashboard" },
    { label: "Consejos", icon: Building2, route: "/app/consejos" },
    { label: "Familias", icon: Users, route: "/app/familias" },
    { label: "Formularios", icon: ClipboardList, route: "/app/formularios" },
    { label: "Reportes", icon: BarChart3, route: "/app/reportes" },
    {
      label: "Auditoría",
      icon: ShieldCheck,
      route: "/app/auditoria",
      roles: ["admin"],
    },
    {
      label: "Voceros",
      icon: UserCheck,
      route: "/app/voceros",
      roles: ["admin"],
    },
    {
      label: "Configuración",
      icon: Settings,
      route: "/app/configuracion",
      roles: ["admin"],
    },
    {
      label: "Usuarios",
      icon: UserCog,
      route: "/app/usuarios",
      roles: ["admin"],
    },
  ];

  ngOnInit() {
    this.syncResponsiveState();
  }

  @HostListener("window:resize")
  onWindowResize() {
    this.syncResponsiveState();
  }

  isCollapsed() {
    return !this.isDesktop() && this.collapsed();
  }

  private syncResponsiveState() {
    const desktop = window.innerWidth >= 1024;
    this.isDesktop.set(desktop);
    this.collapsed.set(!desktop);
  }

  visibleItems() {
    const user = this.auth.currentUser();
    return this.navItems.filter(
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
      this.logoutLoading.set(false);
      this.router.navigate(["/login"]);
    }, MIN_CARGANDO);
  }
}
