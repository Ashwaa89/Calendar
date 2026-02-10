import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { apiUrl } from '../../environments/firebase.config';
import { WebSocketService } from './websocket.service';

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
  quantity?: number;
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
  quantity?: number;
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
  private websocket = inject(WebSocketService);

  // Profiles
  getProfiles(userId: string): Observable<{ profiles: Profile[] }> {
    return this.http.get<{ profiles: Profile[] }>(`${apiUrl}/profiles/${userId}`);
  }

  createProfile(userId: string, profile: Partial<Profile>): Observable<{ success: boolean; profile: Profile }> {
    return this.http.post<{ success: boolean; profile: Profile }>(`${apiUrl}/profiles/${userId}`, profile)
      .pipe(tap(() => this.websocket.sendUpdate('profiles')));
  }

  updateProfile(profileId: string, updates: Partial<Profile>): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${apiUrl}/profiles/${profileId}`, updates)
      .pipe(tap(() => this.websocket.sendUpdate('profiles')));
  }

  deleteProfile(profileId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${apiUrl}/profiles/${profileId}`)
      .pipe(tap(() => this.websocket.sendUpdate('profiles')));
  }

  // Tasks
  getTasks(profileId: string): Observable<{ tasks: Task[] }> {
    return this.http.get<{ tasks: Task[] }>(`${apiUrl}/tasks/profile/${profileId}`);
  }

  getTaskCatalog(userId: string): Observable<{ tasks: TaskCatalogItem[] }> {
    return this.http.get<{ tasks: TaskCatalogItem[] }>(`${apiUrl}/tasks/catalog/${userId}`);
  }

  createTask(task: Partial<TaskCatalogItem> & { userId: string; profileId?: string }): Observable<{ success: boolean; task: TaskCatalogItem; assignment?: any }> {
    return this.http.post<{ success: boolean; task: TaskCatalogItem; assignment?: any }>(`${apiUrl}/tasks`, task)
      .pipe(tap(() => this.websocket.sendUpdate('tasks')));
  }

  assignTask(profileId: string, taskId: string): Observable<{ success: boolean; assignment: any }> {
    return this.http.post<{ success: boolean; assignment: any }>(`${apiUrl}/tasks/assign`, {
      profileId,
      taskId
    }).pipe(tap(() => this.websocket.sendUpdate('tasks')));
  }

  unassignTask(assignmentId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${apiUrl}/tasks/assign/${assignmentId}`)
      .pipe(tap(() => this.websocket.sendUpdate('tasks')));
  }

  completeTask(assignmentId: string): Observable<{ success: boolean; starsEarned: number }> {
    return this.http.post<{ success: boolean; starsEarned: number }>(`${apiUrl}/tasks/complete/${assignmentId}`, {})
      .pipe(tap(() => this.websocket.sendUpdate('tasks')));
  }

  updateTask(taskId: string, updates: Partial<Task>): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${apiUrl}/tasks/${taskId}`, updates)
      .pipe(tap(() => this.websocket.sendUpdate('tasks')));
  }

  deleteTask(taskId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${apiUrl}/tasks/${taskId}`)
      .pipe(tap(() => this.websocket.sendUpdate('tasks')));
  }

  // Prizes
  getPrizes(userId: string): Observable<{ prizes: Prize[] }> {
    return this.http.get<{ prizes: Prize[] }>(`${apiUrl}/prizes/${userId}`);
  }

  createPrize(prize: Partial<Prize>): Observable<{ success: boolean; prize: Prize }> {
    return this.http.post<{ success: boolean; prize: Prize }>(`${apiUrl}/prizes`, prize)
      .pipe(tap(() => this.websocket.sendUpdate('prizes')));
  }

  redeemPrize(prizeId: string, profileId: string): Observable<{ success: boolean; remainingStars: number }> {
    return this.http.post<{ success: boolean; remainingStars: number }>(`${apiUrl}/prizes/redeem`, {
      prizeId,
      profileId
    }).pipe(tap(() => {
      this.websocket.sendUpdate('prizes');
      this.websocket.sendUpdate('profiles');
    }));
  }

  deletePrize(prizeId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${apiUrl}/prizes/${prizeId}`)
      .pipe(tap(() => this.websocket.sendUpdate('prizes')));
  }
}
