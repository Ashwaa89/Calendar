import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { CalendarService, GoogleCalendar } from '../services/calendar.service';
import { ProfilesComponent } from './profiles.component';
import { ThemeService, ThemeSettings } from '../services/theme.service';
import { WebSocketService } from '../services/websocket.service';
import { Subject, takeUntil } from 'rxjs';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfilesComponent, RouterLink],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private calendarService = inject(CalendarService);
  private themeService = inject(ThemeService);
  private websocket = inject(WebSocketService);
  private destroy$ = new Subject<void>();

  calendars: GoogleCalendar[] = [];
  selectedCalendars: Set<string> = new Set();
  loading = false;
  pinVerified = false;
  pinInput = '';
  adminPinSet = false;
  pinSetup = '';
  pinConfirm = '';
  pinError = '';
  pinLoading = false;
  featureError = '';
  featureLoading = false;
  availableFeatures = [
    { key: 'overview', label: 'Overview' },
    { key: 'calendar', label: 'Calendar' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'prizes', label: 'Rewards' },
    { key: 'meals', label: 'Meal Planner' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'shopping', label: 'Shopping List' },
    { key: 'help', label: 'Help' },
    { key: 'settings', label: 'Settings' }
  ];
  enabledFeatures: Set<string> = new Set();
  collapsedSections: Set<string> = new Set(['help']); // Start with help collapsed
  pinSettings = this.authService.getPinSettings();
  pinSettingsSaving = false;
  pinSettingsError = '';
  pinActions = [
    { key: 'tasks:add', label: 'Add tasks' },
    { key: 'tasks:edit', label: 'Edit tasks' },
    { key: 'tasks:delete', label: 'Delete tasks' },
    { key: 'tasks:complete', label: 'Complete tasks' },
    { key: 'tasks:assign', label: 'Assign tasks' },
    { key: 'profiles:edit', label: 'Edit profiles' },
    { key: 'prizes:manage', label: 'Manage prizes' },
    { key: 'meals:manage', label: 'Manage meals' },
    { key: 'inventory:manage', label: 'Manage inventory' },
    { key: 'shopping:manage', label: 'Manage shopping list' },
    { key: 'calendar:assign', label: 'Assign calendar events' },
    { key: 'settings:calendar', label: 'Edit calendar settings' },
    { key: 'settings:features', label: 'Edit navigation features' },
    { key: 'settings:theme', label: 'Edit theme' },
    { key: 'settings:security', label: 'Edit security settings' }
  ];
  themePresets: ThemeSettings[] = [
    {
      name: 'Aurora',
      backgroundType: 'gradient',
      backgroundStart: '#667eea',
      backgroundEnd: '#764ba2',
      backgroundAngle: 135,
      panelBackground: '#ffffff',
      cardBackground: '#ffffff',
      sectionBackground: '#ffffff',
      sectionText: '#333333',
      sidebarBackground: 'rgba(255, 255, 255, 0.95)',
      headerText: '#333333',
      bodyText: '#666666',
      accent: '#667eea'
    },
    {
      name: 'Sandstone',
      backgroundType: 'gradient',
      backgroundStart: '#f6d365',
      backgroundEnd: '#fda085',
      backgroundAngle: 140,
      panelBackground: '#fff8f1',
      cardBackground: '#fffdf9',
      sectionBackground: '#fff8f1',
      sectionText: '#4a332d',
      sidebarBackground: 'rgba(255, 255, 255, 0.95)',
      headerText: '#4a332d',
      bodyText: '#6e544e',
      accent: '#f08c5a'
    },
    {
      name: 'Mint',
      backgroundType: 'gradient',
      backgroundStart: '#c2ffd8',
      backgroundEnd: '#465efb',
      backgroundAngle: 120,
      panelBackground: '#f4fff9',
      cardBackground: '#ffffff',
      sectionBackground: '#f4fff9',
      sectionText: '#1f2a44',
      sidebarBackground: 'rgba(255, 255, 255, 0.95)',
      headerText: '#1f2a44',
      bodyText: '#3c4a6b',
      accent: '#3aa6b9'
    },
    {
      name: 'Slate',
      backgroundType: 'solid',
      backgroundStart: '#1f2937',
      backgroundEnd: '#1f2937',
      backgroundAngle: 0,
      panelBackground: '#111827',
      cardBackground: '#1f2937',
      sectionBackground: '#111827',
      sectionText: '#f9fafb',
      sidebarBackground: '#111827',
      headerText: '#f9fafb',
      bodyText: '#d1d5db',
      accent: '#38bdf8'
    },
    {
      name: 'Sunrise',
      backgroundType: 'gradient',
      backgroundStart: '#ff9a9e',
      backgroundEnd: '#fad0c4',
      backgroundAngle: 120,
      panelBackground: '#fff5f5',
      cardBackground: '#ffffff',
      sectionBackground: '#fff5f5',
      sectionText: '#542c2c',
      sidebarBackground: 'rgba(255, 255, 255, 0.95)',
      headerText: '#542c2c',
      bodyText: '#6b3c3c',
      accent: '#ff6b6b'
    },
    {
      name: 'Ocean',
      backgroundType: 'gradient',
      backgroundStart: '#2193b0',
      backgroundEnd: '#6dd5ed',
      backgroundAngle: 125,
      panelBackground: '#f1fbff',
      cardBackground: '#ffffff',
      sectionBackground: '#f1fbff',
      sectionText: '#0c3b4a',
      sidebarBackground: 'rgba(255, 255, 255, 0.95)',
      headerText: '#0c3b4a',
      bodyText: '#2c4f5b',
      accent: '#1b9aaa'
    },
    {
      name: 'Forest',
      backgroundType: 'gradient',
      backgroundStart: '#134e5e',
      backgroundEnd: '#71b280',
      backgroundAngle: 120,
      panelBackground: '#eef6f0',
      cardBackground: '#ffffff',
      sectionBackground: '#eef6f0',
      sectionText: '#1e3d2f',
      sidebarBackground: 'rgba(255, 255, 255, 0.95)',
      headerText: '#1e3d2f',
      bodyText: '#2d4b3b',
      accent: '#3da35a'
    },
    {
      name: 'Nebula',
      backgroundType: 'gradient',
      backgroundStart: '#41295a',
      backgroundEnd: '#2f0743',
      backgroundAngle: 145,
      panelBackground: '#1c1027',
      cardBackground: '#2b1638',
      sectionBackground: '#1c1027',
      sectionText: '#f5e9ff',
      sidebarBackground: '#160b20',
      headerText: '#f5e9ff',
      bodyText: '#d1bfe8',
      accent: '#b983ff'
    }
  ];
  themeSelection = 'Aurora';
  currentTheme: ThemeSettings = this.themeService.getDefaultTheme();
  themeSaving = false;
  themeError = '';

  ngOnInit() {
    this.pinVerified = this.authService.isPinUnlocked() || !this.requiresSettingsPin();
    this.authService.pinUnlocked$.subscribe(isUnlocked => {
      this.pinVerified = isUnlocked || !this.requiresSettingsPin();
    });

    this.authService.user$.subscribe(user => {
      this.adminPinSet = !!user?.adminPinSet;
      if (user?.enabledFeatures) {
        this.enabledFeatures = new Set(user.enabledFeatures);
      }
      if (user?.theme) {
        this.currentTheme = { ...user.theme };
        this.themeSelection = user.theme.name || 'Custom';
        this.themeService.applyTheme(this.currentTheme);
      }
      if (user?.pinSettings) {
        this.pinSettings = { ...this.authService.getPinSettings(), ...user.pinSettings };
        this.pinVerified = this.authService.isPinUnlocked() || !this.requiresSettingsPin();
      }

      if (user && this.pinVerified) {
        this.loadEnabledFeatures();
        this.loadCalendars();
      }
    });

    this.websocket.updates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message.scope === 'settings' || message.scope === 'calendar') {
          this.loadEnabledFeatures();
          this.loadCalendars();
        }
        if (message.scope === 'theme' && message.payload?.theme) {
          this.currentTheme = { ...this.currentTheme, ...message.payload.theme };
          this.themeSelection = message.payload.theme?.name || 'Custom';
          this.themeService.applyTheme(this.currentTheme);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async verifyPin() {
    this.pinLoading = true;
    this.pinError = '';

    const unlocked = await this.authService.unlockAdminAccess(this.pinInput);
    if (unlocked) {
      this.pinVerified = true;
      this.loadEnabledFeatures();
      this.loadCalendars();
    } else {
      this.pinError = 'PIN verification failed.';
    }

    this.pinInput = '';
    this.pinLoading = false;
  }

  setAdminPin() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    if (!/^\d{4}$/.test(this.pinSetup)) {
      this.pinError = 'PIN must be a 4-digit number.';
      return;
    }
    if (this.pinSetup !== this.pinConfirm) {
      this.pinError = 'PINs do not match.';
      return;
    }

    this.pinLoading = true;
    this.pinError = '';

    this.authService.setAdminPin(user.id, this.pinSetup).subscribe({
      next: async () => {
        this.adminPinSet = true;
        this.pinVerified = true;
        await this.authService.unlockAdminAccess(this.pinSetup);
        this.pinSetup = '';
        this.pinConfirm = '';
        this.pinLoading = false;
        this.loadEnabledFeatures();
        this.loadCalendars();
      },
      error: (error) => {
        console.error('Error setting admin PIN:', error);
        this.pinError = 'Failed to set admin PIN.';
        this.pinLoading = false;
      }
    });
  }

  loadCalendars() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.loading = true;
    this.calendarService.getUserCalendars(user.id).subscribe({
      next: (response) => {
        this.calendars = response.calendars;
        const selected = Array.isArray(response.selectedCalendars)
          ? response.selectedCalendars
          : [];
        this.selectedCalendars = new Set(selected);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading calendars:', error);
        this.loading = false;
      }
    });
  }

  loadEnabledFeatures() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const features = Array.isArray(user.enabledFeatures)
      ? user.enabledFeatures
      : this.availableFeatures.map(feature => feature.key);
    this.enabledFeatures = new Set(features);
  }

  toggleCalendar(calendarId: string) {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const nextSelection = new Set(this.selectedCalendars);
    if (nextSelection.has(calendarId)) {
      nextSelection.delete(calendarId);
    } else {
      nextSelection.add(calendarId);
    }

    this.selectedCalendars = nextSelection;

    this.calendarService.saveSelectedCalendars(user.id, Array.from(nextSelection)).subscribe({
      error: (error) => {
        console.error('Error saving selected calendars:', error);
      }
    });
  }

  toggleFeature(featureKey: string) {
    const nextSelection = new Set(this.enabledFeatures);
    if (nextSelection.has(featureKey)) {
      nextSelection.delete(featureKey);
    } else {
      nextSelection.add(featureKey);
    }

    // Keep settings visible to avoid lockout
    nextSelection.add('settings');

    this.enabledFeatures = nextSelection;
    this.saveEnabledFeatures();
  }

  saveEnabledFeatures() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.featureLoading = true;
    this.featureError = '';

    this.authService.setEnabledFeatures(user.id, Array.from(this.enabledFeatures)).subscribe({
      next: (response) => {
        const updatedUser = { ...user, enabledFeatures: response.enabledFeatures };
        this.enabledFeatures = new Set(response.enabledFeatures);
        this.authService.updateCurrentUser(updatedUser as any);
        this.websocket.sendUpdate('settings', { enabledFeatures: response.enabledFeatures });
        this.featureLoading = false;
      },
      error: (error) => {
        console.error('Error saving enabled features:', error);
        this.featureError = 'Failed to save feature settings.';
        this.featureLoading = false;
      }
    });
  }

  selectThemePreset(name: string) {
    const preset = this.themePresets.find(theme => theme.name === name);
    if (!preset) return;
    this.currentTheme = { ...preset };
    this.themeSelection = preset.name;
    this.themeService.applyTheme(this.currentTheme);
  }

  applyThemePreview() {
    this.themeSelection = 'Custom';
    this.themeService.applyTheme(this.currentTheme);
  }

  saveTheme() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.themeSaving = true;
    this.themeError = '';

    this.authService.setTheme(user.id, this.currentTheme).subscribe({
      next: (response) => {
        const updatedUser = { ...user, theme: response.theme };
        this.currentTheme = { ...response.theme };
        this.authService.updateCurrentUser(updatedUser as any);
        this.themeService.applyTheme(this.currentTheme);
        this.websocket.sendUpdate('theme', { theme: response.theme });
        this.themeSaving = false;
      },
      error: (error) => {
        console.error('Error saving theme:', error);
        this.themeError = 'Failed to save theme.';
        this.themeSaving = false;
      }
    });
  }

  toggleRequiredAction(actionKey: string) {
    const next = new Set(this.pinSettings.requiredActions || []);
    if (next.has(actionKey)) {
      next.delete(actionKey);
    } else {
      next.add(actionKey);
    }
    this.pinSettings = { ...this.pinSettings, requiredActions: Array.from(next) };
    this.pinVerified = this.authService.isPinUnlocked() || !this.requiresSettingsPin();
  }

  savePinSettings() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.pinSettingsSaving = true;
    this.pinSettingsError = '';

    this.authService.setPinSettings(user.id, this.pinSettings).subscribe({
      next: (response) => {
        const updatedUser = { ...user, pinSettings: response.pinSettings };
        this.pinSettings = { ...response.pinSettings };
        this.authService.updateCurrentUser(updatedUser as any);
        this.websocket.sendUpdate('settings', { pinSettings: response.pinSettings });
        this.pinVerified = this.authService.isPinUnlocked() || !this.requiresSettingsPin();
        this.pinSettingsSaving = false;
      },
      error: (error) => {
        console.error('Error saving pin settings:', error);
        this.pinSettingsError = 'Failed to save security settings.';
        this.pinSettingsSaving = false;
      }
    });
  }

  toggleSection(sectionKey: string) {
    if (this.collapsedSections.has(sectionKey)) {
      this.collapsedSections.delete(sectionKey);
    } else {
      this.collapsedSections.add(sectionKey);
    }
  }

  isSectionCollapsed(sectionKey: string): boolean {
    return this.collapsedSections.has(sectionKey);
  }

  private requiresSettingsPin(): boolean {
    const actions = this.pinSettings.requiredActions || [];
    return actions.some(action => action.startsWith('settings:'));
  }
}
