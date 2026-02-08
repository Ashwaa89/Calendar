import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../../environments/firebase.config';

export interface Profile {
  id: string;
  parentUserId: string;
  name: string;
  avatar: string;
  color?: string;
  age?: number;
  stars: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string; // assignment id
  taskId: string;
  profileId: string;
  userId: string;
  title: string;
  description: string;
  stars: number;
  frequency?: number;
  frequencyUnit?: 'hours' | 'days' | 'weeks';
  completed: boolean;
  lastCompletedAt?: string;
  availableAt: string;
  assignmentCreatedAt?: string;
  assignmentUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCatalogItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  stars: number;
  frequency?: number;
  frequencyUnit?: 'hours' | 'days' | 'weeks';
  createdAt: string;
  updatedAt: string;
}

export interface Prize {
  id: string;
  userId: string;
  title: string;
  description: string;
  starCost: number;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);

  // Profiles
  getProfiles(userId: string): Observable<{ profiles: Profile[] }> {
    return this.http.get<{ profiles: Profile[] }>(`${apiUrl}/profiles/${userId}`);
  }

  createProfile(userId: string, profile: Partial<Profile>): Observable<{ success: boolean; profile: Profile }> {
    return this.http.post<{ success: boolean; profile: Profile }>(`${apiUrl}/profiles/${userId}`, profile);
  }

  updateProfile(profileId: string, updates: Partial<Profile>): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${apiUrl}/profiles/${profileId}`, updates);
  }

  deleteProfile(profileId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${apiUrl}/profiles/${profileId}`);
  }

  // Tasks
  getTasks(profileId: string): Observable<{ tasks: Task[] }> {
    return this.http.get<{ tasks: Task[] }>(`${apiUrl}/tasks/profile/${profileId}`);
  }

  getTaskCatalog(userId: string): Observable<{ tasks: TaskCatalogItem[] }> {
    return this.http.get<{ tasks: TaskCatalogItem[] }>(`${apiUrl}/tasks/catalog/${userId}`);
  }

  createTask(task: Partial<TaskCatalogItem> & { userId: string; profileId?: string }): Observable<{ success: boolean; task: TaskCatalogItem; assignment?: any }> {
    return this.http.post<{ success: boolean; task: TaskCatalogItem; assignment?: any }>(`${apiUrl}/tasks`, task);
  }

  assignTask(profileId: string, taskId: string): Observable<{ success: boolean; assignment: any }> {
    return this.http.post<{ success: boolean; assignment: any }>(`${apiUrl}/tasks/assign`, {
      profileId,
      taskId
    });
  }

  unassignTask(assignmentId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${apiUrl}/tasks/assign/${assignmentId}`);
  }

  completeTask(assignmentId: string): Observable<{ success: boolean; starsEarned: number }> {
    return this.http.post<{ success: boolean; starsEarned: number }>(`${apiUrl}/tasks/complete/${assignmentId}`, {});
  }

  updateTask(taskId: string, updates: Partial<Task>): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${apiUrl}/tasks/${taskId}`, updates);
  }

  deleteTask(taskId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${apiUrl}/tasks/${taskId}`);
  }

  // Prizes
  getPrizes(userId: string): Observable<{ prizes: Prize[] }> {
    return this.http.get<{ prizes: Prize[] }>(`${apiUrl}/prizes/${userId}`);
  }

  createPrize(prize: Partial<Prize>): Observable<{ success: boolean; prize: Prize }> {
    return this.http.post<{ success: boolean; prize: Prize }>(`${apiUrl}/prizes`, prize);
  }

  redeemPrize(prizeId: string, profileId: string): Observable<{ success: boolean; remainingStars: number }> {
    return this.http.post<{ success: boolean; remainingStars: number }>(`${apiUrl}/prizes/redeem`, {
      prizeId,
      profileId
    });
  }

  deletePrize(prizeId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${apiUrl}/prizes/${prizeId}`);
  }
}
