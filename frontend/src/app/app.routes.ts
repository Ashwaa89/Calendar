import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/calendar',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'shopping',
    loadComponent: () => import('./components/shopping-list.component').then(m => m.ShoppingListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'calendar',
    loadComponent: () => import('./components/calendar.component').then(m => m.CalendarComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profiles',
    loadComponent: () => import('./components/profiles.component').then(m => m.ProfilesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tasks',
    loadComponent: () => import('./components/tasks-hub.component').then(m => m.TasksHubComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tasks/:profileId',
    loadComponent: () => import('./components/tasks.component').then(m => m.TasksComponent),
    canActivate: [authGuard]
  },
  {
    path: 'prizes',
    loadComponent: () => import('./components/prizes.component').then(m => m.PrizesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'meals',
    loadComponent: () => import('./components/meal-planner.component').then(m => m.MealPlannerComponent),
    canActivate: [authGuard]
  },
  {
    path: 'inventory',
    loadComponent: () => import('./components/inventory.component').then(m => m.InventoryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  }
];
