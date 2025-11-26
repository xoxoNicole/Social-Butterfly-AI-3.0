import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Chat, LiveServerMessage, Modality, Blob as GenAIBlob, Part, FunctionDeclaration, Type, FunctionCall, Tool } from '@google/genai';
import { ChatMessage, Task, ChatSession, MessagePart, PlanDetails } from '../types';
import { generateSystemInstruction } from '../constants';
import { CREDIT_COSTS } from '../creditCosts';
import { getPlanDetails } from '../plans';
import Header from './Header';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import Dashboard, { DashboardAction } from './Dashboard';
import OnboardingModal from './OnboardingModal';
import TaskModal from './TaskModal';
import ProfileModal from './ProfileModal';
import GoToMarketPlanner, { GtmFormData } from './GoToMarketPlanner';
import ChatHistory from './ChatHistory';
import OnboardingQuestionnaire from './OnboardingQuestionnaire';
import ImageGenerationModal from './ImageGenerationModal';
import ImageEditingModal from './ImageEditingModal';
import VideoGenerationModal from './VideoGenerationModal';
import DocumentAnalysisModal from './DocumentAnalysisModal';
import VideoAnalysisModal, { VideoAnalysisMode } from './VideoAnalysisModal';
import ConfirmationModal from './ConfirmationModal';
import BuyCreditsModal from './BuyCreditsModal';
import ExportModal from './ExportModal';
import UpdatesModal from './UpdatesModal';
import AdminDashboard from './AdminDashboard';
import SanctuaryModal from './SanctuaryModal';
import AcademyModal, { PitchAnalysisResult, PromptGradingResult } from './AcademyModal';
import MVPBuilderModal from './MVPBuilderModal'; 
import { appUpdates } from '../updates';
import { downloadGeneratedFile } from '../utils/documentUtils';

// Use Mock Service Imports
import { subscribeToProfile, subscribeToChats, saveChatSession, updateUserProfile, deleteChatSession, UserProfile, subscribeToTasks, saveTasks, logoutUser, saveAsset, subscribeToSupportTickets } from '../services/firebase';

// Define a simple User interface since we removed Firebase SDK
interface SimpleUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

interface ChatPageProps {
  onGoHome: () => void;
  currentUser: SimpleUser; 
  initialProfile: UserProfile; 
  onLogout?: () => void; 
  onOpenSupport: () => void;
  onManageSubscription: () => void;
}

const MVP_STYLES: Record<string, string> = {
    modern: "Clean, high-whitespace, Inter font, blue/gray primary colors, soft shadows, rounded corners (Stripe/Apple aesthetic).",
    bold: "Dark mode, high contrast, neon accents (purple/fuchsia/cyan), brutalist typography, sharp edges.",
    editorial: "Serif headings (Playfair Display), large imagery, pastel or cream background, sophisticated grid, high-end magazine feel.",
    saas: "Bento grids, glassmorphism, gradients, dark mode option, feature-heavy, trustworthy blue/indigo, highly polished UI components.",
    minimal: "Monochrome, abundant whitespace, strict grid, heavy use of borders, no shadows, Helvetica/Arial vibes."
};

// Helper to generate a personalized welcome message.
const getWelcomeMessage = (profile: UserProfile) => {
  let firstName = 'Friend';
  if (profile.name && profile.name.trim() !== '' && profile.name.toLowerCase() !== 'user') {
      const rawName = profile.name.split(' ')[0];
      firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  }
  
  let text = `Hey ${firstName}! 👋 It is so good to have you here. `;

  if (profile.business && profile.business.trim() !== '') {
    text += `I'm ready to roll up my sleeves and help you with **${profile.business}**. What's on your mind today?`;
  } else {
    text += `I'm ready to roll up my sleeves and help you bring your God-given idea to life! What are we working on?`;
  }
  
  const isProfileComplete = profile.business && profile.audience;
  
  if (!isProfileComplete) {
     text += `\n\n(Quick tip from your biz bestie: I can give you *much* better strategy if you update your profile settings! Knowing exactly who you serve helps me tailor every answer to you. But no pressure—we can jump right in!)`;
  } else {
     text += `\n\nWhether you need a full strategy session, some creative content, or just a hype partner, I've got you. Let's make some magic happen! ✨`;
  }

  return { role: 'model', parts: [{ text }] } as ChatMessage;
};

// --- Utility Functions ---
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result !== 'string') {
                return reject(new Error('File could not be read as a string.'));
            }
            resolve(reader.result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): GenAIBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// STRICT Sanitization to fix ContentUnion error
const sanitizeParts = (parts: MessagePart[]): Part[] => {
    return parts.map(p => {
        if (p.text && p.text.trim().length > 0) {
            return { text: p.text };
        }
        if (p.inlineData && p.inlineData.data) {
            return { inlineData: p.inlineData };
        }
        return null;
    }).filter(p => p !== null) as Part[];
};

// Helper to clean history for API
const cleanHistory = (messages: ChatMessage[]) => {
  const cleaned: { role: string, parts: Part[] }[] = [];
  
  // Filter out messages that are purely UI placeholders (empty parts)
  const validMessages = messages.filter(m => m.parts.length > 0);

  for (const msg of validMessages) {
      // Ensure we map roles correctly (only 'user' or 'model' allowed in API history)
      const role = msg.role === 'user' ? 'user' : 'model';
      
      const parts = sanitizeParts(msg.parts);
      if (parts.length === 0) continue;

      // Logic to merge consecutive messages of the same role
      // The API throws 400 if we send [User, User, Model]
      if (cleaned.length > 0 && cleaned[cleaned.length - 1].role === role) {
          cleaned[cleaned.length - 1].parts.push(...parts);
      } else {
          cleaned.push({ role: role, parts: parts });
      }
  }
  
  // CRITICAL: The history passed to `chats.create` must NOT end with a User message, 
  // because the `sendMessage` call will add a new User message, causing a [User, User] conflict at the end.
  // We must ensure history ends with Model (or is empty).
  if (cleaned.length > 0 && cleaned[cleaned.length - 1].role === 'user') {
      cleaned.pop();
  }

  return cleaned;
}


