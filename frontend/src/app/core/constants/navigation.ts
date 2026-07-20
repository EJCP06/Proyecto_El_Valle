import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  BarChart3,
  Settings,
  UserCog,
} from 'lucide-angular';

export interface NavItem {
  label: string;
  icon: any;
  route: string;
  roles?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, route: '/app/dashboard' },
  { label: 'Consejos', icon: Building2, route: '/app/consejos' },
  { label: 'Familias', icon: Users, route: '/app/familias' },
  { label: 'Formularios', icon: ClipboardList, route: '/app/formularios' },
  { label: 'Reportes', icon: BarChart3, route: '/app/reportes' },
  { label: 'Configuración', icon: Settings, route: '/app/configuracion', roles: ['admin'] },
  { label: 'Usuarios', icon: UserCog, route: '/app/usuarios', roles: ['admin'] },
];
