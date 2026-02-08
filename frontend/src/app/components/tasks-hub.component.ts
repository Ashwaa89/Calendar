import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ProfileService, Profile, Task, TaskCatalogItem } from '../services/profile.service';

@Component({
  selector: 'app-tasks-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks-hub.component.html',
  styleUrls: ['./tasks-hub.component.scss']
})
export class TasksHubComponent implements OnInit {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);

  profiles: Profile[] = [];
  catalogTasks: TaskCatalogItem[] = [];
  assignedTasks: Task[] = [];
  loading = false;
  showAssignModal = false;
  showAddModal = false;
  taskToAssign: TaskCatalogItem | null = null;
  modalProfileId = '';

  newTask = {
    title: '',
    description: '',
    stars: 1,
    frequency: null as number | null,
    frequencyUnit: 'days' as 'hours' | 'days' | 'weeks'
  };

  ngOnInit() {
    this.loadProfiles();
    this.loadCatalogTasks();
  }

  loadProfiles() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.profileService.getProfiles(user.id).subscribe({
      next: (response) => {
        this.profiles = response.profiles;
        if (!this.modalProfileId && this.profiles.length > 0) {
          this.modalProfileId = this.profiles[0].id;
        }
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
      },
      error: (error) => {
        console.error('Error loading task catalog:', error);
        this.loading = false;
      }
    });
  }

  loadAssignedTasks(profileId: string) {
    if (!profileId) return;

    this.profileService.getTasks(profileId).subscribe({
      next: (response) => {
        this.assignedTasks = response.tasks;
      },
      error: (error) => {
        console.error('Error loading assigned tasks:', error);
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
      frequencyUnit: 'days'
    };
  }

  closeAddModal() {
    this.showAddModal = false;
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

  openAssignModal(task: TaskCatalogItem) {
    this.taskToAssign = task;
    this.showAssignModal = true;
    if (!this.modalProfileId && this.profiles.length > 0) {
      this.modalProfileId = this.profiles[0].id;
    }
    if (this.modalProfileId) {
      this.loadAssignedTasks(this.modalProfileId);
    }
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.taskToAssign = null;
  }

  selectModalProfile(profileId: string) {
    this.modalProfileId = profileId;
    this.loadAssignedTasks(profileId);
  }

  confirmAssign() {
    if (!this.modalProfileId || !this.taskToAssign) return;

    this.profileService.assignTask(this.modalProfileId, this.taskToAssign.id).subscribe({
      next: () => {
        this.loadAssignedTasks(this.modalProfileId);
        this.closeAssignModal();
      },
      error: (error) => {
        console.error('Error assigning task:', error);
      }
    });
  }

  isAssigned(taskId: string): boolean {
    return this.assignedTasks.some(t => t.taskId === taskId);
  }
}