const ChatPage: React.FC<ChatPageProps> = ({ onGoHome, currentUser, initialProfile, onLogout, onOpenSupport, onManageSubscription }) => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sidebar States
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Initialize desktop sidebar state based on screen width. Collapsed (false) on smaller screens (< 1280px) to save space.
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1280);

  const aiRef = useRef<GoogleGenAI | null>(null);
  const lastUploadedImageRef = useRef<{ base64: string, mimeType: string } | null>(null);
  
  // Data states
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ticketCount, setTicketCount] = useState(0);

  // Active Prompt State (for passing to modals)
  const [activePrompt, setActivePrompt] = useState<string>('');
  const [activeImage, setActiveImage] = useState<{ base64: string, mimeType: string } | undefined>(undefined);

  // Modals
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState<boolean>(false);
  const [showTasks, setShowTasks] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showGtmPlanner, setShowGtmPlanner] = useState<boolean>(false);
  const [showImageGeneration, setShowImageGeneration] = useState(false);
  const [showImageEditing, setShowImageEditing] = useState(false);
  const [showVideoGeneration, setShowVideoGeneration] = useState(false);
  const [showDocumentAnalysis, setShowDocumentAnalysis] = useState(false);
  const [showVideoAnalysis, setShowVideoAnalysis] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportContent, setExportContent] = useState<string | null>(null);
  const [showUpdates, setShowUpdates] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showSanctuary, setShowSanctuary] = useState(false);
  const [showAcademy, setShowAcademy] = useState(false);
  const [showMVPBuilder, setShowMVPBuilder] = useState(false);
  const [hasUnreadUpdates, setHasUnreadUpdates] = useState(false);

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    actionName: string;
    cost: number;
    remaining: number;
    onConfirm: () => void;
  } | null>(null);

  // Multimedia generation states
  const [imageGenerationResult, setImageGenerationResult] = useState<string | null>(null);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [imageEditingResult, setImageEditingResult] = useState<string | null>(null);
  const [isImageEditing, setIsImageEditing] = useState(false);
  const [videoGenerationMode, setVideoGenerationMode] = useState<'text' | 'image'>('text');
  const [videoGenerationResult, setVideoGenerationResult] = useState<string | null>(null);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoGenerationMessage, setVideoGenerationMessage] = useState('');

  // Voice Agent
  const [isListening, setIsListening] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [liveTranscription, setLiveTranscription] = useState({ user: '', model: ''});
  
  // Voice Session Refs
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  
  // Prevent race conditions between Firebase updates and Local Optimistic updates
  const isSendingRef = useRef(false);

  // Tool Definitions
  const generateDocumentTool: FunctionDeclaration = {
    name: 'generate_document',
    description: 'Generates a downloadable document file (PDF, CSV, DOCX, etc) with specific content. Use this when the user asks to create a document, spreadsheet, or file.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        content: { type: Type.STRING, description: "The full text content of the document. For CSV, provide comma-separated values." },
        format: { type: Type.STRING, description: "The file extension: 'pdf', 'csv', 'doc', 'txt', 'md', 'html'." },
        filename: { type: Type.STRING, description: "The name of the file e.g., 'marketing-plan'." },
      },
      required: ['content', 'format', 'filename'],
    },
  };
  const editImageTool: FunctionDeclaration = {
      name: 'edit_image',
      description: 'Edits the last uploaded image.',
      parameters: {
          type: Type.OBJECT,
          properties: { prompt: { type: Type.STRING } },
          required: ['prompt']
      }
  };
  const generateImageTool: FunctionDeclaration = {
      name: 'generate_image',
      description: 'Generates an image.',
      parameters: {
          type: Type.OBJECT,
          properties: { prompt: { type: Type.STRING } },
          required: ['prompt']
      }
  };

  // --- Initialization ---
  
  // 1. Init Gemini
  useEffect(() => {
    try {
      let apiKey = undefined;
      try {
         if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
             apiKey = process.env.API_KEY;
         }
      } catch (e) {
         // process is undefined or safe access failed
      }
      
      if (apiKey) {
          aiRef.current = new GoogleGenAI({ apiKey });
      } else {
          console.warn('API Key is missing in environment.');
      }
    } catch (e) {
      setError('Failed to initialize AI.');
    }
    
    return () => { if (sessionPromiseRef.current) stopVoiceSession(); };
  }, []);

  // 2. Subscribe to Mock Data
  useEffect(() => {
      const unsubscribeProfile = subscribeToProfile(currentUser.uid, (data) => {
          if (data) {
              setProfile(data);
              if (data.hasCompletedOnboarding === undefined) {
                  setShowProfile(true);
              }
          }
      });

      const unsubscribeChats = subscribeToChats(currentUser.uid, (sessions) => {
          // If we are sending, we rely on optimistic updates to prevent UI flicker/latency
          // We only block if we have "pending" changes that are newer than what DB has
          if (isSendingRef.current) return;

          if (sessions.length > 0) {
             setChatSessions(sessions);
             setActiveSessionId(current => {
                 const exists = sessions.find(s => s.id === current);
                 if (!current || !exists) return sessions[0].id;
                 return current;
             });
          } else {
             // Create default chat if none exist
             const newSession: ChatSession = {
                id: `${Date.now()}`,
                title: 'New Chat',
                messages: [getWelcomeMessage(initialProfile)],
                category: 'General' 
             };
             saveChatSession(currentUser.uid, newSession);
             setChatSessions([newSession]);
             setActiveSessionId(newSession.id);
          }
      });

      const unsubscribeTasks = subscribeToTasks(currentUser.uid, (fetchedTasks) => {
          setTasks(fetchedTasks);
      });
      
      const lastSeen = localStorage.getItem('last_update_seen');
      if (appUpdates.length > 0 && lastSeen !== appUpdates[0].id) {
          setHasUnreadUpdates(true);
      }

      return () => {
          unsubscribeProfile();
          unsubscribeChats();
          unsubscribeTasks();
      };
  }, [currentUser]);

  // Separate effect for Admin tickets to avoid permission errors for users
  useEffect(() => {
      if (profile?.role === 'admin') {
          const unsubscribe = subscribeToSupportTickets((tickets) => {
              setTicketCount(tickets.filter(t => t.status === 'open').length);
          });
          return () => unsubscribe();
      }
  }, [profile?.role]);

  // Auto-update the greeting for empty "New Chat" sessions when profile changes
  useEffect(() => {
    if (!activeSessionId || !profile) return;

    const currentSession = chatSessions.find(s => s.id === activeSessionId);
    
    if (currentSession && currentSession.title === 'New Chat' && currentSession.messages.length === 1 && currentSession.messages[0].role === 'model') {
        const freshGreetingMsg = getWelcomeMessage(profile);
        const currentText = currentSession.messages[0].parts[0].text;
        const freshText = freshGreetingMsg.parts[0].text;

        if (currentText !== freshText) {
            const updatedSession = {
                ...currentSession,
                messages: [freshGreetingMsg]
            };
            setChatSessions(prev => prev.map(s => s.id === activeSessionId ? updatedSession : s));
            saveChatSession(currentUser.uid, updatedSession);
        }
    }
  }, [profile, activeSessionId, chatSessions, currentUser.uid]);


  const handleSaveProfile = async (newProfileData: any) => {
      await updateUserProfile(currentUser.uid, newProfileData);
      setShowProfile(false);
      if (!profile.hasCompletedOnboarding && !profile.audience) {
          setShowQuestionnaire(true);
      }
  };

  const handleCompleteQuestionnaire = async (answers: Record<string, string>) => {
      await updateUserProfile(currentUser.uid, { ...answers });
      setShowQuestionnaire(false);
      setShowOnboarding(true);
  };

  const handleOnboardingFinish = async () => {
      await updateUserProfile(currentUser.uid, { hasCompletedOnboarding: true });
      setShowOnboarding(false);
  };

  const deductCredits = (cost: number) => {
      updateUserProfile(currentUser.uid, { credits: profile.credits - cost });
  };
  
  const refundCredits = (cost: number) => {
      updateUserProfile(currentUser.uid, { credits: profile.credits + cost });
  };

  // Sidebar Toggle Logic
  const handleToggleSidebar = () => {
      // Check if we are in mobile layout or desktop
      if (window.innerWidth >= 768) {
          setIsDesktopSidebarOpen(prev => !prev);
      } else {
          setIsMobileSidebarOpen(prev => !prev);
      }
  };

  // Chat Management
  const handleNewChat = (category: string = 'General') => {
      const newSession: ChatSession = {
          id: `${Date.now()}-${Math.random()}`,
          title: 'New Chat',
          messages: [getWelcomeMessage(profile)],
          category
      };
      setChatSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      saveChatSession(currentUser.uid, newSession);
      setIsMobileSidebarOpen(false);
      // On desktop, keep sidebar open if it was open, or maybe auto-open it?
      // For now, leave desktop state as is.
      return newSession;
  };

  const handleLogoClick = () => {
    setIsMobileSidebarOpen(false);
    const empty = chatSessions.find(s => s.messages.length <= 1);
    if (empty) {
        setActiveSessionId(empty.id);
    } else {
        handleNewChat();
    }
  };

  const handleDeleteSession = async (idToDelete: string) => {
      await deleteChatSession(currentUser.uid, idToDelete);
      if (activeSessionId === idToDelete) {
          setActiveSessionId(null);
      }
  };

  const handleLogout = async () => {
      if (onLogout) {
          onLogout();
      } else {
          // Fallback mechanism if prop is missing
          await logoutUser();
      }
  };

  // Task Management
  const handleAddTask = (text: string) => {
      const newTasks = [...tasks, { id: Date.now(), text, completed: false }];
      saveTasks(currentUser.uid, newTasks);
  };
  const handleToggleTask = (id: number) => {
      const newTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      saveTasks(currentUser.uid, newTasks);
  };
  const handleDeleteTask = (id: number) => {
      const newTasks = tasks.filter(t => t.id !== id);
      saveTasks(currentUser.uid, newTasks);
  };

  const handleExecuteFunctionCall = async (functionCall: FunctionCall) => {
      const { name, args } = functionCall;
      
      if (name === 'generate_document') {
          const { content, format, filename } = args as any;
          downloadGeneratedFile(content, filename || 'document', format || 'txt');
          return "Document generated and download started successfully.";
      }
      
      // Handle other tools if necessary
      return "Function executed.";
  };

  // --- Main Interaction Logic (SendMessage) ---
  const handleSendMessage = useCallback(async (userInput: string, image?: { base64: string, mimeType: string }, category?: string, toolId: string = 'auto') => {
    // If toolId is 'image' or 'video', we open the modal instead of chatting, passing the prompt
    if (toolId === 'image') {
        setActivePrompt(userInput); // Persist the input to the modal
        setShowImageGeneration(true);
        return;
    }
    if (toolId === 'video') {
        setActivePrompt(userInput); // Persist the input to the modal
        if (image) setActiveImage(image);
        setShowVideoGeneration(true);
        return;
    }

    if (isLoading || !aiRef.current) return;
    
    // Handle creating new chat vs using active
    let currentSessionId = activeSessionId;
    let currentSession = chatSessions.find(s => s.id === currentSessionId);

    // If we are "on dashboard" (messages <= 1) or no session, and we start typing, we are essentially starting a new flow
    if (!currentSession) {
        const newSession = handleNewChat(category || 'General');
        currentSessionId = newSession.id;
        currentSession = newSession;
    } else if (category && currentSession.messages.length <= 1) {
        // If we are in a fresh/empty chat but trigger a specific feature, update the category
        currentSession.category = category;
    }

    if(!currentSessionId || !currentSession) return;

    const cost = CREDIT_COSTS.CHAT_MESSAGE + (image ? CREDIT_COSTS.CHAT_IMAGE_ATTACHMENT : 0);
    if (profile.credits < cost) {
      setShowBuyCredits(true);
      return;
    }
    deductCredits(cost);

    if (image) lastUploadedImageRef.current = image;

    const userParts: MessagePart[] = [];
    if (image) userParts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });
    if (userInput) userParts.push({ text: userInput });
    
    const userMessage: ChatMessage = { role: 'user', parts: userParts };
    const modelPlaceholder: ChatMessage = { role: 'model', parts: [] };

    // OPTIMISTIC UPDATE: Update State IMMEDIATELY to prevent latency
    isSendingRef.current = true; // Lock incoming firebase sync
    
    const updatedMessages = [...currentSession.messages, userMessage, modelPlaceholder];
    const updatedSession: ChatSession = { 
        ...currentSession, 
        messages: updatedMessages,
        // Ensure category persists or updates
        category: category || currentSession.category || 'General'
    };

    if (currentSession.title === 'New Chat' && userInput) {
        updatedSession.title = userInput.substring(0, 30) + '...';
    }

    // Force update React state immediately so mobile sees the bubble
    setChatSessions(prev => {
        const index = prev.findIndex(s => s.id === currentSessionId);
        if (index === -1) return [updatedSession, ...prev];
        const newArr = [...prev];
        newArr[index] = updatedSession;
        return newArr;
    });
    
    // Save to DB in background
    saveChatSession(currentUser.uid, updatedSession).catch(err => console.error("Background save failed", err));

    setIsLoading(true);
    setError(null);

    try {
      // Clean history to prevent API errors (empty parts, non-alternating roles)
      const history = cleanHistory(currentSession.messages);
      
      const systemInstruction = generateSystemInstruction(profile as any);
      
      // Configure Tools based on User Selection
      let tools: Tool[] | undefined = undefined;
      
      // Heuristic: If in Auto mode, check if the user is explicitly asking to search/browse/find live info
      // This allows "Auto" to swap to Search mode dynamically without manual toggling
      const isSearchIntent = toolId === 'auto' && (
          /^(search|google|brows(e|ing)|find (latest|current|news|info)|what is the current|who (won|is)|price of|look up|research)/i.test(userInput) || 
          /(latest|recent) (news|stats|data|events|developments|trends)/i.test(userInput)
      ) && !/^(generate|create|make|draw|design)/i.test(userInput);

      if (toolId === 'web_search' || toolId === 'deep_research' || isSearchIntent) {
          tools = [{ googleSearch: {} }];
      } else {
          // Default / Auto mode uses Functions
          tools = [{ functionDeclarations: [generateDocumentTool, editImageTool, generateImageTool] }];
      }

      // STRICT DATA SANITIZATION FOR CURRENT MESSAGE
      const partsToSend = sanitizeParts(userParts);
      if (partsToSend.length === 0) {
          throw new Error("Cannot send empty message.");
      }

      const chat = aiRef.current.chats.create({
        model: 'gemini-2.5-flash', 
        config: { 
            systemInstruction,
            tools
        },
        history,
      });
      
      const stream = await chat.sendMessageStream({ message: partsToSend });
      
      let fullResponse = '';
      let firstChunk = true;
      let functionCalls: FunctionCall[] = [];
      let groundingMetadata: any = null;

      for await (const chunk of stream) {
        // Handle Text
        if (chunk.text) {
            fullResponse += chunk.text;
             setChatSessions(prev => prev.map(s => {
                if (s.id === currentSessionId) {
                    const newMessages = [...s.messages];
                    const lastMsgIndex = newMessages.length - 1;
                    const lastMsg = { ...newMessages[lastMsgIndex] }; 
                    
                    if (firstChunk) { 
                        lastMsg.parts = [{ text: fullResponse }]; 
                        firstChunk = false; 
                    } else { 
                        lastMsg.parts = [{ text: fullResponse }]; 
                    }
                    
                    if (groundingMetadata) lastMsg.groundingMetadata = groundingMetadata;

                    newMessages[lastMsgIndex] = lastMsg;
                    return { ...s, messages: newMessages };
                }
                return s;
            }));
        }

        // Handle Grounding (Search Results)
        if (chunk.candidates && chunk.candidates[0].groundingMetadata) {
            groundingMetadata = chunk.candidates[0].groundingMetadata;
             setChatSessions(prev => prev.map(s => {
                if (s.id === currentSessionId) {
                    const newMessages = [...s.messages];
                    const lastMsgIndex = newMessages.length - 1;
                    const lastMsg = { ...newMessages[lastMsgIndex] };
                    lastMsg.groundingMetadata = groundingMetadata;
                    newMessages[lastMsgIndex] = lastMsg;
                    return { ...s, messages: newMessages };
                }
                return s;
            }));
        }

        // Collect Function Calls
        const calls = chunk.functionCalls;
        if (calls && calls.length > 0) {
            functionCalls.push(...calls);
        }
      }

      // Handle Function Calls after stream
      if (functionCalls.length > 0) {
          for (const call of functionCalls) {
             const result = await handleExecuteFunctionCall(call);
             if (!fullResponse) fullResponse += `\n\n[System: ${result}]`;
          }
      }
      
      // Final save
      const finalSession = { ...updatedSession };
      const lastMsgIndex = finalSession.messages.length - 1;
      finalSession.messages[lastMsgIndex] = { 
          role: 'model', 
          parts: [{ text: fullResponse }],
          groundingMetadata 
      };
      
      await saveChatSession(currentUser.uid, finalSession);
      // Sync local state one last time to ensure consistency
      setChatSessions(prev => prev.map(s => s.id === currentSessionId ? finalSession : s));

    } catch (e) {
      console.error(e);
      refundCredits(cost);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`Failed to get response: ${errorMessage}. Please check your connection or try a different tool.`);
      
      // Cleanup: Remove the optimistic empty model message AND the failed user message so they can try again
      // This allows the user to re-type or re-submit without duplicates in history
      setChatSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
               const cleanMessages = s.messages.slice(0, -2); 
               return { ...s, messages: cleanMessages };
          }
          return s;
      }));
    } finally {
      setIsLoading(false);
      // Add a small delay before unlocking sync to ensure DB write has propagated
      setTimeout(() => {
          isSendingRef.current = false; 
      }, 500);
    }
  }, [chatSessions, activeSessionId, profile, currentUser.uid]);


  // Dashboard Handler
  const handleDashboardAction = (action: DashboardAction, featureTitle: string) => {
      let cost = 0;
      const costKey = featureTitle.toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_') 
        .replace(/^_|_$/g, '');      
        
      cost = (CREDIT_COSTS as any)[costKey] ?? 5;
  
      if (action.type === 'send_message') {
        if (profile.credits < cost) {
          setShowBuyCredits(true);
          return;
        }
        // Pass the feature title as the category to group chats
        handleSendMessage(action.payload, undefined, featureTitle).catch((e) => {
             console.error(e);
        });
      } else if (action.type === 'open_modal') {
        switch (action.payload) {
          case 'gtm': setShowGtmPlanner(true); break;
          case 'document_analysis': setShowDocumentAnalysis(true); break;
          case 'video_analysis': setShowVideoAnalysis(true); break;
          case 'image_generation': setImageGenerationResult(null); setShowImageGeneration(true); break;
          case 'image_editing': setImageEditingResult(null); setShowImageEditing(true); break;
          case 'video_text': setVideoGenerationResult(null); setVideoGenerationMode('text'); setShowVideoGeneration(true); break;
          case 'video_image': setVideoGenerationResult(null); setVideoGenerationMode('image'); setShowVideoGeneration(true); break;
          case 'sanctuary': setShowSanctuary(true); break;
          case 'academy': setShowAcademy(true); break;
          case 'site_architect': setShowMVPBuilder(true); break;
        }
      }
  };

  // --- Feature Implementations (Academy, Image Gen, Video Gen) ---
  // ... (Existing feature implementations remain unchanged)
  
  const handleAcademyAnalysis = async (audience: string, pitch: string): Promise<PitchAnalysisResult> => {
      if (!aiRef.current) throw new Error("AI not initialized");
      const prompt = `Act as a world-class pitch coach. Analyze the following pitch for this audience: "${audience}". Pitch: "${pitch}". Provide your analysis in JSON: { "score": number, "feedback": "string", "strengths": ["string"], "weaknesses": ["string"], "refinedPitch": "string" }`;
      const response = await aiRef.current.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [{ text: prompt }] }, config: { responseMimeType: 'application/json' } });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("No response");
      return JSON.parse(text) as PitchAnalysisResult;
  };

  const handlePromptGrading = async (userPrompt: string): Promise<PromptGradingResult> => {
      if (!aiRef.current) throw new Error("AI not initialized");
      const prompt = `Act as a Prompt Engineering Professor. Evaluate: "${userPrompt}". JSON: { "score": number, "feedback": "string", "improvedPrompt": "string" }`;
      const response = await aiRef.current.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [{ text: prompt }] }, config: { responseMimeType: 'application/json' } });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("No response");
      return JSON.parse(text) as PromptGradingResult;
  };

  const handleGenerateMVP = async (prompt: string, style: string, currentCode?: string, refinementRequest?: string): Promise<string> => {
    if (!aiRef.current) throw new Error("AI not initialized");
    
    // Refinements are cheaper
    const cost = refinementRequest ? CREDIT_COSTS.WEBSITE_GENERATION / 5 : CREDIT_COSTS.WEBSITE_GENERATION;
    
    if (profile.credits < cost) {
        setShowBuyCredits(true);
        throw new Error("Insufficient credits");
    }
    deductCredits(cost);
    
    try {
        const styleDescription = MVP_STYLES[style] || style;

        const systemInstruction = `You are a 10x Frontend Engineer and specialized UI/UX Designer.
Your task is to build a "Vibe Coded" Single-File React Application that rivals top-tier SaaS products in aesthetics and IS FULLY FUNCTIONAL.

**CONTEXT & STYLE:**
- Style requested: ${styleDescription}
- Theme: Professional, Polished, Pixel-Perfect.
- Typography: Use 'Inter' for UI and 'Space Grotesk' or 'Plus Jakarta Sans' for headings.

**TECHNICAL CONSTRAINTS:**
1.  **Single HTML File:** Everything (CSS, JS, Layout) must remain in one file.
2.  **React & Tailwind:** Use the provided CDNs.
3.  **Icons:** Use Google Material Symbols Rounded (class="material-symbols-rounded").
4.  **Images:** Use "https://images.unsplash.com/..." or "https://picsum.photos/..." for placeholders.

**CRITICAL FUNCTIONALITY RULES:**
- **INTERACTIVITY IS MANDATORY:** The app must not be a static mockup. It must work.
- **STATE MANAGEMENT:** Use 'useState' for all interactive elements (forms, tabs, toggles, counters).
- **EVENT HANDLERS:** All buttons must have 'onClick' handlers.
  - **FORMS:** If a user submits a form (Login, Signup, Email), you MUST prevent default ('e.preventDefault()'), update a loading state, simulate a network delay with 'setTimeout', and then update the UI to a "Success" state or "Dashboard" view. **DO NOT let the form reload the page.**
  - **NAVIGATION:** If a user clicks a nav item, update the active view state to show different content.
  - **BUTTONS:** Every button must provide visual feedback (state change, alert, or modal).
- **NO DEAD BUTTONS:** Every interactive element must provide feedback.

**DESIGN SYSTEM INSTRUCTIONS:**
- **Spacing:** Use generous whitespace (p-8, gap-6).
- **Radius:** Use large border radius (rounded-2xl, rounded-3xl) for cards/containers.
- **Shadows:** Use sophisticated shadows (shadow-xl, shadow-inner) for depth.
- **Borders:** Use subtle 1px borders (border-gray-200 dark:border-gray-800).
- **Interactivity:** All buttons must have hover states. Inputs must have focus rings.
- **Animations:** Use 'transition-all duration-300' for smooth interactions.

**OUTPUT REQUIREMENTS:**
- Return ONLY the raw HTML code.
- The root element should be <div id="root"></div>.
- The React app must mount to document.getElementById('root').

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>App</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Plus Jakarta Sans', sans-serif; }
        .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        /* Scrollbar styling */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect } = React;
        // YOUR FUNCTIONAL REACT CODE HERE
    </script>
</body>
</html>
`;

        const response = await aiRef.current.models.generateContent({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction
            },
            contents: { parts: [{ text: prompt }] }
        });

        let code = response.text || "";
        
        // Robust Markdown Stripping
        // 1. Try to extract content between ```html and ```
        const matchHtml = code.match(/```html\s*([\s\S]*?)\s*```/i);
        if (matchHtml) {
            code = matchHtml[1];
        } else {
            // 2. Try to extract content between generic ``` and ```
            const matchGeneric = code.match(/```\s*([\s\S]*?)\s*```/);
            if (matchGeneric) {
                code = matchGeneric[1];
            }
        }
        
        return code.trim();
    } catch (e) {
        console.error("MVP Generation Error:", e);
        refundCredits(cost);
        throw e;
    }
  };

  const handleGenerateGtmPlan = (data: GtmFormData) => {
    setShowGtmPlanner(false);
    const prompt = `**Go-to-Market Strategy Request**\n\nTarget: ${data.audience}\nValue: ${data.valueProp}\nGoals: ${data.goals}\nChannels: ${data.channels.join(', ')}\n\nGenerate a detailed Step-by-Step GTM Plan.`;
    handleSendMessage(prompt, undefined, 'Go-to-Market Plan');
  };

  const handleAnalyzeDocument = async (file: File, prompt: string) => {
    setShowDocumentAnalysis(false);
    try {
        const base64 = await fileToBase64(file);
        handleSendMessage(prompt, { base64, mimeType: file.type }, 'Document Analysis');
    } catch (e) {
        setError("Failed to process document file.");
    }
  };

  const handleAnalyzeVideo = async (file: File, mode: VideoAnalysisMode, customPrompt?: string) => {
    setShowVideoAnalysis(false);
    let prompt = "";
    switch(mode) {
        case 'reels': prompt = "Analyze this video and identify 3-5 viral clip opportunities."; break;
        case 'transcript': prompt = "Generate a full transcript of this video."; break;
        case 'repurpose': prompt = customPrompt || "Repurpose key insights into a blog post."; break;
    }
    try {
         const base64 = await fileToBase64(file);
         handleSendMessage(prompt, { base64, mimeType: file.type }, 'Video Understanding');
    } catch (e) {
         setError("Failed to process video file.");
    }
  };

  const handleGenerateImage = async (prompt: string, aspectRatio: string, modelType: 'imagen' | 'flash') => {
      // ... existing image gen logic
       if (!aiRef.current) return;
       const cost = CREDIT_COSTS.IMAGE_GENERATION;
       if (profile.credits < cost) { setShowBuyCredits(true); return; }
       deductCredits(cost);
       setIsImageGenerating(true);
       try {
          let imageUrl = '';
          if (modelType === 'imagen') {
               const response = await aiRef.current.models.generateImages({ 
                   model: 'imagen-4.0-generate-001', 
                   prompt, 
                   config: { 
                       numberOfImages: 1, 
                       outputMimeType: 'image/jpeg', 
                       aspectRatio: aspectRatio as any 
                   } 
               });
               const base64 = response.generatedImages?.[0]?.image?.imageBytes;
               if (base64) imageUrl = `data:image/jpeg;base64,${base64}`;
          } else {
               // For Flash Image, we simply send the prompt. 
               // We DO NOT use responseModalities: [Modality.IMAGE] as it is not standard for this model in the SDK.
               const response = await aiRef.current.models.generateContent({ 
                   model: 'gemini-2.5-flash-image', 
                   contents: { parts: [{ text: prompt }] }
               });
               const parts = response.candidates?.[0]?.content?.parts;
               if(parts) { 
                   for(const p of parts) { 
                       if(p.inlineData) { 
                           imageUrl = `data:image/png;base64,${p.inlineData.data}`; 
                           break; 
                       } 
                   } 
               }
          }
          
          if (imageUrl) {
               setImageGenerationResult(imageUrl);
               await saveAsset(currentUser.uid, { id: Date.now().toString(), userId: currentUser.uid, type: 'image', url: imageUrl, prompt, createdAt: new Date().toISOString() });
          } else {
              throw new Error("No image data received from model. Please try a clearer prompt.");
          }
       } catch(e) { 
           console.error(e); 
           refundCredits(cost); 
           const msg = e instanceof Error ? e.message : String(e);
           alert(`Failed to generate image: ${msg}`); 
        } finally { 
            setIsImageGenerating(false); 
        }
  };

  const handleEditImage = async (prompt: string, image: { base64: string, mimeType: string }) => {
      // ... existing image edit logic
      if (!aiRef.current) return;
      const cost = CREDIT_COSTS.IMAGE_EDITING;
      if (profile.credits < cost) { setShowBuyCredits(true); return; }
      deductCredits(cost);
      setIsImageEditing(true);
      try {
          const response = await aiRef.current.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ inlineData: { data: image.base64, mimeType: image.mimeType } }, { text: prompt }] } });
          const parts = response.candidates?.[0]?.content?.parts;
          if(parts) { for(const p of parts) { if(p.inlineData) { const url = `data:image/png;base64,${p.inlineData.data}`; setImageEditingResult(url); await saveAsset(currentUser.uid, { id: Date.now().toString(), userId: currentUser.uid, type: 'image', url, prompt: `Edited: ${prompt}`, createdAt: new Date().toISOString() }); } } }
      } catch(e) { console.error(e); refundCredits(cost); alert("Failed to edit image."); } finally { setIsImageEditing(false); }
  };

  const handleGenerateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', sourceImage?: { base64: string, mimeType: string }) => {
    // ... existing video gen logic (Veo)
     if (!aiRef.current) return;
    const cost = CREDIT_COSTS.VIDEO_GENERATION;
    if (profile.credits < cost) { setShowBuyCredits(true); return; }

    if (typeof window !== 'undefined' && (window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) throw new Error("API Key selection required for Video Generation.");
    }

    const veoAi = new GoogleGenAI({ apiKey: process.env.API_KEY }); 
    deductCredits(cost);
    setIsVideoGenerating(true);
    setVideoGenerationResult(null);
    setVideoGenerationMessage('Initializing Veo engine...');

    try {
        let operation: any;
        if (sourceImage) {
             setVideoGenerationMessage('Animating your image...');
             operation = await veoAi.models.generateVideos({ model: 'veo-3.1-fast-generate-preview', image: { imageBytes: sourceImage.base64, mimeType: sourceImage.mimeType as any }, prompt: prompt || "Animate this image", config: { numberOfVideos: 1, resolution: '720p', aspectRatio } });
        } else {
             setVideoGenerationMessage('Dreaming up your video...');
             operation = await veoAi.models.generateVideos({ model: 'veo-3.1-fast-generate-preview', prompt, config: { numberOfVideos: 1, resolution: '720p', aspectRatio } });
        }
        setVideoGenerationMessage('Rendering video...');
        while (!operation.done) { await new Promise(resolve => setTimeout(resolve, 5000)); operation = await veoAi.operations.getVideosOperation({ operation: operation }); }
        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
             setVideoGenerationMessage('Finalizing download...');
             let fetchUrl = videoUri; if (process.env.API_KEY) fetchUrl += `&key=${process.env.API_KEY}`;
             const videoRes = await fetch(fetchUrl);
             const videoBlob = await videoRes.blob();
             const videoUrl = URL.createObjectURL(videoBlob);
             setVideoGenerationResult(videoUrl);
             const reader = new FileReader(); reader.readAsDataURL(videoBlob);
             reader.onloadend = async () => { await saveAsset(currentUser.uid, { id: Date.now().toString(), userId: currentUser.uid, type: 'video', url: reader.result as string, prompt: prompt || "Animated Image", createdAt: new Date().toISOString() }); };
        }
    } catch (e) { console.error(e); refundCredits(cost); throw e; } finally { setIsVideoGenerating(false); setVideoGenerationMessage(''); }
  };

  const handleToggleVoice = async () => {
      if (isListening) stopVoiceSession(); else startVoiceSession();
  };

  const startVoiceSession = async () => {
     try {
          setIsListening(true);
          setVoiceState('listening');
          setLiveTranscription({ user: '', model: ''});
          if (!aiRef.current) return;
          inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;

          const sessionPromise = aiRef.current.live.connect({
              model: 'gemini-2.5-flash-native-audio-preview-09-2025',
              callbacks: {
                  onopen: () => {
                      setVoiceState('listening');
                      if (!inputAudioContextRef.current) return;
                      const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                      scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                      scriptProcessorRef.current.onaudioprocess = (e) => {
                          const inputData = e.inputBuffer.getChannelData(0);
                          const blob = createBlob(inputData);
                          sessionPromise.then(session => session.sendRealtimeInput({ media: blob }));
                      };
                      source.connect(scriptProcessorRef.current);
                      scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                  },
                  onmessage: async (msg: LiveServerMessage) => {
                       if (msg.serverContent?.modelTurn?.parts?.[0]?.text) {
                           setLiveTranscription(prev => ({ ...prev, model: prev.model + msg.serverContent?.modelTurn?.parts[0].text }));
                       }
                       const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                       if (audioData && outputAudioContextRef.current) {
                            setVoiceState('speaking');
                            const audioCtx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
                            const buffer = await decodeAudioData(decode(audioData), audioCtx, 24000, 1);
                            const source = audioCtx.createBufferSource();
                            source.buffer = buffer;
                            source.connect(audioCtx.destination);
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += buffer.duration;
                            audioSourcesRef.current.push(source);
                            source.onended = () => { if (audioCtx.currentTime >= nextStartTimeRef.current) setVoiceState('listening'); };
                       }
                       if (msg.serverContent?.turnComplete) setVoiceState('listening');
                  },
                  onclose: () => stopVoiceSession(),
                  onerror: (err) => { console.error(err); stopVoiceSession(); }
              },
              config: { responseModalities: [Modality.AUDIO], systemInstruction: generateSystemInstruction(profile as any), speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } }
          });
          sessionPromiseRef.current = sessionPromise;
      } catch (e) { console.error(e); stopVoiceSession(); }
  };

  const stopVoiceSession = () => {
      setIsListening(false);
      setVoiceState('idle');
      if (sessionPromiseRef.current) sessionPromiseRef.current = null;
      if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(track => track.stop()); mediaStreamRef.current = null; }
      if (scriptProcessorRef.current) { scriptProcessorRef.current.disconnect(); scriptProcessorRef.current = null; }
      if (inputAudioContextRef.current) { inputAudioContextRef.current.close(); inputAudioContextRef.current = null; }
      if (outputAudioContextRef.current) { outputAudioContextRef.current.close(); outputAudioContextRef.current = null; }
      audioSourcesRef.current.forEach(source => { try { source.stop(); } catch(e) {} });
      audioSourcesRef.current = [];
      nextStartTimeRef.current = 0;
  };

  // --- Render ---

  const activeSession = chatSessions.find(s => s.id === activeSessionId);
  const showDashboard = !activeSession || activeSession.messages.length <= 1;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans text-gray-900">
      
      {/* Desktop Sidebar: Collapsible */}
      <div className={`hidden md:flex h-full transition-all duration-300 ease-in-out border-r border-gray-200 ${isDesktopSidebarOpen ? 'w-64' : 'w-0'} overflow-hidden flex-shrink-0`}>
         {/* Container with fixed width to prevent content squishing during animation */}
         <div className="w-64 h-full">
             <ChatHistory 
                sessions={chatSessions} 
                activeSessionId={activeSessionId}
                onNewChat={() => handleNewChat()}
                onSelectSession={setActiveSessionId}
                onDeleteSession={handleDeleteSession}
                isOpenOnMobile={false}
             />
         </div>
      </div>

      {/* Mobile Sidebar: Overlay */}
      <div className={`fixed inset-0 z-[60] transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 md:hidden`}>
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-[55]" onClick={() => setIsMobileSidebarOpen(false)}></div>
          <ChatHistory 
            sessions={chatSessions} 
            activeSessionId={activeSessionId}
            onNewChat={() => handleNewChat()}
            onSelectSession={(id) => { setActiveSessionId(id); setIsMobileSidebarOpen(false); }}
            onDeleteSession={handleDeleteSession}
            isOpenOnMobile={isMobileSidebarOpen}
         />
      </div>

      <div className="flex-1 flex flex-col h-full w-full relative min-w-0">
        <Header 
            onEnterApp={() => {}} 
            isChatPage={true} 
            onGoHome={handleLogoClick}
            onToggleTasks={() => setShowTasks(true)}
            onOpenProfile={() => setShowProfile(true)}
            onToggleSidebar={handleToggleSidebar}
            onOpenExport={() => setShowExport(true)}
            onOpenUpdates={() => { setShowUpdates(true); setHasUnreadUpdates(false); localStorage.setItem('last_update_seen', appUpdates[0].id); }}
            onOpenAdmin={profile.role === 'admin' ? () => setShowAdminDashboard(true) : undefined}
            onOpenSupport={onOpenSupport}
            hasUnreadUpdates={hasUnreadUpdates}
            ticketCount={ticketCount}
            showDashboard={showDashboard}
            profile={{ 
                name: profile.name, 
                business: profile.business, 
                photo: profile.photo,
                credits: profile.credits,
                role: profile.role
            }}
            onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto relative scroll-smooth">
            {/* Global Error Banner - Always visible if set */}
            {error && (
                <div className="max-w-4xl mx-auto mt-4 mx-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center animate-fadeIn shadow-sm">
                    <span className="material-icons mr-2 text-red-500">error_outline</span>
                    <span className="font-medium">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                        <span className="material-icons text-sm">close</span>
                    </button>
                </div>
            )}

          {showDashboard ? (
            <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-600 mb-2">
                        {activeSession?.messages[0]?.parts[0]?.text?.split('!')[0] + '!'}
                    </h1>
                    <p className="text-gray-600 text-lg">Your AI co-founder is ready. What's the mission?</p>
                </div>
                <Dashboard onAction={handleDashboardAction} />
            </div>
          ) : (
            <div className="h-full px-4 pt-6 pb-24">
               <MessageList 
                    messages={activeSession.messages} 
                    isLoading={isLoading} 
                    userProfilePhoto={profile.photo}
                    onExportMessage={(content) => { setExportContent(content); setShowExport(true); }}
               />
            </div>
          )}
        </main>

        <ChatInput 
            onSendMessage={(input, image, toolId) => handleSendMessage(input, image, undefined, toolId)} 
            isLoading={isLoading} 
            isListening={isListening}
            onToggleVoice={handleToggleVoice}
            voiceState={voiceState}
            liveTranscription={liveTranscription}
        />
      </div>

      {/* Modals */}
      {showOnboarding && <OnboardingModal onFinish={handleOnboardingFinish} />}
      {showQuestionnaire && <OnboardingQuestionnaire isOpen={showQuestionnaire} onComplete={handleCompleteQuestionnaire} />}
      {showTasks && <TaskModal isOpen={showTasks} onClose={() => setShowTasks(false)} tasks={tasks} onAddTask={handleAddTask} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} />}
      {showProfile && <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} onSave={handleSaveProfile} currentProfile={profile} onBuyCredits={() => setShowBuyCredits(true)} onLogout={handleLogout} onManageSubscription={onManageSubscription} />}
      {showGtmPlanner && <GoToMarketPlanner isOpen={showGtmPlanner} onClose={() => setShowGtmPlanner(false)} onGenerate={handleGenerateGtmPlan} />}
      {showImageGeneration && <ImageGenerationModal isOpen={showImageGeneration} onClose={() => { setShowImageGeneration(false); setActivePrompt(''); }} onGenerate={handleGenerateImage} isLoading={isImageGenerating} generatedImage={imageGenerationResult} initialPrompt={activePrompt} />}
      {showImageEditing && <ImageEditingModal isOpen={showImageEditing} onClose={() => setShowImageEditing(false)} onGenerate={handleEditImage} isLoading={isImageEditing} generatedImage={imageEditingResult} />}
      {showVideoGeneration && <VideoGenerationModal isOpen={showVideoGeneration} onClose={() => { setShowVideoGeneration(false); setActivePrompt(''); setActiveImage(undefined); }} onGenerate={handleGenerateVideo as any} isLoading={isVideoGenerating} loadingMessage={videoGenerationMessage} generatedVideo={videoGenerationResult} initialMode={videoGenerationMode} initialPrompt={activePrompt} initialImage={activeImage} />}
      {showDocumentAnalysis && <DocumentAnalysisModal isOpen={showDocumentAnalysis} onClose={() => setShowDocumentAnalysis(false)} onAnalyze={handleAnalyzeDocument} isLoading={isLoading} />}
      {showVideoAnalysis && <VideoAnalysisModal isOpen={showVideoAnalysis} onClose={() => setShowVideoAnalysis(false)} onAnalyze={handleAnalyzeVideo} isLoading={isLoading} />}
      {showBuyCredits && <BuyCreditsModal isOpen={showBuyCredits} onClose={() => setShowBuyCredits(false)} />}
      {showExport && <ExportModal isOpen={showExport} onClose={() => { setShowExport(false); setExportContent(null); }} chatSession={activeSession} tasks={tasks} initialContent={exportContent} />}
      {showUpdates && <UpdatesModal isOpen={showUpdates} onClose={() => setShowUpdates(false)} />}
      {showAdminDashboard && <AdminDashboard isOpen={showAdminDashboard} onClose={() => setShowAdminDashboard(false)} currentUserProfile={profile} />}
      {showSanctuary && <SanctuaryModal isOpen={showSanctuary} onClose={() => setShowSanctuary(false)} userProfile={profile} onStartSession={(prompt) => handleSendMessage(prompt, undefined, 'The Sanctuary')} />}
      {showAcademy && <AcademyModal isOpen={showAcademy} onClose={() => setShowAcademy(false)} userProfile={profile} onAnalyzePitch={handleAcademyAnalysis} onGradePrompt={handlePromptGrading} />}
      {showMVPBuilder && <MVPBuilderModal isOpen={showMVPBuilder} onClose={() => setShowMVPBuilder(false)} userProfile={profile} onGenerate={handleGenerateMVP} isLoading={isLoading} />}
      
      {confirmation && (
        <ConfirmationModal
          isOpen={confirmation.isOpen}
          onClose={() => setConfirmation(null)}
          onConfirm={() => {
            confirmation.onConfirm();
            setConfirmation(null);
          }}
          actionName={confirmation.actionName}
          cost={confirmation.cost}
          remaining={confirmation.remaining}
        />
      )}
    </div>
  );
};

export default ChatPage;