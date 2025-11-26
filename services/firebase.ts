import { PlanID } from '../plans';
import { ChatSession, Task, CourseCompletion } from '../types';

// --- Types ---
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  business: string;
  photo: string;
  role: 'admin' | 'user';
  credits: number;
  plan?: { id: PlanID; billing: 'monthly' | 'annual' };
  audience?: string;
  problem?: string;
  transformation?: string;
  motivation?: string;
  fear?: string;
  hasCompletedOnboarding?: boolean;
  confidenceVault?: string[];
  completedCourses?: CourseCompletion[];
}

export interface MediaAsset {
  id: string;
  userId: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  createdAt: string;
  meta?: any;
}

export interface SupportTicket {
    id: string;
    userId: string;
    userEmail: string;
    subject: string;
    message: string;
    status: 'open' | 'resolved';
    createdAt: string;
}

export interface MVPProject {
    id: string;
    name: string;
    style: string;
    font: string;
    chatHistory: { role: 'user' | 'model', text: string, image?: { base64: string, mimeType: string } }[];
    generatedCode: string | null;
    prdContent: string | null;
    updatedAt: string;
}

// --- Mock Data & Storage Helpers ---

const MOCK_DELAY = 500;

// Mock Auth Object
export const auth = {
    currentUser: null as any
};

// Dummy objects for exports that might be used elsewhere
export const db = {};
export const storage = {};

const getStorageData = <T>(key: string, defaultVal: T): T => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
};

const setStorageData = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// --- Auth Functions ---

let authObservers: ((user: any) => void)[] = [];

export const onAuthStateChanged = (authObj: any, callback: (user: any) => void) => {
    authObservers.push(callback);
    // Trigger immediately with current state
    const storedUser = localStorage.getItem('sb_auth_user');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        auth.currentUser = user;
        callback(user);
    } else {
        callback(null);
    }
    return () => {
        authObservers = authObservers.filter(obs => obs !== callback);
    };
};

const notifyAuthObservers = (user: any) => {
    auth.currentUser = user;
    if (user) {
        localStorage.setItem('sb_auth_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('sb_auth_user');
    }
    authObservers.forEach(cb => cb(user));
};

export const loginUser = async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    // Allow any login for demo, or check against stored users if we want to be stricter.
    // For simplicity, we'll treat email as the ID.
    const users = getStorageData<Record<string, UserProfile>>('sb_users', {});
    // Find user by email
    const userEntry = Object.values(users).find((u: any) => u.email === email);
    
    if (userEntry) {
        const mockUser = { uid: userEntry.uid, email: userEntry.email, displayName: userEntry.name, photoURL: userEntry.photo };
        notifyAuthObservers(mockUser);
        return { user: mockUser };
    } else {
        // Throw error to simulate real auth fail
        throw new Error("auth/user-not-found");
    }
};

export const registerUser = async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    const users = getStorageData<Record<string, UserProfile>>('sb_users', {});
    
    // Check if email exists
    if (Object.values(users).some((u: any) => u.email === email)) {
        throw new Error("auth/email-already-in-use");
    }

    const uid = 'user_' + Date.now();
    const mockUser = { uid, email, displayName: email.split('@')[0], photoURL: '' };
    
    // Create profile
    const newProfile: UserProfile = {
        uid,
        email,
        name: mockUser.displayName,
        business: '',
        photo: '',
        role: 'user',
        credits: 300,
        plan: { id: 'free', billing: 'monthly' },
        confidenceVault: [],
        completedCourses: []
    };
    
    users[uid] = newProfile;
    setStorageData('sb_users', users);
    
    notifyAuthObservers(mockUser);
    return { user: mockUser };
};

export const logoutUser = async () => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    notifyAuthObservers(null);
    window.location.href = '/';
};

export const resetPassword = async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    console.log(`Reset password email sent to ${email}`);
};

export const updatePassword = async (password: string) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    console.log("Password updated");
};

export const deleteAccount = async (uid: string) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    const users = getStorageData<Record<string, UserProfile>>('sb_users', {});
    delete users[uid];
    setStorageData('sb_users', users);
    notifyAuthObservers(null);
};

// --- Profile Functions ---

export const subscribeToProfile = (uid: string, callback: (profile: UserProfile) => void, onError?: (error: any) => void) => {
    // Polling for mock subscription
    const fetch = () => {
        const users = getStorageData<Record<string, UserProfile>>('sb_users', {});
        const profile = users[uid];
        if (profile) {
            callback(profile);
        } else {
            // Create default if missing (handling loose mock state)
             const defaultProfile: UserProfile = {
                uid,
                email: 'user@example.com',
                name: 'User',
                business: '',
                photo: '',
                role: 'user',
                credits: 300,
                plan: { id: 'free', billing: 'monthly' }
            };
            users[uid] = defaultProfile;
            setStorageData('sb_users', users);
            callback(defaultProfile);
        }
    };
    fetch();
    const interval = setInterval(fetch, 1000); // Mock real-time
    return () => clearInterval(interval);
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    // await new Promise(resolve => setTimeout(resolve, 200)); // Small delay
    const users = getStorageData<Record<string, UserProfile>>('sb_users', {});
    if (users[uid]) {
        users[uid] = { ...users[uid], ...data };
        setStorageData('sb_users', users);
    }
};

export const provisionUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const users = getStorageData<Record<string, UserProfile>>('sb_users', {});
    users[uid] = {
        uid,
        email: data.email || '',
        name: data.name || '',
        business: '',
        photo: '',
        role: data.role || 'user',
        credits: data.credits || 0,
        plan: data.plan || { id: 'free', billing: 'monthly' },
        ...data
    };
    setStorageData('sb_users', users);
};

