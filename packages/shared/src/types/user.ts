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
