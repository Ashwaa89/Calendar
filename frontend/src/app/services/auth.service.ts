import { Injectable, inject } from '@angular/core';
import { Auth, signInWithCustomToken, signOut, onAuthStateChanged } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { apiUrl, demoMode } from '../../environments/firebase.config';
import { ThemeSettings } from './theme.service';
import { WebSocketService } from './websocket.service';

export interface PinSettings {
  autoLockMinutes: number;
  requiredActions: string[];
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  adminPinSet?: boolean;
  enabledFeatures?: string[];
  theme?: ThemeSettings;
  pinSettings?: PinSettings;
}

const DEFAULT_PIN_SETTINGS: PinSettings = {
  autoLockMinutes: 30,
  requiredActions: [
    'tasks:add',
    'tasks:complete',
    'tasks:edit',
    'tasks:delete',
    'tasks:assign',
    'profiles:edit',
    'prizes:manage',
    'inventory:manage',
    'meals:manage',
    'shopping:manage',
    'calendar:assign',
    'settings:calendar',
    'settings:features',
    'settings:theme',
    'settings:security'
  ]
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = demoMode ? null : inject(Auth);
  private http = inject(HttpClient);
  private router = inject(Router);
  private websocket = inject(WebSocketService);

  private userSubject = new BehaviorSubject<AppUser | null>(null);
  public user$ = this.userSubject.asObservable();
  private pinUnlockedSubject = new BehaviorSubject<boolean>(false);
  public pinUnlocked$ = this.pinUnlockedSubject.asObservable();
  private pinUnlockTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly pinUnlockKey = 'pinUnlockUntil';

  constructor() {
    if (demoMode) {
      console.log('🎭 Auth Service running in DEMO MODE');
      this.initDemoAuth();
    } else {
      this.hydrateUserFromStorage();
      this.initAuth();
    }
    this.refreshPinUnlockFromStorage();
  }

  private hydrateUserFromStorage() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.userSubject.next(user);
      if (user?.id) {
        this.websocket.connect(user.id);
      }
    }
  }

  private initDemoAuth() {
    // Check if demo user is stored
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.userSubject.next(user);
      if (user?.id) {
        this.websocket.connect(user.id);
      }
    }
  }

  private initAuth() {
    if (!this.auth) return;
    
    onAuthStateChanged(this.auth, async (firebaseUser: any) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        this.verifyToken(token);
      } else {
        this.userSubject.next(null);
      }
    });
  }

  // Demo mode: simple login without Google OAuth
  loginDemo(): Observable<any> {
    return this.http.get(`${apiUrl}/auth/demo-login`);
  }

  handleDemoLogin() {
    this.loginDemo().subscribe({
      next: (response: any) => {
        const user: AppUser = response.user;
        this.userSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('demoToken', response.token);
        this.websocket.connect(user.id);
        this.router.navigate(['/calendar']);
      },
      error: (error: any) => {
        console.error('Demo login failed:', error);
      }
    });
  }

  getGoogleAuthUrl(): Observable<{ authUrl: string }> {
    return this.http.get<{ authUrl: string }>(`${apiUrl}/auth/google-auth-url`);
  }

  handleGoogleCallback(code: string): Observable<any> {
    return this.http.post(`${apiUrl}/auth/google-callback`, { code });
  }

  async signInWithToken(customToken: string, userData: AppUser) {
    if (demoMode) {
      // Skip Firebase auth in demo mode
      this.userSubject.next(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      this.websocket.connect(userData.id);
      this.router.navigate(['/calendar']);
      return;
    }
    
    try {
      if (!this.auth) throw new Error('Auth not initialized');
      await signInWithCustomToken(this.auth, customToken);
      this.userSubject.next(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      this.websocket.connect(userData.id);
      this.router.navigate(['/calendar']);
    } catch (error) {
      console.error('Error signing in with token:', error);
      throw error;
    }
  }

  private verifyToken(token: string) {
    this.http.post<{ success: boolean; user: any }>(`${apiUrl}/auth/verify-token`, { token })
      .subscribe({
        next: (response) => {
          if (response.success) {
            const user: AppUser = {
              id: response.user.id,
              email: response.user.email,
              name: response.user.name,
              picture: response.user.picture,
              adminPinSet: response.user.adminPinSet,
              enabledFeatures: response.user.enabledFeatures,
              theme: response.user.theme,
              pinSettings: response.user.pinSettings
            };
            this.userSubject.next(user);
            localStorage.setItem('user', JSON.stringify(user));
            this.websocket.connect(user.id);
          }
        },
        error: (error) => {
          console.error('Token verification failed:', error);
          this.logout();
        }
      });
  }

  async logout() {
    if (demoMode) {
      // Demo mode logout
      this.userSubject.next(null);
      this.lockAdminAccess();
      localStorage.removeItem('user');
      localStorage.removeItem('demoToken');
      this.router.navigate(['/login']);
      return;
    }
    
    try {
      if (this.auth) {
        await signOut(this.auth);
      }
      this.userSubject.next(null);
      this.lockAdminAccess();
      this.websocket.disconnect();
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  getCurrentUser(): AppUser | null {
    return this.userSubject.value;
  }

  updateCurrentUser(user: AppUser) {
    this.userSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  getPinSettings(): PinSettings {
    const user = this.getCurrentUser();
    if (!user || !user.pinSettings) return { ...DEFAULT_PIN_SETTINGS };
    return { ...DEFAULT_PIN_SETTINGS, ...user.pinSettings };
  }

  isPinRequired(actionKey: string): boolean {
    const settings = this.getPinSettings();
    return settings.requiredActions.includes(actionKey);
  }

  isPinUnlocked(): boolean {
    const raw = localStorage.getItem(this.pinUnlockKey);
    if (!raw) return false;
    const unlockUntil = Number(raw);
    if (unlockUntil === 0) return true;
    if (!Number.isFinite(unlockUntil)) return false;
    return Date.now() < unlockUntil;
  }

  lockAdminAccess() {
    localStorage.removeItem(this.pinUnlockKey);
    if (this.pinUnlockTimer) {
      clearTimeout(this.pinUnlockTimer);
      this.pinUnlockTimer = null;
    }
    this.pinUnlockedSubject.next(false);
  }

  private setPinUnlockUntil(minutes: number) {
    if (this.pinUnlockTimer) {
      clearTimeout(this.pinUnlockTimer);
      this.pinUnlockTimer = null;
    }

    if (minutes <= 0) {
      localStorage.setItem(this.pinUnlockKey, '0');
      this.pinUnlockedSubject.next(true);
      return;
    }

    const unlockUntil = Date.now() + minutes * 60 * 1000;
    localStorage.setItem(this.pinUnlockKey, String(unlockUntil));
    this.pinUnlockedSubject.next(true);
    this.pinUnlockTimer = setTimeout(() => this.lockAdminAccess(), minutes * 60 * 1000);
  }

  private refreshPinUnlockFromStorage() {
    const raw = localStorage.getItem(this.pinUnlockKey);
    if (!raw) {
      this.pinUnlockedSubject.next(false);
      return;
    }

    const unlockUntil = Number(raw);
    if (unlockUntil === 0) {
      this.pinUnlockedSubject.next(true);
      return;
    }

    if (!Number.isFinite(unlockUntil) || Date.now() >= unlockUntil) {
      this.lockAdminAccess();
      return;
    }

    const remainingMs = unlockUntil - Date.now();
    this.pinUnlockedSubject.next(true);
    this.pinUnlockTimer = setTimeout(() => this.lockAdminAccess(), remainingMs);
  }

  verifyAdminPin(userId: string, pin: string): Observable<{ success: boolean; requiresSetup?: boolean }> {
    return this.http.post<{ success: boolean; requiresSetup?: boolean }>(`${apiUrl}/auth/verify-admin-pin`, { userId, pin });
  }

  setAdminPin(userId: string, pin: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${apiUrl}/auth/set-admin-pin`, { userId, pin });
  }

  setEnabledFeatures(userId: string, enabledFeatures: string[]): Observable<{ success: boolean; enabledFeatures: string[] }> {
    return this.http.post<{ success: boolean; enabledFeatures: string[] }>(`${apiUrl}/auth/set-enabled-features`, {
      userId,
      enabledFeatures
    });
  }

  setTheme(userId: string, theme: ThemeSettings): Observable<{ success: boolean; theme: ThemeSettings }> {
    return this.http.post<{ success: boolean; theme: ThemeSettings }>(`${apiUrl}/auth/set-theme`, {
      userId,
      theme
    });
  }

  setPinSettings(userId: string, pinSettings: PinSettings): Observable<{ success: boolean; pinSettings: PinSettings }> {
    return this.http.post<{ success: boolean; pinSettings: PinSettings }>(`${apiUrl}/auth/set-pin-settings`, {
      userId,
      pinSettings
    });
  }

  async requirePinFor(actionKey: string): Promise<boolean> {
    if (!this.isPinRequired(actionKey)) return true;
    if (this.isPinUnlocked()) return true;
    return this.unlockAdminAccess();
  }

  async unlockAdminAccess(pinOverride?: string): Promise<boolean> {
    const user = this.getCurrentUser();
    if (!user) return false;

    if (!user.adminPinSet) {
      const setupOk = await this.setupAdminPin();
      if (!setupOk) return false;
    }

    return new Promise((resolve) => {
      const pin = pinOverride ?? prompt('Enter admin PIN:');
      if (!pin) {
        resolve(false);
        return;
      }
      this.verifyAdminPin(user.id, pin).subscribe({
        next: (response) => {
          if (response.success) {
            const settings = this.getPinSettings();
            this.setPinUnlockUntil(settings.autoLockMinutes);
            resolve(true);
          } else if (response.requiresSetup) {
            alert('Admin PIN is not set yet');
            resolve(false);
          } else {
            alert('Incorrect PIN');
            resolve(false);
          }
        },
        error: () => {
          alert('PIN verification failed');
          resolve(false);
        }
      });
    });
  }

  async promptForPin(): Promise<boolean> {
    return this.unlockAdminAccess();
  }

  private async setupAdminPin(): Promise<boolean> {
    const user = this.getCurrentUser();
    if (!user) return false;

    const pin = prompt('Set a 4-digit admin PIN:');
    if (!pin) return false;
    if (!/^\d{4}$/.test(pin)) {
      alert('PIN must be a 4-digit number');
      return false;
    }

    const confirmPin = prompt('Confirm admin PIN:');
    if (pin !== confirmPin) {
      alert('PINs do not match');
      return false;
    }

    try {
      await firstValueFrom(this.setAdminPin(user.id, pin));
      const updatedUser = { ...user, adminPinSet: true };
      this.userSubject.next(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return true;
    } catch (error) {
      console.error('Failed to set admin PIN:', error);
      alert('Failed to set admin PIN');
      return false;
    }
  }

  isAuthenticated(): boolean {
    return this.userSubject.value !== null;
  }
}
