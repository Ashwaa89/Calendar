import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { CalendarService, GoogleCalendar, CalendarEvent, EventAssignment } from '../services/calendar.service';
import { ProfileService, Profile } from '../services/profile.service';
import { WebSocketService } from '../services/websocket.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private calendarService = inject(CalendarService);
  private profileService = inject(ProfileService);
  private websocket = inject(WebSocketService);
  private destroy$ = new Subject<void>();

  calendars: GoogleCalendar[] = [];
  selectedCalendars: Set<string> = new Set();
  calendarColors: Map<string, { backgroundColor?: string; foregroundColor?: string }> = new Map();
  events: CalendarEvent[] = [];
  profiles: Profile[] = [];
  profileFilters: Set<string> = new Set();
  eventAssignments: Map<string, string[]> = new Map();
  recurringAssignments: Map<string, string[]> = new Map();
  loading = false;
  currentDate = new Date();
  calendarDays: Date[] = [];
  showAssignModal = false;
  selectedEvent: CalendarEvent | null = null;
  selectedEventProfileIds: Set<string> = new Set();
  applyToSeries = false;
  searchQuery = '';
  lastTimeMin: string | null = null;
  lastTimeMax: string | null = null;

  ngOnInit() {
    this.generateCalendarDays();
    this.authService.user$.subscribe(user => {
      if (!user) return;
      this.loadProfiles();
      this.loadCalendars();
    });

    this.websocket.updates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message.scope === 'calendar') {
          this.loadCalendars();
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

  loadCalendars() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.loading = true;
    this.calendarService.getUserCalendars(user.id).subscribe({
      next: (response) => {
        this.calendars = response.calendars;
        const selected = Array.isArray(response.selectedCalendars)
          ? response.selectedCalendars
          : [];
        this.selectedCalendars = new Set(selected);

        this.calendarColors.clear();
        this.calendars.forEach(calendar => {
          this.calendarColors.set(calendar.id, {
            backgroundColor: calendar.backgroundColor,
            foregroundColor: calendar.foregroundColor
          });
        });

        if (this.selectedCalendars.size === 0) {
          this.loading = false;
          return;
        }

        this.loadEvents();
      },
      error: (error) => {
        console.error('Error loading calendars:', error);
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

  loadEvents() {
    const user = this.authService.getCurrentUser();
    if (!user || this.selectedCalendars.size === 0) return;

    const timeMin = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1).toISOString();
    const timeMax = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).toISOString();
    this.lastTimeMin = timeMin;
    this.lastTimeMax = timeMax;

    this.loading = true;
    this.calendarService.getCalendarEvents(user.id, Array.from(this.selectedCalendars), timeMin, timeMax).subscribe({
      next: (response) => {
        this.events = response.events;
        this.loadAssignments(timeMin, timeMax);
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.loading = false;
      }
    });
  }

  loadAssignments(timeMin: string, timeMax: string) {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.calendarService.getEventAssignments(user.id, timeMin, timeMax).subscribe({
      next: (response) => {
        this.eventAssignments.clear();
        this.recurringAssignments.clear();
        response.assignments.forEach((assignment: EventAssignment) => {
          if (assignment.applyToSeries && assignment.recurringEventId) {
            this.recurringAssignments.set(assignment.recurringEventId, assignment.profileIds || []);
          } else {
            const key = this.eventKey({ id: assignment.eventId, calendarId: assignment.calendarId } as CalendarEvent);
            this.eventAssignments.set(key, assignment.profileIds || []);
          }
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading event assignments:', error);
        this.loading = false;
      }
    });
  }

  generateCalendarDays() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    
    // Add days from previous month
    const startDay = firstDay.getDay();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add days from next month
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    this.calendarDays = days;
  }

  previousMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendarDays();
    this.loadEvents();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendarDays();
    this.loadEvents();
  }

  getEventsForDay(date: Date): CalendarEvent[] {
    return this.events.filter(event => {
      const eventDate = new Date(event.start.dateTime || event.start.date || '');
      return eventDate.toDateString() === date.toDateString();
    });
  }

  getFilteredEventsForDay(date: Date): CalendarEvent[] {
    return this.getEventsForDay(date).filter(event => {
      return this.eventMatchesProfileFilter(event) && this.eventMatchesSearch(event);
    });
  }

  eventMatchesSearch(event: CalendarEvent): boolean {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return true;
    const summary = (event.summary || '').toLowerCase();
    const description = (event.description || '').toLowerCase();
    return summary.includes(query) || description.includes(query);
  }

  clearSearch() {
    this.searchQuery = '';
  }

  getSearchResults(): CalendarEvent[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return [];
    const results = this.events.filter(event => {
      return this.eventMatchesSearch(event) && this.eventMatchesProfileFilter(event);
    });
    return results.sort((a, b) => {
      const aTime = new Date(a.start.dateTime || a.start.date || '').getTime();
      const bTime = new Date(b.start.dateTime || b.start.date || '').getTime();
      return aTime - bTime;
    });
  }

  formatEventDate(event: CalendarEvent): string {
    const raw = event.start.dateTime || event.start.date;
    if (!raw) return '';
    return new Date(raw).toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  formatEventClock(event: CalendarEvent): string {
    if (event.start.dateTime) {
      return new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return 'All day';
  }

  eventMatchesProfileFilter(event: CalendarEvent): boolean {
    if (this.profileFilters.size === 0) return true;
    const profileIds = this.getAssignedProfileIds(event);
    if (profileIds.length === 0) return false;
    return profileIds.some(id => this.profileFilters.has(id));
  }

  toggleProfileFilter(profileId: string) {
    if (this.profileFilters.has(profileId)) {
      this.profileFilters.delete(profileId);
    } else {
      this.profileFilters.add(profileId);
    }
  }

  clearProfileFilters() {
    this.profileFilters.clear();
  }

  openAssignModal(event: CalendarEvent) {
    this.selectedEvent = event;
    this.showAssignModal = true;
    const recurringIds = this.getRecurringAssignedProfileIds(event);
    this.applyToSeries = recurringIds.length > 0;
    const initialIds = this.applyToSeries ? recurringIds : this.getDirectAssignedProfileIds(event);
    this.selectedEventProfileIds = new Set(initialIds);
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.selectedEvent = null;
    this.selectedEventProfileIds.clear();
    this.applyToSeries = false;
  }

  setApplyToSeries(nextValue: boolean) {
    this.applyToSeries = nextValue;
    if (!this.selectedEvent) return;
    const ids = nextValue
      ? this.getRecurringAssignedProfileIds(this.selectedEvent)
      : this.getDirectAssignedProfileIds(this.selectedEvent);
    this.selectedEventProfileIds = new Set(ids);
  }

  toggleAssignProfile(profileId: string) {
    if (this.selectedEventProfileIds.has(profileId)) {
      this.selectedEventProfileIds.delete(profileId);
    } else {
      this.selectedEventProfileIds.add(profileId);
    }
  }

  async saveEventAssignment() {
    const user = this.authService.getCurrentUser();
    if (!user || !this.selectedEvent) return;

    const pinVerified = await this.authService.requirePinFor('calendar:assign');
    if (!pinVerified) return;

    const applySeries = this.applyToSeries && !!this.selectedEvent.recurringEventId;
    const payload = {
      eventId: this.selectedEvent.id,
      calendarId: this.selectedEvent.calendarId,
      recurringEventId: applySeries ? this.selectedEvent.recurringEventId : null,
      applyToSeries: applySeries,
      start: this.selectedEvent.start?.dateTime || this.selectedEvent.start?.date || null,
      end: this.selectedEvent.end?.dateTime || this.selectedEvent.end?.date || null,
      summary: this.selectedEvent.summary,
      profileIds: Array.from(this.selectedEventProfileIds)
    };

    this.calendarService.saveEventAssignment(user.id, payload).subscribe({
      next: () => {
        if (this.applyToSeries && payload.recurringEventId) {
          this.recurringAssignments.set(payload.recurringEventId, payload.profileIds);
        } else {
          const key = this.eventKey(this.selectedEvent as CalendarEvent);
          this.eventAssignments.set(key, payload.profileIds);
        }
        this.closeAssignModal();
      },
      error: (error) => {
        console.error('Error saving assignment:', error);
      }
    });
  }

  getAssignedProfileIds(event: CalendarEvent): string[] {
    const direct = this.getDirectAssignedProfileIds(event);
    const recurring = this.getRecurringAssignedProfileIds(event);
    return Array.from(new Set([...direct, ...recurring]));
  }

  getDirectAssignedProfileIds(event: CalendarEvent): string[] {
    const key = this.eventKey(event);
    return this.eventAssignments.get(key) || [];
  }

  getRecurringAssignedProfileIds(event: CalendarEvent): string[] {
    if (!event.recurringEventId) return [];
    return this.recurringAssignments.get(event.recurringEventId) || [];
  }

  getAssignedProfiles(event: CalendarEvent): Profile[] {
    const ids = this.getAssignedProfileIds(event);
    return this.profiles.filter(profile => ids.includes(profile.id));
  }

  getEventStyle(event: CalendarEvent): { [key: string]: string } {
    const colors = this.calendarColors.get(event.calendarId);
    if (!colors || (!colors.backgroundColor && !colors.foregroundColor)) {
      return {};
    }

    return {
      background: colors.backgroundColor || '#667eea',
      color: colors.foregroundColor || '#ffffff'
    };
  }

  getProfileColor(profile: Profile): string {
    return profile.color || '#667eea';
  }

  getProfilePillStyle(profile: Profile, selected: boolean): { [key: string]: string } {
    const color = this.getProfileColor(profile);
    return {
      borderColor: selected ? color : 'transparent',
      backgroundColor: selected ? `${color}22` : '#f7f7f7'
    };
  }

  getProfileAvatarStyle(profile: Profile): { [key: string]: string } {
    const color = this.getProfileColor(profile);
    return {
      backgroundColor: `${color}33`,
      borderColor: color
    };
  }

  private eventKey(event: CalendarEvent): string {
    return `${event.calendarId}|${event.id}`;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentDate.getMonth();
  }

  formatMonthYear(): string {
    return this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}
