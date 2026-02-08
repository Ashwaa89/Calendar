import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ProfileService, Prize, Profile } from '../services/profile.service';

@Component({
  selector: 'app-prizes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prizes.component.html',
  styleUrls: ['./prizes.component.scss']
})
export class PrizesComponent implements OnInit {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);

  prizes: Prize[] = [];
  profiles: Profile[] = [];
  loading = false;
  showAddModal = false;
  showRedeemModal = false;
  selectedPrize: Prize | null = null;
  selectedProfileId = '';

  newPrize = {
    title: '',
    description: '',
    starCost: 10,
    icon: '🎁'
  };

  icons = ['🎁', '🎮', '🍕', '🍦', '🎬', '🎨', '⚽', '🎸', '📚', '🧸', '🚲', '🎪'];

  ngOnInit() {
    this.loadPrizes();
    this.loadProfiles();
  }

  loadPrizes() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.loading = true;
    this.profileService.getPrizes(user.id).subscribe({
      next: (response) => {
        this.prizes = response.prizes;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading prizes:', error);
        this.loading = false;
      }
    });
  }

  loadProfiles() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.profileService.getProfiles(user.id).subscribe({
      next: (response) => {
        this.profiles = response.profiles;
      },
      error: (error) => {
        console.error('Error loading profiles:', error);
      }
    });
  }

  openAddModal() {
    this.showAddModal = true;
    this.newPrize = {
      title: '',
      description: '',
      starCost: 10,
      icon: '🎁'
    };
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  selectIcon(icon: string) {
    this.newPrize.icon = icon;
  }

  addPrize() {
    const user = this.authService.getCurrentUser();
    if (!user || !this.newPrize.title) return;

    this.loading = true;
    this.profileService.createPrize({
      userId: user.id,
      ...this.newPrize
    }).subscribe({
      next: (response) => {
        this.prizes.push(response.prize);
        this.closeAddModal();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error creating prize:', error);
        this.loading = false;
      }
    });
  }

  openRedeemModal(prize: Prize) {
    this.selectedPrize = prize;
    this.selectedProfileId = '';
    this.showRedeemModal = true;
  }

  closeRedeemModal() {
    this.showRedeemModal = false;
    this.selectedPrize = null;
  }

  canRedeemPrize(): boolean {
    if (!this.selectedProfileId || !this.selectedPrize) return false;
    const profile = this.profiles.find(p => p.id === this.selectedProfileId);
    if (!profile) return false;
    return this.canAffordPrize(profile, this.selectedPrize);
  }

  selectProfile(profileId: string) {
    this.selectedProfileId = profileId;
  }

  canAffordPrize(profile: Profile, prize: Prize): boolean {
    return profile.stars >= prize.starCost;
  }

  redeemPrize() {
    if (!this.selectedPrize || !this.selectedProfileId) return;

    this.profileService.redeemPrize(this.selectedPrize.id, this.selectedProfileId).subscribe({
      next: (response) => {
        alert(`Prize redeemed! Remaining stars: ${response.remainingStars} ⭐`);
        this.loadProfiles();
        this.closeRedeemModal();
      },
      error: (error) => {
        console.error('Error redeeming prize:', error);
        alert(error.error?.error || 'Failed to redeem prize');
      }
    });
  }

  deletePrize(prizeId: string) {
    if (!confirm('Are you sure you want to delete this prize?')) return;

    this.profileService.deletePrize(prizeId).subscribe({
      next: () => {
        this.prizes = this.prizes.filter(p => p.id !== prizeId);
      },
      error: (error) => {
        console.error('Error deleting prize:', error);
      }
    });
  }
}