export const subscribeToAllUsers = (onData: (users: UserProfile[]) => void, onError?: (error: Error) => void) => {
    const fetch = () => {
        const usersMap = getStorageData<Record<string, UserProfile>>('sb_users', {});
        onData(Object.values(usersMap));
    };
    fetch();
    const interval = setInterval(fetch, 2000);
    return () => clearInterval(interval);
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
    const usersMap = getStorageData<Record<string, UserProfile>>('sb_users', {});
    return Object.values(usersMap);
};

// --- Chat Functions ---

export const subscribeToChats = (uid: string, callback: (chats: ChatSession[]) => void, onError?: (error: any) => void) => {
    const fetch = () => {
        const allChats = getStorageData<Record<string, Record<string, ChatSession>>>('sb_chats', {});
        const userChats = allChats[uid] || {};
        const chatsList = Object.values(userChats).sort((a, b) => (b.id > a.id ? 1 : -1));
        callback(chatsList);
    };
    fetch();
    const interval = setInterval(fetch, 1000);
    return () => clearInterval(interval);
};

export const saveChatSession = async (uid: string, session: ChatSession) => {
    const allChats = getStorageData<Record<string, Record<string, ChatSession>>>('sb_chats', {});
    if (!allChats[uid]) allChats[uid] = {};
    allChats[uid][session.id] = session;
    setStorageData('sb_chats', allChats);
};

export const deleteChatSession = async (uid: string, sessionId: string) => {
    const allChats = getStorageData<Record<string, Record<string, ChatSession>>>('sb_chats', {});
    if (allChats[uid]) {
        delete allChats[uid][sessionId];
        setStorageData('sb_chats', allChats);
    }
};

// --- Task Functions ---

export const subscribeToTasks = (uid: string, callback: (tasks: Task[]) => void, onError?: (error: any) => void) => {
    const fetch = () => {
        const allTasks = getStorageData<Record<string, Task[]>>('sb_tasks', {});
        callback(allTasks[uid] || []);
    };
    fetch();
    const interval = setInterval(fetch, 1000);
    return () => clearInterval(interval);
};

export const saveTasks = async (uid: string, tasks: Task[]) => {
    const allTasks = getStorageData<Record<string, Task[]>>('sb_tasks', {});
    allTasks[uid] = tasks;
    setStorageData('sb_tasks', allTasks);
};

// --- Asset Functions ---

export const subscribeToAssets = (uid: string, callback: (assets: MediaAsset[]) => void, onError?: (error: any) => void) => {
    const fetch = () => {
        const allAssets = getStorageData<Record<string, MediaAsset[]>>('sb_assets', {});
        callback(allAssets[uid] || []);
    };
    fetch();
    const interval = setInterval(fetch, 1000);
    return () => clearInterval(interval);
};

export const saveAsset = async (uid: string, asset: MediaAsset) => {
    const allAssets = getStorageData<Record<string, MediaAsset[]>>('sb_assets', {});
    const userAssets = allAssets[uid] || [];
    userAssets.unshift(asset);
    allAssets[uid] = userAssets;
    setStorageData('sb_assets', allAssets);
};

export const deleteAsset = async (uid: string, assetId: string) => {
    const allAssets = getStorageData<Record<string, MediaAsset[]>>('sb_assets', {});
    if (allAssets[uid]) {
        allAssets[uid] = allAssets[uid].filter(a => a.id !== assetId);
        setStorageData('sb_assets', allAssets);
    }
};

// --- Support Ticket Functions ---

export const subscribeToSupportTickets = (callback: (tickets: SupportTicket[]) => void) => {
    const fetch = () => {
        const tickets = getStorageData<SupportTicket[]>('sb_tickets', []);
        callback(tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };
    fetch();
    const interval = setInterval(fetch, 2000);
    return () => clearInterval(interval);
};

export const submitSupportTicket = async (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    const tickets = getStorageData<SupportTicket[]>('sb_tickets', []);
    const newTicket: SupportTicket = {
        ...ticket,
        id: 'ticket_' + Date.now(),
        status: 'open',
        createdAt: new Date().toISOString()
    };
    tickets.push(newTicket);
    setStorageData('sb_tickets', tickets);
};

export const updateTicketStatus = async (id: string, status: 'open' | 'resolved') => {
    const tickets = getStorageData<SupportTicket[]>('sb_tickets', []);
    const index = tickets.findIndex(t => t.id === id);
    if (index !== -1) {
        tickets[index].status = status;
        setStorageData('sb_tickets', tickets);
    }
};

// --- MVP Project Functions ---

export const saveMVPProject = async (uid: string, project: MVPProject) => {
    const allProjects = getStorageData<Record<string, MVPProject[]>>('sb_projects', {});
    const userProjects = allProjects[uid] || [];
    const index = userProjects.findIndex(p => p.id === project.id);
    if (index !== -1) {
        userProjects[index] = project;
    } else {
        userProjects.unshift(project);
    }
    allProjects[uid] = userProjects;
    setStorageData('sb_projects', allProjects);
};

export const subscribeToMVPProjects = (uid: string, callback: (projects: MVPProject[]) => void, onError?: (error: any) => void) => {
    const fetch = () => {
        const allProjects = getStorageData<Record<string, MVPProject[]>>('sb_projects', {});
        callback(allProjects[uid] || []);
    };
    fetch();
    const interval = setInterval(fetch, 1000);
    return () => clearInterval(interval);
};

export const deleteMVPProject = async (uid: string, projectId: string) => {
    const allProjects = getStorageData<Record<string, MVPProject[]>>('sb_projects', {});
    if (allProjects[uid]) {
        allProjects[uid] = allProjects[uid].filter(p => p.id !== projectId);
        setStorageData('sb_projects', allProjects);
    }
};