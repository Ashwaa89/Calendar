import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../../environments/firebase.config';

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Meal {
  id: string;
  userId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  recipe: string;
  ingredients: Ingredient[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  userId: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingItem {
  id: string;
  userId: string;
  name: string;
  quantity: number;
  unit: string;
  purchased: boolean;
  createdAt: string;
  source?: 'auto' | 'manual' | 'mixed';
}

@Injectable({
  providedIn: 'root'
})
export class MealService {
  private http = inject(HttpClient);

  // Meal Planning
  getMeals(userId: string, startDate?: string, endDate?: string): Observable<{ meals: Meal[] }> {
    let url = `${apiUrl}/meals/${userId}`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    
    return this.http.get<{ meals: Meal[] }>(url);
  }

  createMeal(meal: Partial<Meal>): Observable<{ success: boolean; meal: Meal }> {
    return this.http.post<{ success: boolean; meal: Meal }>(`${apiUrl}/meals`, meal);
  }

  updateMeal(mealId: string, updates: Partial<Meal>): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${apiUrl}/meals/${mealId}`, updates);
  }

  deleteMeal(mealId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${apiUrl}/meals/${mealId}`);
  }

  // Inventory
  getInventory(userId: string): Observable<{ items: InventoryItem[] }> {
    return this.http.get<{ items: InventoryItem[] }>(`${apiUrl}/inventory/${userId}`);
  }

  addInventoryItem(item: Partial<InventoryItem>): Observable<{ success: boolean; item: InventoryItem }> {
    return this.http.post<{ success: boolean; item: InventoryItem }>(`${apiUrl}/inventory`, item);
  }

  updateInventoryItem(itemId: string, updates: Partial<InventoryItem>): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${apiUrl}/inventory/${itemId}`, updates);
  }

  deleteInventoryItem(itemId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${apiUrl}/inventory/${itemId}`);
  }

  // Shopping List
  getShoppingList(userId: string): Observable<{ items: ShoppingItem[] }> {
    return this.http.get<{ items: ShoppingItem[] }>(`${apiUrl}/inventory/shopping/${userId}`);
  }

  getAutoShoppingList(userId: string, days = 7): Observable<{ items: ShoppingItem[] }> {
    return this.http.get<{ items: ShoppingItem[] }>(`${apiUrl}/inventory/shopping/auto/${userId}?days=${days}`);
  }

  addToShoppingList(item: Partial<ShoppingItem>): Observable<{ success: boolean; item: ShoppingItem }> {
    return this.http.post<{ success: boolean; item: ShoppingItem }>(`${apiUrl}/inventory/shopping`, item);
  }
}
