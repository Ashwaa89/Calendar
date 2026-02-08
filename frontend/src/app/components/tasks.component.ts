import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileService, Task, Profile, TaskCatalogItem } from '../services/profile.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  profileId = '';
  profile: Profile | null = null;
  tasks: Task[] = [];
  catalogTasks: TaskCatalogItem[] = [];
  loading = false;
  showAddModal = false;
  showEditModal = false;
  editingTaskId: string | null = null;

  newTask = {
    title: '',
    description: '',
    stars: 1,
    frequency: null as number | null,
    frequencyUnit: 'days' as 'hours' | 'days' | 'weeks',
    assignToProfile: true
  };

  editTask = {
    title: '',
    description: '',
    stars: 1,
    frequency: null as number | null,
    frequencyUnit: 'days' as 'hours' | 'days' | 'weeks'
  };

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.profileId = params['profileId'];
      this.loadTasks();
    });
  }

  loadTasks() {
    if (!this.profileId) return;

    this.loading = true;
    this.profileService.getTasks(this.profileId).subscribe({
      next: (response) => {
        this.tasks = response.tasks.sort((a, b) => {
          const aAvailable = new Date(a.availableAt).getTime();
          const bAvailable = new Date(b.availableAt).getTime();
          const now = Date.now();
          return Math.abs(aAvailable - now) - Math.abs(bAvailable - now);
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading assigned tasks:', error);
        this.loading = false;
      }
    });

    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.profileService.getTaskCatalog(user.id).subscribe({
      next: (response) => {
        this.catalogTasks = response.tasks;
      },
      error: (error) => {
        console.error('Error loading task catalog:', error);
      }
    });
  }

  openAddModal() {
    this.showAddModal = true;
    this.newTask = {
      title: '',
      description: '',
      stars: 1,
      frequency: null,
      frequencyUnit: 'days',
      assignToProfile: true
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

    // Require PIN for adding tasks
    const pinVerified = await this.authService.promptForPin();
    if (!pinVerified) return;

    this.loading = true;
    const taskData: any = {
      userId: user.id,
      title: this.newTask.title,
      description: this.newTask.description,
      stars: this.newTask.stars,
      frequencyUnit: this.newTask.frequencyUnit
    };
    if (this.newTask.assignToProfile) {
      taskData.profileId = this.profileId;
    }
    if (this.newTask.frequency !== null) {
      taskData.frequency = this.newTask.frequency;
    }
    
    this.profileService.createTask(taskData).subscribe({
      next: (response) => {
        this.catalogTasks.push(response.task as TaskCatalogItem);
        if (this.newTask.assignToProfile) {
          this.loadTasks();
        }
        this.closeAddModal();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error creating task:', error);
        this.loading = false;
      }
    });
  }

  updateTask() {
    if (!this.editingTaskId || !this.editTask.title) return;

    const updates: any = {
      title: this.editTask.title,
      description: this.editTask.description,
      stars: this.editTask.stars,
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
        this.tasks = this.tasks.map(task =>
          task.taskId === this.editingTaskId ? { ...task, ...updates } : task
        );
        this.closeEditModal();
      },
      error: (error) => {
        console.error('Error updating task:', error);
      }
    });
  }

  async completeTask(task: Task) {
    if (!this.isTaskAvailable(task)) return;

    // Require PIN for completing tasks
    const pinVerified = await this.authService.promptForPin();
    if (!pinVerified) return;

    this.profileService.completeTask(task.id).subscribe({
      next: (response) => {
        alert(`Great job! Earned ${response.starsEarned} ⭐`);
        this.loadTasks();
      },
      error: (error) => {
        console.error('Error completing task:', error);
      }
    });
  }

  deleteTask(taskId: string) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    this.profileService.deleteTask(taskId).subscribe({
      next: () => {
        this.catalogTasks = this.catalogTasks.filter(t => t.id !== taskId);
        this.tasks = this.tasks.filter(t => t.taskId !== taskId);
      },
      error: (error) => {
        console.error('Error deleting task:', error);
      }
    });
  }

  assignTask(task: TaskCatalogItem) {
    this.profileService.assignTask(this.profileId, task.id).subscribe({
      next: () => this.loadTasks(),
      error: (error) => {
        console.error('Error assigning task:', error);
      }
    });
  }

  unassignTask(task: Task) {
    this.profileService.unassignTask(task.id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(t => t.id !== task.id);
      },
      error: (error) => {
        console.error('Error removing task from profile:', error);
      }
    });
  }

  isAssigned(taskId: string): boolean {
    return this.tasks.some(t => t.taskId === taskId);
  }

  isTaskAvailable(task: Task): boolean {
    return new Date(task.availableAt) <= new Date();
  }

  getTimeUntilAvailable(task: Task): string {
    const now = new Date();
    const available = new Date(task.availableAt);
    const diff = available.getTime() - now.getTime();

    if (diff <= 0) return 'Available now';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `Available in ${days} day${days > 1 ? 's' : ''}`;
    return `Available in ${hours} hour${hours > 1 ? 's' : ''}`;
  }

  goBack() {
    this.router.navigate(['/profiles']);
  }
}
