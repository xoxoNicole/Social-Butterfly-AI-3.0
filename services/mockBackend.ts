
import { PlanID } from '../plans';

export interface User {
  email: string;
  password: string; // In a real app, this would be hashed
  role: 'admin' | 'user';
  plan: PlanID;
  name?: string;
  credits: number;
}

const DB_KEY = 'sb_users_db';

// Initial seed data
const INITIAL_USERS: Record<string, User> = {
  "nicole@themogulfactory.co": { 
    email: "nicole@themogulfactory.co",
    password: "adminaccess2!0", 
    role: 'admin', 
    plan: 'business',
    name: "Nicole",
    credits: 1000000
  },
  "inesha_faber@hotmail.com": { 
    email: "inesha_faber@hotmail.com",
    password: "temporaryPassword123", 
    role: 'user', 
    plan: 'pro',
    name: "Inesha Faber",
    credits: 4000
  }
};

class MockBackendService {
  private getUsers(): Record<string, User> {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize if empty
    localStorage.setItem(DB_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }

  private saveUsers(users: Record<string, User>) {
    localStorage.setItem(DB_KEY, JSON.stringify(users));
  }

  // --- Public API ---

  authenticate(email: string, password: string): User | null {
    const users = this.getUsers();
    const normalizedEmail = email.toLowerCase().trim();
    const user = users[normalizedEmail];
    
    if (user && user.password === password) {
      return user;
    }
    return null;
  }

  getUser(email: string): User | null {
    const users = this.getUsers();
    return users[email.toLowerCase().trim()] || null;
  }

  getAllUsers(): User[] {
    const users = this.getUsers();
    return Object.values(users);
  }

  updateUser(email: string, updates: Partial<User>): User {
    const users = this.getUsers();
    const normalizedEmail = email.toLowerCase().trim();
    
    if (!users[normalizedEmail]) {
      throw new Error("User not found");
    }

    // If changing email, we need to handle the key change
    if (updates.email && updates.email.toLowerCase() !== normalizedEmail) {
        const newEmail = updates.email.toLowerCase().trim();
        if (users[newEmail]) throw new Error("Email already in use");
        
        const user = { ...users[normalizedEmail], ...updates };
        delete users[normalizedEmail];
        users[newEmail] = user;
        this.saveUsers(users);
        return user;
    }

    users[normalizedEmail] = { ...users[normalizedEmail], ...updates };
    this.saveUsers(users);
    return users[normalizedEmail];
  }

  // Admin function to reset a user's password manually
  adminResetPassword(email: string, newPassword: string) {
    return this.updateUser(email, { password: newPassword });
  }
}

export const authService = new MockBackendService();
