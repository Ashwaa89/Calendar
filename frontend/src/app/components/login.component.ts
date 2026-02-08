import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { demoMode } from '../../environments/firebase.config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = false;
  error: string | null = null;
  demoMode = demoMode;

  ngOnInit() {
    // In demo mode, check if user is stored
    if (demoMode) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        this.router.navigate(['/calendar']);
        return;
      }
    }
    
    // Check if we're coming back from Google OAuth
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      if (code) {
        this.handleOAuthCallback(code);
      }
    });

    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/calendar']);
    }
  }

  loginDemo() {
    this.loading = true;
    this.error = null;
    this.authService.handleDemoLogin();
    // Loading will be set to false by navigation
    setTimeout(() => this.loading = false, 2000);
  }

  loginWithGoogle() {
    this.loading = true;
    this.error = null;

    this.authService.getGoogleAuthUrl().subscribe({
      next: (response) => {
        window.location.href = response.authUrl;
      },
      error: (error) => {
        console.error('Error getting auth URL:', error);
        this.error = 'Failed to initiate Google login';
        this.loading = false;
      }
    });
  }

  private handleOAuthCallback(code: string) {
    this.loading = true;
    
    this.authService.handleGoogleCallback(code).subscribe({
      next: async (response) => {
        if (response.success) {
          await this.authService.signInWithToken(response.customToken, response.user);
        }
      },
      error: (error) => {
        console.error('Error handling OAuth callback:', error);
        this.error = 'Authentication failed. Please try again.';
        this.loading = false;
        // Clear the code from URL
        this.router.navigate(['/login']);
      }
    });
  }
}
