import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ProfileService, Profile, Task, TaskCatalogItem } from '../services/profile.service';
import { WebSocketService } from '../services/websocket.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-tasks-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks-hub.component.html',
  styleUrls: ['./tasks-hub.component.scss']
})
export class TasksHubComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private websocket = inject(WebSocketService);
  private destroy$ = new Subject<void>();

  profiles: Profile[] = [];
  catalogTasks: TaskCatalogItem[] = [];
  loading = false;
  showAddModal = false;
  showEditModal = false;
  editingTaskId: string | null = null;
  assignmentsByProfile: Map<string, Task[]> = new Map();

  newTask = {
    title: '',
    description: '',
    stars: 1,
    quantity: 1,
    frequency: null as number | null,
    frequencyUnit: 'days' as 'hours' | 'days' | 'weeks'
  };

  editTask = {
    title: '',
    description: '',
    stars: 1,
    quantity: 1,
    frequency: null as number | null,
    frequencyUnit: 'days' as 'hours' | 'days' | 'weeks'
  };

  ngOnInit() {
    this.loadProfiles();
    this.loadCatalogTasks();

    this.websocket.updates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message.scope === 'tasks') {
          this.loadCatalogTasks();
          this.loadAssignments();
        }
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

    this.profileService.getProfiles(user.id).subscribe({
      next: (response) => {
        this.profiles = response.profiles;
        this.loadAssignments();
      },
      error: (error) => {
        console.error('Error loading profiles:', error);
      }
    });
  }

  loadCatalogTasks() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.loading = true;
    this.profileService.getTaskCatalog(user.id).subscribe({
      next: (response) => {
        this.catalogTasks = response.tasks;
        this.loading = false;
        this.loadAssignments();
      },
      error: (error) => {
        console.error('Error loading task catalog:', error);
        this.loading = false;
      }
    });
  }

  loadAssignments() {
    if (this.profiles.length === 0) return;

    this.profiles.forEach(profile => {
      this.profileService.getTasks(profile.id).subscribe({
        next: (response) => {
          this.assignmentsByProfile.set(profile.id, response.tasks);
        },
        error: (error) => {
          console.error('Error loading assigned tasks:', error);
        }
      });
    });
  }

  openAddModal() {
    this.showAddModal = true;
    this.newTask = {
      title: '',
      description: '',
      stars: 1,
      quantity: 1,
      frequency: null,
      frequencyUnit: 'days'
    };
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  openEditModal(task: TaskCatalogItem) {
    this.showEditModal = true;
    this.editingTaskId = task.id;
    this.editTask = {
      title: task.title,
      description: task.description || '',
      stars: task.stars,
      quantity: task.quantity || 1,
      frequency: task.frequency ?? null,
      frequencyUnit: task.frequencyUnit || 'days'
    };
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingTaskId = null;
  }

  async addTask() {
    const user = this.authService.getCurrentUser();
    if (!user || !this.newTask.title) return;

    const pinVerified = await this.authService.requirePinFor('tasks:add');
    if (!pinVerified) return;

    this.loading = true;
    const taskData: any = {
      userId: user.id,
      title: this.newTask.title,
      description: this.newTask.description,
      stars: this.newTask.stars,
      quantity: this.newTask.quantity,
      frequencyUnit: this.newTask.frequencyUnit
    };
    if (this.newTask.frequency !== null) {
      taskData.frequency = this.newTask.frequency;
    }

    this.profileService.createTask(taskData).subscribe({
      next: (response) => {
        this.catalogTasks.push(response.task as TaskCatalogItem);
        this.closeAddModal();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error creating task:', error);
        this.loading = false;
      }
    });
  }

  async updateTask() {
    if (!this.editingTaskId || !this.editTask.title) return;

    const pinVerified = await this.authService.requirePinFor('tasks:edit');
    if (!pinVerified) return;

    const updates: any = {
      title: this.editTask.title,
      description: this.editTask.description,
      stars: this.editTask.stars,
      quantity: this.editTask.quantity,
      frequencyUnit: this.editTask.frequencyUnit
    };
    if (this.editTask.frequency !== null) {
      updates.frequency = this.editTask.frequency;
    } else {
      updates.frequency = null;
    }

    this.profileService.updateTask(this.editingTaskId, updates).subscribe({
      next: () => {
        this.catalogTasks = this.catalogTasks.map(task =>
          task.id === this.editingTaskId ? { ...task, ...updates } : task
        );
        this.closeEditModal();
      },
      error: (error) => {
        console.error('Error updating task:', error);
      }
    });
  }

  async deleteTask(taskId: string) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const pinVerified = await this.authService.requirePinFor('tasks:delete');
    if (!pinVerified) return;

    this.profileService.deleteTask(taskId).subscribe({
      next: () => {
        this.catalogTasks = this.catalogTasks.filter(task => task.id !== taskId);
      },
      error: (error) => {
        console.error('Error deleting task:', error);
      }
    });
  }

  async assignTaskToProfile(profileId: string, task: TaskCatalogItem) {
    const pending = this.getPendingAssignments(profileId, task.id);
    const available = this.getAvailableQuantity(task);
    if (pending > 0 || available <= 0) return;

    const pinVerified = await this.authService.requirePinFor('tasks:assign');
    if (!pinVerified) return;

    this.profileService.assignTask(profileId, task.id).subscribe({
      next: () => {
        this.profileService.getTasks(profileId).subscribe({
          next: (response) => {
            this.assignmentsByProfile.set(profileId, response.tasks);
          },
          error: (error) => {
            console.error('Error loading assigned tasks:', error);
          }
        });
      },
      error: (error) => {
        console.error('Error assigning task:', error);
      }
    });
  }

  getAssignments(profileId: string): Task[] {
    return this.assignmentsByProfile.get(profileId) || [];
  }

  getPendingAssignments(profileId: string, taskId: string): number {
    return this.getAssignments(profileId).filter(task => task.taskId === taskId && !task.completed).length;
  }

  getTotalPendingAssignments(taskId: string): number {
    let count = 0;
    this.assignmentsByProfile.forEach(tasks => {
      count += tasks.filter(task => task.taskId === taskId && !task.completed).length;
    });
    return count;
  }

  getAvailableQuantity(task: TaskCatalogItem): number {
    const quantity = Number.isFinite(Number(task.quantity)) ? Number(task.quantity) : 1;
    return Math.max(0, quantity - this.getTotalPendingAssignments(task.id));
  }

  isTaskAvailableForProfile(profileId: string, task: TaskCatalogItem): boolean {
    return this.getAvailableQuantity(task) > 0 && this.getPendingAssignments(profileId, task.id) === 0;
  }
}
