import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ProfileService,Profile } from '../services/profile.service';
import { WebSocketService } from '../services/websocket.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-profiles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.scss']
})
export class ProfilesComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private websocket = inject(WebSocketService);
  private destroy$ = new Subject<void>();

  profiles: Profile[] = [];
  loading = false;
  showAddModal = false;
  showEditModal = false;
  editingProfileId: string | null = null;
  
  newProfile = {
    name: '',
    avatar: '🐶',
    color: '#667eea',
    age: null as number | null
  };

  editProfile = {
    name: '',
    avatar: '🐶',
    color: '#667eea',
    age: null as number | null
  };

  avatars = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁',
    '🐮', '🐷', '🐸', '🐵', '🦄', '🐔', '🐧', '🐦', '🦉', '🦆', '🦢', '🦋',
    '🐞', '🐢', '🐙', '🐠', '🐬', '🦭', '🐳', '🦒', '🦓', '🦥', '🦦', '🦘',
    '🦝', '🦨', '🦡', '🦫', '🦚', '🦜', '🦩', '🐿️', '🦔', '🐾', '🐝', '🪲',
    '🦋', '🪼', '🦈', '🐊', '🐢', '🦎', '🐍', '🦖', '🦕', '🦌', '🦬', '🦣',
    '🐐', '🐑', '🦙', '🦘', '🦥', '🦦', '🦡', '🦏', '🦛', '🐪', '🐫', '🦒'
  ];

  colors = ['#667eea', '#764ba2', '#ff6b6b', '#f06595', '#fcc419', '#40c057', '#20c997', '#4dabf7', '#3bc9db', '#845ef7', '#ff922b', '#94d82d'];

  ngOnInit() {
    this.loadProfiles();

    this.websocket.updates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message.scope === 'profiles') {
          this.loadProfiles();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProfiles() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.loading = true;
    this.profileService.getProfiles(user.id).subscribe({
      next: (response) => {
        this.profiles = response.profiles;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profiles:', error);
        this.loading = false;
      }
    });
  }

  openAddModal() {
    this.showAddModal = true;
    this.newProfile = { name: '', avatar: '🐶', color: '#667eea', age: null };
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  openEditModal(profile: Profile) {
    this.showEditModal = true;
    this.editingProfileId = profile.id;
    this.editProfile = {
      name: profile.name,
      avatar: profile.avatar || '🐶',
      color: profile.color || '#667eea',
      age: profile.age ?? null
    };
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingProfileId = null;
  }

  selectAvatar(avatar: string) {
    this.newProfile.avatar = avatar;
  }

  selectColor(color: string) {
    this.newProfile.color = color;
  }

  selectEditAvatar(avatar: string) {
    this.editProfile.avatar = avatar;
  }

  selectEditColor(color: string) {
    this.editProfile.color = color;
  }

  async addProfile() {
    const user = this.authService.getCurrentUser();
    if (!user || !this.newProfile.name) return;

    const pinVerified = await this.authService.requirePinFor('profiles:edit');
    if (!pinVerified) return;

    this.loading = true;
    const profileData: any = {
      name: this.newProfile.name,
      avatar: this.newProfile.avatar,
      color: this.newProfile.color
    };
    if (this.newProfile.age !== null) {
      profileData.age = this.newProfile.age;
    }
    
    this.profileService.createProfile(user.id, profileData).subscribe({
      next: (response) => {
        this.profiles.push(response.profile);
        this.closeAddModal();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error creating profile:', error);
        this.loading = false;
      }
    });
  }

  async updateProfile() {
    if (!this.editingProfileId || !this.editProfile.name) return;

    const pinVerified = await this.authService.requirePinFor('profiles:edit');
    if (!pinVerified) return;

    const updates: any = {
      name: this.editProfile.name,
      avatar: this.editProfile.avatar,
      color: this.editProfile.color
    };
    if (this.editProfile.age !== null) {
      updates.age = this.editProfile.age;
    } else {
      updates.age = null;
    }

    this.profileService.updateProfile(this.editingProfileId, updates).subscribe({
      next: () => {
        const index = this.profiles.findIndex(p => p.id === this.editingProfileId);
        if (index > -1) {
          this.profiles[index] = {
            ...this.profiles[index],
            ...updates
          };
        }
        this.closeEditModal();
      },
      error: (error) => {
        console.error('Error updating profile:', error);
      }
    });
  }

  async deleteProfile(profileId: string) {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    const pinVerified = await this.authService.requirePinFor('profiles:edit');
    if (!pinVerified) return;

    this.profileService.deleteProfile(profileId).subscribe({
      next: () => {
        this.profiles = this.profiles.filter(p => p.id !== profileId);
      },
      error: (error) => {
        console.error('Error deleting profile:', error);
      }
    });
  }

}
