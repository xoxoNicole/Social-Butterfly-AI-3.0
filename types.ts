export type Role = 'user' | 'model';

export interface ChatMessage {
  role: Role;
  parts: [{ text: string }];
}

export interface Task {
  id: number;
  text: string;
  completed: boolean;
}
