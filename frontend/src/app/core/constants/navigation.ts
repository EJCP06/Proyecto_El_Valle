import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  BarChart3,
  UserCog,
  HelpCircle,
  List,
  BookOpen,
  User,
  ShieldCheck,
  Network,
  Database,
} from 'lucide-angular';

export interface NavItem {
  label: string;
  icon: any;
  route?: string;
  roles?: string[];
  module?: string;
  action?: 'ver' | 'crear' | 'editar' | 'eliminar';
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, route: '/app/dashboard', module: 'dashboard', action: 'ver' },
  { label: 'Consejos', icon: Building2, route: '/app/consejos', module: 'consejos', action: 'ver' },
  { label: 'Familias', icon: Users, route: '/app/familias', module: 'familias', action: 'ver' },
  { label: 'Formularios', icon: ClipboardList, route: '/app/formularios', module: 'formularios', action: 'ver' },
  { label: 'Reportes', icon: BarChart3, route: '/app/reportes', module: 'reportes', action: 'ver' },
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
      { label: 'Preguntas de Seguridad', icon: HelpCircle, route: '/app/catalogos/preguntas-seguridad' },
    ]
  },
  {
    label: 'Seguridad',
    icon: UserCog,
    children: [
      { label: 'Perfil', icon: User, route: '/app/perfil' },
      { label: 'Usuarios', icon: Users, route: '/app/usuarios', roles: ['admin'] },
      { label: 'Auditoría', icon: ShieldCheck, route: '/app/auditoria', roles: ['admin'] },
      { label: 'Seguridad de Red', icon: Network, route: '/app/seguridad-red', roles: ['admin'] },
      { label: 'Backup y Restauración', icon: Database, route: '/app/backup', roles: ['admin'] },
    ],
  },
];
