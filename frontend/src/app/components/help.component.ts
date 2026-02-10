import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface HelpSection {
  title: string;
  icon: string;
  description: string;
  bullets: string[];
}

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent {
  sections: HelpSection[] = [
    {
      title: 'Overview',
      icon: '✨',
      description: 'Your daily hub for profiles, stars, tasks, and events.',
      bullets: [
        'Expand a profile to see assigned tasks and events.',
        'Smile chart reflects recent star progress.'
      ]
    },
    {
      title: 'Calendar',
      icon: '📅',
      description: 'Sync and assign Google Calendar events to profiles.',
      bullets: [
        'Search events using the header search field.',
        'Assign events to profiles or entire recurring series.'
      ]
    },
    {
      title: 'Tasks',
      icon: '✅',
      description: 'Create reusable tasks and assign them with quantities.',
      bullets: [
        'Track stars earned when tasks are completed.',
        'Assign tasks per profile or from the hub.'
      ]
    },
    {
      title: 'Rewards',
      icon: '🏆',
      description: 'Create prize goals and redeem with stars.',
      bullets: [
        'Set star costs and icons for rewards.',
        'Redeem prizes on the Rewards page.'
      ]
    },
    {
      title: 'Meal Planner',
      icon: '🍽️',
      description: 'Plan meals and track ingredients for the week.',
      bullets: [
        'Add ingredients to keep shopping aligned.',
        'Switch weeks to plan ahead.'
      ]
    },
    {
      title: 'Inventory & Shopping',
      icon: '🛒',
      description: 'Track pantry items and build shopping lists.',
      bullets: [
        'Add or remove inventory items quickly.',
        'Auto shopping list aggregates needed items.'
      ]
    },
    {
      title: 'Themes & Layout',
      icon: '🎨',
      description: 'Customize colors, gradients, and section styles.',
      bullets: [
        'Pick a preset or craft a custom palette.',
        'Use Navigation settings to hide sections.'
      ]
    },
    {
      title: 'Security',
      icon: '🔐',
      description: 'Control which actions require a PIN and auto-lock.',
      bullets: [
        'Unlock globally for a set time.',
        'Choose actions that need a PIN.'
      ]
    }
  ];
}
