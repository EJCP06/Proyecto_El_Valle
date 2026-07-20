import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Public
  {
    path: '',
    loadComponent: () =>
      import('./features/inicio/inicio.component').then((m) => m.InicioComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },

  // Protected – wrapped in the dashboard layout
  {
    path: 'app',
    loadComponent: () =>
      import('./layout/dashboard-layout/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent
      ),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'consejos',
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                './features/consejos-comunales/consejo-list.component'
              ).then((m) => m.ConsejoListComponent),
          },
          {
            path: ':id',
            loadComponent: () =>
              import(
                './features/consejos-comunales/consejo-detail.component'
              ).then((m) => m.ConsejoDetailComponent),
          },
        ],
      },
      {
        path: 'familias',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/familias/familia-list.component').then(
                (m) => m.FamiliaListComponent
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/familias/familia-detail.component').then(
                (m) => m.FamiliaDetailComponent
              ),
          },
        ],
      },
      {
        path: 'formularios',
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                './features/formularios/formulario-list.component'
              ).then((m) => m.FormularioListComponent),
          },
          {
            path: ':id/responder',
            loadComponent: () =>
              import(
                './features/formularios/formulario-responder.component'
              ).then((m) => m.FormularioResponderComponent),
          },
        ],
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/reportes/reportes.component').then(
            (m) => m.ReportesComponent
          ),
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/configuracion/configuracion.component').then(
            (m) => m.ConfiguracionComponent
          ),
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/usuarios/usuario-list.component').then(
                (m) => m.UsuarioListComponent
              ),
          },
        ],
      },
    ],
  },

  // Wildcard
  { path: '**', redirectTo: '' },
];
