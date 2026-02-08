import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../../environments/firebase.config';

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  calendarId: string;
}

export interface EventAssignment {
  id: string;
  userId: string;
  eventId: string;
  calendarId: string;
  summary?: string;
  start?: string | null;
  end?: string | null;
  startDate?: string | null;
  profileIds: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private http = inject(HttpClient);

  getUserCalendars(userId: string): Observable<{ calendars: GoogleCalendar[] }> {
    return this.http.get<{ calendars: GoogleCalendar[] }>(`${apiUrl}/calendar/google-calendars/${userId}`);
  }

  getCalendarEvents(userId: string, calendarIds: string[], timeMin?: string, timeMax?: string): Observable<{ events: CalendarEvent[] }> {
    return this.http.post<{ events: CalendarEvent[] }>(`${apiUrl}/calendar/events/${userId}`, {
      calendarIds,
      timeMin,
      timeMax
    });
  }

  saveSelectedCalendars(userId: string, selectedCalendars: string[]): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${apiUrl}/calendar/save-selected/${userId}`, {
      selectedCalendars
    });
  }

  getEventAssignments(userId: string, timeMin?: string, timeMax?: string): Observable<{ assignments: EventAssignment[] }> {
    let url = `${apiUrl}/calendar/events/assignments/${userId}`;
    const params = new URLSearchParams();
    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);
    if (params.toString()) url += `?${params.toString()}`;

    return this.http.get<{ assignments: EventAssignment[] }>(url);
  }

  saveEventAssignment(userId: string, payload: {
    eventId: string;
    calendarId: string;
    start?: string | null;
    end?: string | null;
    summary?: string;
    profileIds: string[];
  }): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${apiUrl}/calendar/events/assignments/${userId}`, payload);
  }
}
