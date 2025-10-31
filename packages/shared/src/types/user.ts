export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
}

export interface UserProfile extends User {
  preferences?: {
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
}

export interface FoodProfile {
  id: string;
  userID: string;
  displayName?: string; // Display name stored in Cosmos DB
  likes: string[];
  dislikes: string[];
  allergens: string[];
  restrictions: string[];
  createdAt: string;
  updatedAt: string;
}