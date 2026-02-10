import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { WebSocketService } from './services/websocket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  mobileMenuOpen = false;
  sidebarCollapsed = false;
  pinUnlocked = false;
  pinUnlocking = false;

  navItems = [
    { key: 'overview', label: 'Overview', icon: '✨', route: '/overview' },
    { key: 'calendar', label: 'Calendar', icon: '📅', route: '/calendar' },
    { key: 'tasks', label: 'Tasks', icon: '✅', route: '/tasks' },
    { key: 'prizes', label: 'Rewards', icon: '🏆', route: '/prizes' },
    { key: 'meals', label: 'Meal Planner', icon: '🍽️', route: '/meals' },
    { key: 'inventory', label: 'Inventory', icon: '🛒', route: '/inventory' },
    { key: 'shopping', label: 'Shopping List', icon: '🧾', route: '/shopping' },
    { key: 'help', label: 'Help', icon: '❓', route: '/help' },
    { key: 'settings', label: 'Settings', icon: '⚙️', route: '/settings' }
  ];

  constructor(
    public authService: AuthService,
    private themeService: ThemeService,
    private websocket: WebSocketService
  ) {
    const stored = localStorage.getItem('sidebarCollapsed');
    this.sidebarCollapsed = stored === 'true';
    this.themeService.applyFromStorage();

    this.authService.user$.subscribe(user => {
      if (user?.theme) {
        this.themeService.applyTheme(user.theme);
      }
    });

    this.authService.pinUnlocked$.subscribe(isUnlocked => {
      this.pinUnlocked = isUnlocked;
    });

    this.websocket.updates$.subscribe(message => {
      const user = this.authService.getCurrentUser();
      if (!user) return;

      if (message.scope === 'theme' && message.payload?.theme) {
        const updatedUser = { ...user, theme: message.payload.theme };
        this.authService.updateCurrentUser(updatedUser as any);
        this.themeService.applyTheme(message.payload.theme);
      }

      if (message.scope === 'settings') {
        const updatedUser = { ...user } as any;
        if (message.payload?.enabledFeatures) {
          updatedUser.enabledFeatures = message.payload.enabledFeatures;
        }
        if (message.payload?.pinSettings) {
          updatedUser.pinSettings = message.payload.pinSettings;
        }
        this.authService.updateCurrentUser(updatedUser);
      }
    });
  }

  async unlockPin() {
    this.pinUnlocking = true;
    await this.authService.unlockAdminAccess();
    this.pinUnlocking = false;
  }

  lockPin() {
    this.authService.lockAdminAccess();
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('sidebarCollapsed', String(this.sidebarCollapsed));
  }

  isFeatureEnabled(featureKey: string): boolean {
    const user = this.authService.getCurrentUser();
    if (!user || !Array.isArray(user.enabledFeatures)) return true;
    if (featureKey === 'settings') return true;
    return user.enabledFeatures.includes(featureKey);
  }
}
