import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  BarChart3,
  Settings,
  UserCog,
  HelpCircle,
  List,
  BookOpen,
} from 'lucide-angular';

export interface NavItem {
  label: string;
  icon: any;
  route?: string;
  roles?: string[];
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, route: '/app/dashboard' },
  { label: 'Consejos', icon: Building2, route: '/app/consejos' },
  { label: 'Familias', icon: Users, route: '/app/familias' },
  { label: 'Formularios', icon: ClipboardList, route: '/app/formularios' },
  { label: 'Reportes', icon: BarChart3, route: '/app/reportes' },
  {
    label: 'Catálogos',
    icon: BookOpen,
    children: [
      { label: 'Parentescos', icon: List, route: '/app/catalogos/parentescos' },
      { label: 'Estados Civiles', icon: List, route: '/app/catalogos/estados-civiles' },
      { label: 'Niveles Educativos', icon: List, route: '/app/catalogos/niveles-educativos' },
      { label: 'Ocupaciones', icon: List, route: '/app/catalogos/ocupaciones' },
      { label: 'Tipos de Vivienda', icon: List, route: '/app/catalogos/tipos-vivienda' },
      { label: 'Tipos de Discapacidad', icon: List, route: '/app/catalogos/tipos-discapacidad' },
    ]
  },
  {
    label: 'Configuración',
    icon: Settings,
    children: [
      { label: 'Preguntas de Seguridad', icon: HelpCircle, route: '/app/configuracion/preguntas' },
    ]
  },
  { label: 'Usuarios', icon: UserCog, route: '/app/usuarios', roles: ['admin'] },
];
