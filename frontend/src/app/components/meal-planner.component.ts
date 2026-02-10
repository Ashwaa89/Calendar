import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { MealService, Meal, Ingredient } from '../services/meal.service';
import { WebSocketService } from '../services/websocket.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-meal-planner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meal-planner.component.html',
  styleUrls: ['./meal-planner.component.scss']
})
export class MealPlannerComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private mealService = inject(MealService);
  private websocket = inject(WebSocketService);
  private destroy$ = new Subject<void>();

  meals: Meal[] = [];
  loading = false;
  showAddModal = false;
  currentDate = new Date();
  weekDays: Date[] = [];

  newMeal = {
    date: '',
    mealType: 'dinner' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    title: '',
    recipe: '',
    ingredients: [] as Ingredient[]
  };

  newIngredient: Ingredient = {
    name: '',
    quantity: 1,
    unit: 'unit'
  };

  ingredientUnits = ['unit', 'kg', 'g', 'L', 'mL', 'cups', 'tbsp', 'tsp'];

  mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: '🍳' },
    { value: 'lunch', label: 'Lunch', icon: '🥗' },
    { value: 'dinner', label: 'Dinner', icon: '🍽️' },
    { value: 'snack', label: 'Snack', icon: '🍪' }
  ];

  ngOnInit() {
    this.generateWeekDays();
    this.loadMeals();

    this.websocket.updates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message.scope === 'meals') {
          this.loadMeals();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  generateWeekDays() {
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      this.weekDays.push(day);
    }
  }

  loadMeals() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const startDate = this.weekDays[0].toISOString().split('T')[0];
    const endDate = this.weekDays[6].toISOString().split('T')[0];

    this.loading = true;
    this.mealService.getMeals(user.id, startDate, endDate).subscribe({
      next: (response) => {
        this.meals = response.meals;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading meals:', error);
        this.loading = false;
      }
    });
  }

  previousWeek() {
    this.currentDate.setDate(this.currentDate.getDate() - 7);
    this.generateWeekDays();
    this.loadMeals();
  }

  nextWeek() {
    this.currentDate.setDate(this.currentDate.getDate() + 7);
    this.generateWeekDays();
    this.loadMeals();
  }

  openAddModal(date: Date, mealType: string) {
    this.showAddModal = true;
    this.newMeal = {
      date: date.toISOString().split('T')[0],
      mealType: mealType as any,
      title: '',
      recipe: '',
      ingredients: []
    };
    this.newIngredient = { name: '', quantity: 1, unit: 'unit' };
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  async addMeal() {
    const user = this.authService.getCurrentUser();
    if (!user || !this.newMeal.title) return;

    const pinVerified = await this.authService.requirePinFor('meals:manage');
    if (!pinVerified) return;

    this.loading = true;
    this.mealService.createMeal({
      userId: user.id,
      ...this.newMeal
    }).subscribe({
      next: (response) => {
        this.meals.push(response.meal);
        this.closeAddModal();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error creating meal:', error);
        this.loading = false;
      }
    });
  }

  addIngredient() {
    if (!this.newIngredient.name) return;

    this.newMeal.ingredients.push({
      name: this.newIngredient.name.trim(),
      quantity: this.newIngredient.quantity || 1,
      unit: this.newIngredient.unit || 'unit'
    });

    this.newIngredient = { name: '', quantity: 1, unit: 'unit' };
  }

  removeIngredient(index: number) {
    this.newMeal.ingredients.splice(index, 1);
  }

  async deleteMeal(mealId: string) {
    if (!confirm('Delete this meal?')) return;

    const pinVerified = await this.authService.requirePinFor('meals:manage');
    if (!pinVerified) return;

    this.mealService.deleteMeal(mealId).subscribe({
      next: () => {
        this.meals = this.meals.filter(m => m.id !== mealId);
      },
      error: (error) => {
        console.error('Error deleting meal:', error);
      }
    });
  }

  getMealsForDay(date: Date, mealType: string): Meal[] {
    const dateStr = date.toISOString().split('T')[0];
    return this.meals.filter(m => m.date === dateStr && m.mealType === mealType);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  formatIngredients(meal: Meal): string {
    if (!meal.ingredients || meal.ingredients.length === 0) return '';
    return meal.ingredients.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ');
  }
}
