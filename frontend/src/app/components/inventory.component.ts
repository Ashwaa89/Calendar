import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { MealService, InventoryItem } from '../services/meal.service';
import { WebSocketService } from '../services/websocket.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private mealService = inject(MealService);
  private websocket = inject(WebSocketService);
  private destroy$ = new Subject<void>();

  inventory: InventoryItem[] = [];
  loading = false;
  showAddModal = false;

  newItem = {
    name: '',
    quantity: 1,
    unit: 'unit',
    category: 'other',
    expiryDate: ''
  };

  categories = ['Dairy', 'Meat', 'Vegetables', 'Fruits', 'Grains', 'Snacks', 'Beverages', 'Other'];
  units = ['unit', 'kg', 'g', 'L', 'mL', 'cups', 'tbsp', 'tsp'];

  ngOnInit() {
    this.loadInventory();

    this.websocket.updates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message.scope === 'inventory') {
          this.loadInventory();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInventory() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.loading = true;
    this.mealService.getInventory(user.id).subscribe({
      next: (response) => {
        this.inventory = response.items;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading inventory:', error);
        this.loading = false;
      }
    });
  }

  openAddModal() {
    this.showAddModal = true;
    this.newItem = {
      name: '',
      quantity: 1,
      unit: 'unit',
      category: 'other',
      expiryDate: ''
    };
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  async addItem() {
    const user = this.authService.getCurrentUser();
    if (!user || !this.newItem.name) return;

    const pinVerified = await this.authService.requirePinFor('inventory:manage');
    if (!pinVerified) return;

    this.loading = true;

    this.mealService.addInventoryItem({
      userId: user.id,
      ...this.newItem
    }).subscribe({
      next: (response) => {
        this.inventory.push(response.item);
        this.closeAddModal();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error adding item:', error);
        this.loading = false;
      }
    });
  }

  async deleteInventoryItem(itemId: string) {
    if (!confirm('Delete this item?')) return;

    const pinVerified = await this.authService.requirePinFor('inventory:manage');
    if (!pinVerified) return;

    this.mealService.deleteInventoryItem(itemId).subscribe({
      next: () => {
        this.inventory = this.inventory.filter(i => i.id !== itemId);
      },
      error: (error) => {
        console.error('Error deleting item:', error);
      }
    });
  }

  getCategoryIcon(category: string): string {
    const icons: any = {
      'Dairy': '🥛',
      'Meat': '🥩',
      'Vegetables': '🥬',
      'Fruits': '🍎',
      'Grains': '🌾',
      'Snacks': '🍪',
      'Beverages': '🥤',
      'Other': '📦'
    };
    return icons[category] || '📦';
  }

  isExpiringSoon(item: InventoryItem): boolean {
    if (!item.expiryDate) return false;
    const daysUntilExpiry = Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
  }

  isExpired(item: InventoryItem): boolean {
    if (!item.expiryDate) return false;
    return new Date(item.expiryDate) < new Date();
  }
}
