export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  notes?: string;
  completed: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroceryList {
  id: string;
  name: string;
  items: GroceryItem[];
  ownerId: string;
  sharedWith?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type GroceryCategory = 
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'bakery'
  | 'pantry'
  | 'frozen'
  | 'beverages'
  | 'snacks'
  | 'other';
