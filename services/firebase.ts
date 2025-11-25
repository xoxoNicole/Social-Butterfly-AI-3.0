
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  deleteUser,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit,
  getDocs
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadString, 
  getDownloadURL
} from 'firebase/storage';
import { PlanID } from '../plans';
import { ChatSession, Task, CourseCompletion } from '../types';

// --- Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDHMRg2vRDykjWisoSMgZqeQnLKj8ZvQ9s",
  authDomain: "social-butterfly-ai.firebaseapp.com",
  projectId: "social-butterfly-ai",
  storageBucket: "social-butterfly-ai.firebasestorage.app",
  messagingSenderId: "931377239111",
  appId: "1:931377239111:web:0cdb11b3a2374af2b00d62"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

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

// --- Auth Functions ---

export const loginUser = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const registerUser = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create initial profile
    const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || email.split('@')[0],
        business: '',
        photo: '',
        role: 'user',
        credits: 300, // Starting credits set to 300 for Free Trial
        plan: { id: 'free', billing: 'monthly' },
        confidenceVault: [],
        completedCourses: []
    };
    
    await setDoc(doc(db, 'users', user.uid), newProfile);
    return userCredential;
};

export const logoutUser = async () => {
    await signOut(auth);
    // Optional: Refresh to clear any in-memory states if necessary
    window.location.reload();
};

export const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
};

export const updatePassword = async (password: string) => {
    if (auth.currentUser) {
        await firebaseUpdatePassword(auth.currentUser, password);
    } else {
        throw new Error("No authenticated user found.");
    }
};

export const deleteAccount = async (uid: string) => {
    // 1. Delete user document from Firestore
    await deleteDoc(doc(db, 'users', uid));
    
    // 2. Delete user from Auth
    if (auth.currentUser) {
        await deleteUser(auth.currentUser);
    }
};

// --- Profile Functions ---

export const subscribeToProfile = (uid: string, callback: (profile: UserProfile) => void) => {
    const userRef = doc(db, 'users', uid);
    return onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data() as UserProfile);
        } else {
            // If profile doesn't exist in Firestore (e.g. created via Console or legacy), create it now
            // This ensures the user appears in the User Manager list
            const email = auth.currentUser?.email || '';
            const name = auth.currentUser?.displayName || email.split('@')[0] || 'User';
            
            const newProfile: UserProfile = {
                uid: uid,
                email: email,
                name: name,
                business: '',
                photo: auth.currentUser?.photoURL || '',
                role: 'user',
                credits: 300, // Default credits set to 300 for Free Trial
                plan: { id: 'free', billing: 'monthly' },
                confidenceVault: [],
                completedCourses: []
            };
            
            // Write to DB asynchronously so we don't block the UI
            setDoc(userRef, newProfile).catch(err => console.error("Error auto-creating profile:", err));
            
            // Return optimistic result
            callback(newProfile);
        }
    }, (error) => {
        console.error("Error fetching profile:", error);
    });
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, data, { merge: true });
};

/**
 * Manually provisions a user profile in Firestore.
 * Useful for admins to set up users who exist in Auth but haven't logged in yet,
 * or to pre-load credits.
 */
export const provisionUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', uid);
    // Use setDoc with merge: true to create or update
    // We allow role overrides here so Admin Dashboard can promote users
    await setDoc(userRef, {
        uid,
        ...data
    }, { merge: true });
};

// Real-Time Listener for the Admin Console
export const subscribeToAllUsers = (onData: (users: UserProfile[]) => void, onError?: (error: Error) => void) => {
    const usersRef = collection(db, 'users');
    // Sort by email for consistency. Limit to 50 to avoid excessive reads.
    const q = query(usersRef, orderBy('email'), limit(50));
    
    return onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => doc.data() as UserProfile);
        onData(users);
    }, (error) => {
        // Pass error to caller so UI can show "Permission Denied"
        if (onError) {
            onError(error);
        } else {
            console.error("Error subscribing to users:", error);
            onData([]);
        }
    });
};

