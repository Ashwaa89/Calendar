import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { CalendarService, GoogleCalendar } from '../services/calendar.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private calendarService = inject(CalendarService);

  calendars: GoogleCalendar[] = [];
  selectedCalendars: Set<string> = new Set();
  loading = false;
  pinVerified = false;
  pinInput = '';

  ngOnInit() {
    // Settings are PIN-protected
  }

  async verifyPin() {
    if (this.pinInput === '1234') {
      this.pinVerified = true;
      this.loadCalendars();
    } else {
      alert('Incorrect PIN');
      this.pinInput = '';
    }
  }

  loadCalendars() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.loading = true;
    this.calendarService.getUserCalendars(user.id).subscribe({
      next: (response) => {
        this.calendars = response.calendars;
        // Load saved calendar selections
        const stored = localStorage.getItem('selectedCalendars');
        if (stored) {
          const ids = JSON.parse(stored);
          this.selectedCalendars = new Set(ids);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading calendars:', error);
        this.loading = false;
      }
    });
  }

  toggleCalendar(calendarId: string) {
    if (this.selectedCalendars.has(calendarId)) {
      this.selectedCalendars.delete(calendarId);
    } else {
      this.selectedCalendars.add(calendarId);
    }
    // Save selection to localStorage
    localStorage.setItem('selectedCalendars', JSON.stringify(Array.from(this.selectedCalendars)));
  }
}
