
import { PlanID } from './plans';

export type Role = 'user' | 'model';

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // base64 string
  };
}

export interface ChatMessage {
  role: Role;
  parts: MessagePart[];
  groundingMetadata?: any;
}

export interface Task {
  id: number;
  text: string;
  completed: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  category?: string;
}

export type PlanDetails = {
  id: PlanID;
  billing: 'monthly' | 'annual';
};

export interface CourseCompletion {
  id: string;
  name: string;
  completedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  business: string;
  photo: string;
  role: 'admin' | 'user';
  credits: number;
  plan?: PlanDetails;
  
  // Context
  audience?: string;
  problem?: string;
  transformation?: string;
  motivation?: string;
  fear?: string;
  
  // Onboarding
  hasCompletedOnboarding?: boolean;

  // Mental Health / Best Friend Features
  confidenceVault?: string[];

  // Academy
  completedCourses?: CourseCompletion[];
}
