import { Injectable } from '@angular/core';

export interface ThemeSettings {
  name: string;
  backgroundType: 'gradient' | 'solid';
  backgroundStart: string;
  backgroundEnd: string;
  backgroundAngle: number;
  panelBackground: string;
  cardBackground: string;
  sectionBackground: string;
  sectionText: string;
  sidebarBackground: string;
  headerText: string;
  bodyText: string;
  accent: string;
}

const DEFAULT_THEME: ThemeSettings = {
  name: 'Aurora',
  backgroundType: 'gradient',
  backgroundStart: '#667eea',
  backgroundEnd: '#764ba2',
  backgroundAngle: 135,
  panelBackground: '#ffffff',
  cardBackground: '#ffffff',
  sectionBackground: '#ffffff',
  sectionText: '#333333',
  sidebarBackground: 'rgba(255, 255, 255, 0.95)',
  headerText: '#333333',
  bodyText: '#666666',
  accent: '#667eea'
};

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  applyTheme(theme?: ThemeSettings) {
    const merged = { ...DEFAULT_THEME, ...(theme || {}) };
    const root = document.documentElement;

    const background = merged.backgroundType === 'solid'
      ? merged.backgroundStart
      : `linear-gradient(${merged.backgroundAngle}deg, ${merged.backgroundStart}, ${merged.backgroundEnd})`;

    root.style.setProperty('--app-bg', background);
    root.style.setProperty('--panel-bg', merged.panelBackground);
    root.style.setProperty('--card-bg', merged.cardBackground);
    root.style.setProperty('--section-bg', merged.sectionBackground);
    root.style.setProperty('--section-text', merged.sectionText);
    root.style.setProperty('--sidebar-bg', merged.sidebarBackground);
    root.style.setProperty('--header-text', merged.headerText);
    root.style.setProperty('--body-text', merged.bodyText);
    root.style.setProperty('--accent-color', merged.accent);

    localStorage.setItem('themeSettings', JSON.stringify(merged));
  }

  applyFromStorage() {
    const stored = localStorage.getItem('themeSettings');
    if (!stored) {
      this.applyTheme(DEFAULT_THEME);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      this.applyTheme(parsed);
    } catch {
      this.applyTheme(DEFAULT_THEME);
    }
  }

  getDefaultTheme(): ThemeSettings {
    return { ...DEFAULT_THEME };
  }
}