// Fallback if needed, but prefer subscribeToAllUsers
export const getAllUsers = async (): Promise<UserProfile[]> => {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
};

// --- Chat Functions ---

export const subscribeToChats = (uid: string, callback: (chats: ChatSession[]) => void) => {
    const chatsRef = collection(db, 'users', uid, 'chats');
    return onSnapshot(chatsRef, (snapshot) => {
        const chats = snapshot.docs.map(doc => doc.data() as ChatSession);
        // Client side sort by ID (using timestamp based IDs) descending
        chats.sort((a, b) => (b.id > a.id ? 1 : -1)); 
        callback(chats);
    });
};

export const saveChatSession = async (uid: string, session: ChatSession) => {
    const chatRef = doc(db, 'users', uid, 'chats', session.id);
    await setDoc(chatRef, session);
};

export const deleteChatSession = async (uid: string, sessionId: string) => {
    const chatRef = doc(db, 'users', uid, 'chats', sessionId);
    await deleteDoc(chatRef);
};

// --- Task Functions ---

export const subscribeToTasks = (uid: string, callback: (tasks: Task[]) => void) => {
    const listDocRef = doc(db, 'users', uid, 'data', 'tasksList');
    return onSnapshot(listDocRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data().items || []);
        } else {
            callback([]);
        }
    });
};

export const saveTasks = async (uid: string, tasks: Task[]) => {
    const listDocRef = doc(db, 'users', uid, 'data', 'tasksList');
    await setDoc(listDocRef, { items: tasks });
};

// --- Asset Functions ---

export const subscribeToAssets = (uid: string, callback: (assets: MediaAsset[]) => void) => {
    const assetsRef = collection(db, 'users', uid, 'assets');
    const q = query(assetsRef, orderBy('createdAt', 'desc'), limit(20));
    return onSnapshot(q, (snapshot) => {
        const assets = snapshot.docs.map(doc => doc.data() as MediaAsset);
        callback(assets);
    });
};

export const saveAsset = async (uid: string, asset: MediaAsset) => {
    let finalUrl = asset.url;
    
    // If it's a base64 string, attempt to upload to Storage first to keep Firestore light
    if (asset.url.startsWith('data:')) {
        try {
            const storageRef = ref(storage, `users/${uid}/${asset.type}s/${asset.id}`);
            await uploadString(storageRef, asset.url, 'data_url');
            finalUrl = await getDownloadURL(storageRef);
        } catch (e) {
            console.error("Storage upload failed, saving Base64 directly to Firestore (fallback)", e);
        }
    }

    const assetToSave = { ...asset, url: finalUrl };
    const assetRef = doc(db, 'users', uid, 'assets', asset.id);
    await setDoc(assetRef, assetToSave);
};

export const deleteAsset = async (uid: string, assetId: string) => {
    const assetRef = doc(db, 'users', uid, 'assets', assetId);
    await deleteDoc(assetRef);
};

// --- Support Ticket Functions ---

export const subscribeToSupportTickets = (callback: (tickets: SupportTicket[]) => void) => {
    const ticketsRef = collection(db, 'tickets');
    const q = query(ticketsRef, orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
        const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket));
        callback(tickets);
    }, (error) => {
        // Silent fail for non-admins (UI handles role checks, but rules enforce it)
        console.warn("Ticket subscription error (likely permission denied):", error);
    });
};

export const submitSupportTicket = async (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) => {
    const ticketsRef = collection(db, 'tickets');
    await addDoc(ticketsRef, {
        ...ticket,
        status: 'open',
        createdAt: new Date().toISOString()
    });
};

export const updateTicketStatus = async (id: string, status: 'open' | 'resolved') => {
    const ticketRef = doc(db, 'tickets', id);
    await updateDoc(ticketRef, { status });
};
