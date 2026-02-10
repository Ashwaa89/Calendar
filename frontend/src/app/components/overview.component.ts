import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ProfileService, Profile, Task } from '../services/profile.service';
import { CalendarService, CalendarEvent, EventAssignment } from '../services/calendar.service';
import { WebSocketService } from '../services/websocket.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private calendarService = inject(CalendarService);
  private websocket = inject(WebSocketService);
  private destroy$ = new Subject<void>();

  profiles: Profile[] = [];
  events: CalendarEvent[] = [];
  taskAssignments: Map<string, Task[]> = new Map();
  eventAssignments: Map<string, EventAssignment[]> = new Map();
  expandedProfiles: Set<string> = new Set();
  loadingProfiles = false;
  loadingEvents = false;
  loadingAssignments = false;
  selectedCalendars: string[] = [];

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      if (!user) return;
      this.loadProfiles(user.id);
      this.loadSelectedCalendars(user.id);
    });

    this.websocket.updates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        const user = this.authService.getCurrentUser();
        if (!user) return;

        if (message.scope === 'profiles') {
          this.loadProfiles(user.id);
        }
        if (message.scope === 'calendar') {
          this.loadSelectedCalendars(user.id);
        }
        if (message.scope === 'tasks') {
          this.loadProfileTasks();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProfiles(userId: string) {
    this.loadingProfiles = true;
    this.profileService.getProfiles(userId).subscribe({
      next: (response) => {
        this.profiles = response.profiles;
        this.loadingProfiles = false;
        this.loadProfileTasks();
        this.loadTodayAssignments();
      },
      error: (error) => {
        console.error('Error loading profiles:', error);
        this.loadingProfiles = false;
      }
    });
  }

  loadSelectedCalendars(userId: string) {
    this.loadingEvents = true;
    this.calendarService.getUserCalendars(userId).subscribe({
      next: (response) => {
        this.selectedCalendars = Array.isArray(response.selectedCalendars)
          ? response.selectedCalendars
          : [];
        this.loadTodayEvents(userId);
      },
      error: (error) => {
        console.error('Error loading calendars:', error);
        this.selectedCalendars = [];
        this.events = [];
        this.loadingEvents = false;
      }
    });
  }

  loadTodayEvents(userId: string) {
    if (this.selectedCalendars.length === 0) {
      this.events = [];
      this.loadingEvents = false;
      return;
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    this.calendarService.getCalendarEvents(userId, this.selectedCalendars, start.toISOString(), end.toISOString())
      .subscribe({
        next: (response) => {
          this.events = response.events.sort((a, b) => {
            const aTime = new Date(a.start.dateTime || a.start.date || '').getTime();
            const bTime = new Date(b.start.dateTime || b.start.date || '').getTime();
            return aTime - bTime;
          });
          this.loadTodayAssignments();
          this.loadingEvents = false;
        },
        error: (error) => {
          console.error('Error loading events:', error);
          this.loadingEvents = false;
        }
      });
  }

  loadProfileTasks() {
    if (this.profiles.length === 0) return;
    this.taskAssignments.clear();
    this.profiles.forEach(profile => {
      this.profileService.getTasks(profile.id).subscribe({
        next: (response) => {
          this.taskAssignments.set(profile.id, response.tasks || []);
        },
        error: (error) => {
          console.error('Error loading profile tasks:', error);
        }
      });
    });
  }

  loadTodayAssignments() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    this.loadingAssignments = true;
    this.calendarService.getEventAssignments(user.id, start.toISOString(), end.toISOString())
      .subscribe({
        next: (response) => {
          const directMap = new Map<string, string[]>();
          const recurringMap = new Map<string, string[]>();

          response.assignments.forEach(assignment => {
            if (assignment.applyToSeries && assignment.recurringEventId) {
              recurringMap.set(assignment.recurringEventId, assignment.profileIds || []);
              return;
            }
            const key = `${assignment.calendarId}|${assignment.eventId}`;
            directMap.set(key, assignment.profileIds || []);
          });

          const profileEventMap = new Map<string, EventAssignment[]>();
          this.events.forEach(event => {
            const key = `${event.calendarId}|${event.id}`;
            const direct = directMap.get(key) || [];
            const recurring = event.recurringEventId ? (recurringMap.get(event.recurringEventId) || []) : [];
            const profileIds = Array.from(new Set([...direct, ...recurring]));

            profileIds.forEach(profileId => {
              if (!profileEventMap.has(profileId)) {
                profileEventMap.set(profileId, []);
              }
              profileEventMap.get(profileId)!.push({
                id: `${key}__${profileId}`,
                userId: user.id,
                eventId: event.id,
                recurringEventId: event.recurringEventId || null,
                calendarId: event.calendarId,
                summary: event.summary,
                start: event.start?.dateTime || event.start?.date || null,
                end: event.end?.dateTime || event.end?.date || null,
                startDate: start.toISOString().split('T')[0],
                profileIds: [profileId],
                applyToSeries: !!event.recurringEventId && recurring.length > 0
              });
            });
          });

          profileEventMap.forEach(list => {
            list.sort((a, b) => new Date(a.start || '').getTime() - new Date(b.start || '').getTime());
          });
          this.eventAssignments = profileEventMap;
          this.loadingAssignments = false;
        },
        error: (error) => {
          console.error('Error loading event assignments:', error);
          this.loadingAssignments = false;
        }
      });
  }

  toggleProfile(profileId: string) {
    if (this.expandedProfiles.has(profileId)) {
      this.expandedProfiles.delete(profileId);
    } else {
      this.expandedProfiles.add(profileId);
    }
  }

  isProfileExpanded(profileId: string): boolean {
    return this.expandedProfiles.has(profileId);
  }

  getTasksForProfile(profileId: string): Task[] {
    const tasks = this.taskAssignments.get(profileId) || [];
    return tasks.filter(task => !task.completed);
  }

  getCompletedTasksForProfile(profileId: string): Task[] {
    const tasks = this.taskAssignments.get(profileId) || [];
    return tasks.filter(task => task.completed && task.lastCompletedAt);
  }

  getRecentCompletedTasks(profileId: string): Task[] {
    return this.getCompletedTasksForProfile(profileId)
      .sort((a, b) => new Date(b.lastCompletedAt || 0).getTime() - new Date(a.lastCompletedAt || 0).getTime())
      .slice(0, 3);
  }

  getEventsForProfile(profileId: string): EventAssignment[] {
    return this.eventAssignments.get(profileId) || [];
  }

  getSmileLevel(stars: number): number {
    if (!Number.isFinite(stars)) return 0;
    return Math.min(5, Math.max(0, Math.ceil(stars / 10)));
  }

  formatEventTime(event: CalendarEvent): string {
    if (event.start.dateTime) {
      return new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return 'All day';
  }
}
