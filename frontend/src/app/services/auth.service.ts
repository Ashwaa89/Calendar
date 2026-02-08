import { Injectable, inject } from '@angular/core';
import { Auth, signInWithCustomToken, signOut, onAuthStateChanged } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { apiUrl, demoMode } from '../../environments/firebase.config';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = demoMode ? null : inject(Auth);
  private http = inject(HttpClient);
  private router = inject(Router);

  private userSubject = new BehaviorSubject<AppUser | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor() {
    if (demoMode) {
      console.log('🎭 Auth Service running in DEMO MODE');
      this.initDemoAuth();
    } else {
      this.initAuth();
    }
  }

  private initDemoAuth() {
    // Check if demo user is stored
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.userSubject.next(JSON.parse(storedUser));
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
      this.router.navigate(['/calendar']);
      return;
    }
    
    try {
      if (!this.auth) throw new Error('Auth not initialized');
      await signInWithCustomToken(this.auth, customToken);
      this.userSubject.next(userData);
      localStorage.setItem('user', JSON.stringify(userData));
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
              picture: response.user.picture
            };
            this.userSubject.next(user);
            localStorage.setItem('user', JSON.stringify(user));
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
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  getCurrentUser(): AppUser | null {
    return this.userSubject.value;
  }

  verifyAdminPin(pin: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${apiUrl}/auth/verify-admin-pin`, { pin });
  }

  async promptForPin(): Promise<boolean> {
    return new Promise((resolve) => {
      const pin = prompt('Enter admin PIN:');
      if (!pin) {
        resolve(false);
        return;
      }
      this.verifyAdminPin(pin).subscribe({
        next: (response) => {
          if (response.success) {
            resolve(true);
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

  isAuthenticated(): boolean {
    return this.userSubject.value !== null;
  }
}
