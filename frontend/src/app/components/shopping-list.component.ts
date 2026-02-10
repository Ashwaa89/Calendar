import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { MealService, ShoppingItem } from '../services/meal.service';
import { WebSocketService } from '../services/websocket.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss']
})
export class ShoppingListComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private mealService = inject(MealService);
  private websocket = inject(WebSocketService);
  private destroy$ = new Subject<void>();

  shoppingList: ShoppingItem[] = [];
  loading = false;
  showAddModal = false;
  shoppingDays = 7;

  newItem = {
    name: '',
    quantity: 1,
    unit: 'unit'
  };

  units = ['unit', 'kg', 'g', 'L', 'mL', 'cups', 'tbsp', 'tsp'];

  ngOnInit() {
    this.loadShoppingList();

    this.websocket.updates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message.scope === 'shopping') {
          this.loadShoppingList();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadShoppingList() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.loading = true;
    this.mealService.getAutoShoppingList(user.id, this.shoppingDays).subscribe({
      next: (response) => {
        this.shoppingList = response.items;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading shopping list:', error);
        this.loading = false;
      }
    });
  }

  refreshShoppingList() {
    this.loadShoppingList();
  }

  openAddModal() {
    this.showAddModal = true;
    this.newItem = {
      name: '',
      quantity: 1,
      unit: 'unit'
    };
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  async addItem() {
    const user = this.authService.getCurrentUser();
    if (!user || !this.newItem.name) return;

    const pinVerified = await this.authService.requirePinFor('shopping:manage');
    if (!pinVerified) return;

    this.loading = true;
    this.mealService.addToShoppingList({
      userId: user.id,
      name: this.newItem.name,
      quantity: this.newItem.quantity,
      unit: this.newItem.unit
    }).subscribe({
      next: (response) => {
        this.shoppingList.push(response.item);
        this.closeAddModal();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error adding to shopping list:', error);
        this.loading = false;
      }
    });
  }
}
