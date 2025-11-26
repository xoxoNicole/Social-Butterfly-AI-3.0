
import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { UserProfile, saveMVPProject, subscribeToMVPProjects, MVPProject, deleteMVPProject } from '../services/firebase';
import { GoogleGenAI } from '@google/genai';

interface MVPBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onGenerate: (prompt: string, style: string, currentCode?: string, refinementRequest?: string) => Promise<string>;
  isLoading: boolean;
}

// --- Affiliate Links Configuration ---
// REPLACE THESE STRINGS WITH YOUR ACTUAL AFFILIATE LINKS
const AFFILIATE_LINKS = {
    domain: "https://www.ionos.com/domain-names", 
    firebase: "https://console.firebase.google.com",
    github: "https://github.com",
    workspace: "https://referworkspace.app.goo.gl/jXNA", 
    startup: "https://startup.google.com",
    api: "https://aistudio.google.com"
};

const styles = [
    { id: 'modern', label: 'Modern Clean', desc: 'High whitespace, clean typography, trustworthy.' },
    { id: 'bold', label: 'Bold & Dark', desc: 'Dark mode, high contrast, neon accents.' },
    { id: 'editorial', label: 'Editorial / Luxury', desc: 'Serif headers, large images, magazine feel.' },
    { id: 'saas', label: 'Tech / SaaS', desc: 'Blue/Purple gradients, bento grids, feature focused.' },
    { id: 'minimal', label: 'Ultra Minimal', desc: 'Monochrome, text-focused, brutalist hints.' }
];

const fonts = [
    { id: 'sans', label: 'Clean Sans (Inter/Roboto)', value: 'font-sans' },
    { id: 'serif', label: 'Trustworthy Serif (Playfair/Merriweather)', value: 'font-serif' },
    { id: 'mono', label: 'Technical Mono', value: 'font-mono' },
];

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    image?: { base64: string, mimeType: string };
}

const blobToBase64 = (blob: Blob): Promise<{ base64: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result !== 'string') {
                return reject(new Error('File could not be read as a string.'));
            }
            const base64String = reader.result.split(',')[1];
            resolve({ base64: base64String, mimeType: blob.type });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const MVPBuilderModal: React.FC<MVPBuilderModalProps> = ({ isOpen, onClose, userProfile, onGenerate, isLoading: parentIsLoading }) => {
  // Visual Settings
  const [selectedStyle, setSelectedStyle] = useState(styles[0].id);
  const [selectedFont, setSelectedFont] = useState(fonts[0].id);
  
  // Project Context
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<MVPProject[]>([]);
  const [showProjectList, setShowProjectList] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Site State
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [prdContent, setPrdContent] = useState<string | null>(null);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'design' | 'gallery' | 'learn'>('chat');
  const [showCode, setShowCode] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false); // Founder's Roadmap
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  
  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ file: File, preview: string, base64: string, mimeType: string } | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // AI Instance
  const aiRef = useRef<GoogleGenAI | null>(null);

  // Combine loading states
  const isLoading = parentIsLoading || isGenerating;

  // --- Initialization ---

  useEffect(() => {
      let apiKey = undefined;
      try {
         if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
             apiKey = process.env.API_KEY;
         }
      } catch (e) { }

      if (apiKey) {
          aiRef.current = new GoogleGenAI({ apiKey });
      }
  }, []);

  // Subscribe to Projects
  useEffect(() => {
      if (isOpen && userProfile.uid) {
          const unsubscribe = subscribeToMVPProjects(userProfile.uid, (data) => {
              setProjects(data);
          });
          return () => unsubscribe();
      }
  }, [isOpen, userProfile.uid]);

  // Initialize Speech Recognition
  useEffect(() => {
      if (typeof window !== 'undefined') {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SpeechRecognition) {
              const recognition = new SpeechRecognition();
              recognition.continuous = false;
              recognition.interimResults = false;
              recognition.lang = 'en-US';
              
              recognition.onresult = (event: any) => {
                  const transcript = event.results[0][0].transcript;
                  setChatInput(prev => prev ? `${prev} ${transcript}` : transcript);
                  setIsListening(false);
              };
              
              recognition.onerror = (event: any) => {
                  console.error("Speech recognition error", event.error);
                  setIsListening(false);
              };
              
              recognition.onend = () => {
                  setIsListening(false);
              };
              
              recognitionRef.current = recognition;
          }
      }
  }, []);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 300)}px`; 
    }
  }, [chatInput]);

  // Reset on Open
  useEffect(() => {
      if (isOpen && !currentProjectId) {
          const welcomeMsg = `Welcome to the MVP Builder! 🚀\n\nI'm ready to help you vibe code your new idea. What are we building?`;
          setChatHistory([{ role: 'model', text: welcomeMsg }]);
          setGeneratedCode(null);
          setPrdContent(null);
          setIsSidebarOpen(true);
          setShowRoadmap(false);
          setIsGenerating(false);
      }
  }, [isOpen, currentProjectId]);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, activeTab]);

  // --- Handlers ---

  const toggleListening = () => {
      if (!recognitionRef.current) {
          alert("Voice input is not supported in this browser.");
          return;
      }
      if (isListening) {
          recognitionRef.current.stop();
      } else {
          recognitionRef.current.start();
          setIsListening(true);
      }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const preview = URL.createObjectURL(file);
          const { base64, mimeType } = await blobToBase64(file);
          setAttachedImage({ file, preview, base64, mimeType });
      }
  };

  const removeAttachedImage = () => {
      if (attachedImage) URL.revokeObjectURL(attachedImage.preview);
      setAttachedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (msgOverride?: string) => {
      const userMsg = msgOverride || chatInput;
      const imageToSend = attachedImage;

      if ((!userMsg.trim() && !imageToSend) || isChatLoading) return;

      setChatInput('');
      removeAttachedImage();
      
      // Optimistically add user message
      const newMsg: ChatMessage = { role: 'user', text: userMsg };
      if (imageToSend) {
          newMsg.image = { base64: imageToSend.base64, mimeType: imageToSend.mimeType };
      }
      setChatHistory(prev => [...prev, newMsg]);
      setIsChatLoading(true);

      try {
          if (!aiRef.current) throw new Error("AI not initialized");

          const systemInstruction = `You are a Senior Product Engineer, Lead Instructor, and MVP Architect for "The Mogul Factory".
          Your goal is to help the Founder (user) define the specs, logic, and design of their software prototype.
          
          **YOUR ROLE:**
          1.  **Clarify the Vision:** Ask about the user journey, the core "job to be done", and the data needed.
          2.  **Suggest Features:** Propose "Quick Wins".
          3.  **Teach & Guide:** If the user seems stuck, suggest inspecting code or taking a screenshot to help you. Use simple analogies.
          4.  **Keep it Founder-Friendly:** Use plain English, not jargon.
          5.  **Call to Action:** Explicitly tell the user to CLICK THE "Build MVP" BUTTON when you have enough info to start coding.
          
          DO NOT generate code in the chat. Just discuss the plan.`;

          const history = chatHistory
            .filter(msg => (msg.text && msg.text.trim().length > 0) || msg.image)
            .map(msg => {
                const parts: any[] = [];
                if (msg.image) parts.push({ inlineData: { data: msg.image.base64, mimeType: msg.image.mimeType } });
                if (msg.text) parts.push({ text: msg.text });
                return { role: msg.role === 'user' ? 'user' : 'model', parts };
            });

          const chat = aiRef.current.chats.create({
              model: 'gemini-2.5-flash',
              config: { systemInstruction },
              history
          });

          const partsToSend = [];
          if (imageToSend) partsToSend.push({ inlineData: { data: imageToSend.base64, mimeType: imageToSend.mimeType } });
          if (userMsg) partsToSend.push({ text: userMsg });

          const result = await chat.sendMessage({ message: partsToSend });
          const responseText = result.text; 

          setChatHistory(prev => [...prev, { role: 'model', text: responseText || "I'm ready to build whenever you are." }]);

      } catch (error) {
          console.error("Chat Error:", error);
          let errorMsg = "I'm having trouble connecting. Please try again.";
          if (error instanceof Error) errorMsg += ` (${error.message})`;
          setChatHistory(prev => [...prev, { role: 'model', text: errorMsg }]);
      } finally {
          setIsChatLoading(false);
      }
  };

  const handleRenderApp = async () => {
      setIsGenerating(true);
      setLoadingStep(0);
      
      // Step Timer
      const stepInterval = setInterval(() => {
          setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
      }, 2000);

      try {
        const conversationContext = chatHistory.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
        
        const strategyPrompt = `
        Based on this conversation:
        ${conversationContext}
        
        Generate a concise "Next Steps" guide for the founder.
        Include:
        1. What backend services they might need.
        2. One creative marketing idea.
        Keep it encouraging.
        `;
        
        const codePrompt = `
        **CONTEXT FROM ARCHITECT SESSION:**
        ${conversationContext}
        
        **DESIGN SETTINGS:**
        - Style ID: ${selectedStyle}
        - Font ID: ${selectedFont}
        
        **INSTRUCTIONS:**
        Generate a **SINGLE-FILE REACT APP** (using CDN for React/Tailwind).
        - **CRITICAL:** The app must be FUNCTIONAL.
          - Use 'useState' for all interactivity (forms, toggles, tabs, data entry).
          - Use 'onClick' handlers to make buttons do things.
          - NEVER create dead buttons.
        - **STRICTLY** avoid absolute positioning for layout. Use Tailwind grid/flex.
        - Ensure the UI is "Mogul Factory" quality (polished, modern, responsive).
        - **CRITICAL:** The output must be a single valid HTML file.
        
        Output ONLY the raw HTML/JS code.
        `;

        const code = await onGenerate(codePrompt, selectedStyle, generatedCode || undefined, generatedCode ? "Update the app based on the latest conversation." : undefined);
        setGeneratedCode(code);

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);

        setChatHistory(prev => [...prev, { 
            role: 'model', 
            text: `**Congratulations, You're a Founder!** 🚀\n\nI've engineered a functional prototype based on our strategy session. You can test the interactions on the right.\n\nCheck out the "Founder's Roadmap" via the Export Pack button to see how to apply to the Google Startup Program.` 
        }]);

        if (aiRef.current) {
             const stratResponse = await aiRef.current.models.generateContent({ 
                 model: 'gemini-2.5-flash', 
                 contents: { parts: [{ text: strategyPrompt }] }
             });
             const stratText = stratResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
             setPrdContent(stratText);
        }
        
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
      } catch (error) {
          console.error("Render Error:", error);
          setChatHistory(prev => [...prev, { role: 'model', text: "❌ I encountered an error while building the app. Please try again." }]);
      } finally {
          clearInterval(stepInterval);
          setIsGenerating(false);
      }
  };

  // --- Project Management ---

  const handleSaveProject = async () => {
      if (!userProfile.uid) return;
      setSaveStatus('saving');
      
      const projectId = currentProjectId || `${Date.now()}`;
      const name = chatHistory.find(m => m.role === 'user')?.text.substring(0, 30) || 'Untitled MVP';
      
      const projectData: MVPProject = {
          id: projectId,
          name,
          style: selectedStyle,
          font: selectedFont,
          chatHistory: chatHistory.map(m => ({ role: m.role, text: m.text })), // Exclude bulky images
          generatedCode,
          prdContent,
          updatedAt: new Date().toISOString()
      };
      
      try {
          await saveMVPProject(userProfile.uid, projectData);
          setCurrentProjectId(projectId);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
          console.error("Save failed", e);
          setSaveStatus('idle');
          alert("Failed to save project. Check permissions.");
      }
  };

  const handleLoadProject = (project: MVPProject) => {
      setCurrentProjectId(project.id);
      setChatHistory(project.chatHistory);
      setGeneratedCode(project.generatedCode);
      setPrdContent(project.prdContent);
      setSelectedStyle(project.style);
      setSelectedFont(project.font);
      setShowProjectList(false);
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm("Delete this project?")) {
          await deleteMVPProject(userProfile.uid, projectId);
          if (currentProjectId === projectId) {
              setGeneratedCode(null);
              setChatHistory([]);
              setCurrentProjectId(null);
          }
      }
  };

  // --- Utility ---

  const handleFullScreenPreview = () => {
      if (!generatedCode) return;
      const newWindow = window.open();
      if (newWindow) {
          newWindow.document.write(generatedCode);
          newWindow.document.close();
      }
  };

  // --- Tabs Content ---

  const renderGallery = () => (
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Inspiration Gallery</h3>
          <div className="grid gap-6">
              {[
                  { 
                      title: "Zen Pomodoro", 
                      img: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=400&q=80", 
                      prompt: "Build a 'Zen Pomodoro' timer. Use soft pastel gradients. It needs a large countdown timer (25:00), buttons to start/pause/reset, and a simple task list below it. Add 3 toggle buttons for ambient sounds like 'Rain', 'Forest', 'Cafe'." 
                  },
                  { 
                      title: "Crypto Dashboard", 
                      img: "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=400&q=80", 
                      prompt: "Create a 'Crypto Folio' dashboard in dark mode. It should show a list of assets (BTC, ETH, SOL) with mock prices. When I click an asset, show a simple SVG line chart representing its 24h trend. Include a 'Total Balance' card." 
                  },
                  { 
                      title: "Recipe Remixer", 
                      img: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=400&q=80", 
                      prompt: "Build a 'Recipe Remixer' app. Display a recipe card for 'Spaghetti Bolognese'. Allow me to toggle 'Vegetarian Mode' which swaps meat for lentils in the UI. Include a multiplier button to change serving size." 
                  },
                  { 
                      title: "Habit Heatmap", 
                      img: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=400&q=80", 
                      prompt: "Create a 'Habit Heatmap' tracker. It should have a grid of small squares representing the last 30 days. Clicking a square toggles its color intensity (green shades). Include a 'Streak' counter." 
                  }
              ].map((item, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
                      <div className="h-32 overflow-hidden relative">
                          <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                  onClick={() => { handleSendMessage(item.prompt); setActiveTab('chat'); }}
                                  className="px-4 py-2 bg-white text-gray-900 rounded-full text-xs font-bold transform translate-y-2 group-hover:translate-y-0 transition-transform"
                              >
                                  Remix this Vibe
                              </button>
                          </div>
                      </div>
                      <div className="p-3">
                          <h4 className="font-bold text-gray-800">{item.title}</h4>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderLearn = () => (
      <div className="flex-1 overflow-y-auto p-6 bg-white space-y-8">
          <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="material-icons text-fuchsia-500 mr-2">handyman</span>
                  The AI Tool Shed
              </h3>
              <div className="space-y-3">
                  <details className="group bg-gray-50 rounded-lg p-3 border border-gray-200 open:bg-white open:shadow-sm">
                      <summary className="font-bold text-gray-700 cursor-pointer flex justify-between items-center">
                          Gemini (The Brain)
                          <span className="material-icons text-gray-400 text-sm group-open:rotate-180 transition-transform">expand_more</span>
                      </summary>
                      <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                          Think of Gemini as your super-smart co-founder. It writes the code, plans the strategy, and understands your vision. It powers the chat you see here.
                      </p>
                  </details>
                  <details className="group bg-gray-50 rounded-lg p-3 border border-gray-200 open:bg-white open:shadow-sm">
                      <summary className="font-bold text-gray-700 cursor-pointer flex justify-between items-center">
                          Veo (The Director)
                          <span className="material-icons text-gray-400 text-sm group-open:rotate-180 transition-transform">expand_more</span>
                      </summary>
                      <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                          Veo is Google's video generator. Use it to create promo videos or animated backgrounds for your app.
                      </p>
                  </details>
                  <details className="group bg-gray-50 rounded-lg p-3 border border-gray-200 open:bg-white open:shadow-sm">
                      <summary className="font-bold text-gray-700 cursor-pointer flex justify-between items-center">
                          Imagen (The Artist)
                          <span className="material-icons text-gray-400 text-sm group-open:rotate-180 transition-transform">expand_more</span>
                      </summary>
                      <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                          Need a logo, banner, or placeholder image? Imagen creates stunning visuals from text descriptions.
                      </p>
                  </details>
              </div>
          </div>

          <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="material-icons text-blue-500 mr-2">translate</span>
                  Tech Translator
              </h3>
              <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="font-bold text-blue-800 text-sm mb-1">Frontend vs Backend</h4>
                      <p className="text-xs text-blue-700">
                          <strong>Frontend</strong> is the dining room of a restaurant (what customers see). 
                          <strong>Backend</strong> is the kitchen (where the data is cooked). 
                          This MVP Builder creates the <em>Dining Room</em>.
                      </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                      <h4 className="font-bold text-purple-800 text-sm mb-1">API (The Waiter)</h4>
                      <p className="text-xs text-purple-700">
                          An API is like a waiter taking orders from the Dining Room (Frontend) to the Kitchen (Backend) and bringing food (data) back.
                      </p>
                  </div>
              </div>
          </div>
      </div>
  );

  // --- Founder's Roadmap Modal ---
  const FounderRoadmap = () => (
      <div className="absolute inset-0 bg-white z-[60] animate-slideInUp flex flex-col">
          <div className="bg-gradient-to-r from-fuchsia-900 to-purple-900 p-6 text-white flex-shrink-0">
              <button onClick={() => setShowRoadmap(false)} className="mb-4 flex items-center text-fuchsia-200 hover:text-white transition-colors">
                  <span className="material-icons text-sm mr-1">arrow_back</span> Back to Builder
              </button>
              <h2 className="text-3xl font-bold">Founder's Roadmap</h2>
              <p className="text-fuchsia-200">You built the prototype. Here is how you build the empire.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
              <div className="max-w-4xl mx-auto space-y-8">
                  
                  {/* Step 1 */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex gap-6">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">1</div>
                      <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">Claim Your Territory</h3>
                          <p className="text-gray-600 mt-2 text-sm">Before you code another line, secure your brand. Get a professional domain name.</p>
                          <a href={AFFILIATE_LINKS.domain} target="_blank" rel="noopener noreferrer" className="inline-flex items-center mt-4 text-blue-600 hover:underline font-medium text-sm">
                              Search Domains on Google Domains <span className="material-icons text-xs ml-1">open_in_new</span>
                          </a>
                      </div>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex gap-6">
                      <div className="flex-shrink-0 w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold text-xl">2</div>
                      <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">Set Up The "Kitchen" (Backend)</h3>
                          <p className="text-gray-600 mt-2 text-sm">Your app needs a place to store data and users. Firebase is the best all-in-one platform for this.</p>
                          <a href={AFFILIATE_LINKS.firebase} target="_blank" rel="noopener noreferrer" className="inline-flex items-center mt-4 text-amber-600 hover:underline font-medium text-sm">
                              Start for Free with Firebase <span className="material-icons text-xs ml-1">open_in_new</span>
                          </a>
                      </div>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex gap-6">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-bold text-xl">3</div>
                      <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">Protect Your Code</h3>
                          <p className="text-gray-600 mt-2 text-sm">Push your code to GitHub. It keeps your work safe and allows developers to help you later.</p>
                          <a href={AFFILIATE_LINKS.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center mt-4 text-gray-700 hover:underline font-medium text-sm">
                              Create GitHub Repo <span className="material-icons text-xs ml-1">open_in_new</span>
                          </a>
                      </div>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex gap-6">
                      <div className="flex-shrink-0 w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xl">4</div>
                      <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">Get Your Brain (API Key)</h3>
                          <p className="text-gray-600 mt-2 text-sm">To keep your app smart, you'll need a Gemini API key from Google AI Studio.</p>
                          <a href={AFFILIATE_LINKS.api} target="_blank" rel="noopener noreferrer" className="inline-flex items-center mt-4 text-purple-600 hover:underline font-medium text-sm">
                              Get API Key <span className="material-icons text-xs ml-1">open_in_new</span>
                          </a>
                      </div>
                  </div>

                  {/* Step 5 */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex gap-6">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-xl">5</div>
                      <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">Professionalize Your Business</h3>
                          <p className="text-gray-600 mt-2 text-sm">Get a professional email (you@yourbusiness.com) and collaboration tools with Google Workspace.</p>
                          <a href={AFFILIATE_LINKS.workspace} target="_blank" rel="noopener noreferrer" className="inline-flex items-center mt-4 text-green-600 hover:underline font-medium text-sm">
                              Get Google Workspace <span className="material-icons text-xs ml-1">open_in_new</span>
                          </a>
                      </div>
                  </div>

                  {/* Graduate */}
                  <div className="bg-gradient-to-br from-fuchsia-50 to-pink-50 p-8 rounded-xl border border-fuchsia-200 text-center">
                      <span className="material-icons text-5xl text-fuchsia-400 mb-4">rocket_launch</span>
                      <h3 className="text-2xl font-bold text-gray-900">Congratulations, Founder!</h3>
                      <p className="text-gray-600 mt-2 mb-6 max-w-lg mx-auto">You've built the MVP. Now build the business. Apply to the Google for Startups program for credits, mentorship, and support.</p>
                      <a href={AFFILIATE_LINKS.startup} target="_blank" rel="noopener noreferrer" className="px-8 py-3 bg-fuchsia-600 text-white font-bold rounded-full shadow-lg hover:bg-fuchsia-700 transition-all">
                          Apply to Google for Startups
                      </a>
                  </div>

              </div>
          </div>
      </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden relative" onClick={e => e.stopPropagation()}>
        
        {/* Confetti Animation Layer */}
        {showConfetti && (
            <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden flex justify-center">
                <div className="confetti-container w-full h-full">
                    {[...Array(50)].map((_, i) => (
                        <div key={i} className="confetti-piece" style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            backgroundColor: ['#f0abfc', '#c026d3', '#4ade80', '#60a5fa'][Math.floor(Math.random() * 4)]
                        }}></div>
                    ))}
                </div>
                <style>{`
                    .confetti-piece {
                        position: absolute;
                        width: 10px;
                        height: 10px;
                        background: #f00;
                        top: -10px;
                        opacity: 0;
                        animation: fall 4s linear infinite;
                    }
                    @keyframes fall {
                        0% { top: -10px; transform: rotate(0deg); opacity: 1; }
                        100% { top: 100%; transform: rotate(360deg); opacity: 0; }
                    }
                `}</style>
            </div>
        )}

        {/* Roadmap Modal */}
        {showRoadmap && <FounderRoadmap />}

        {/* Header */}
        <div className="bg-gray-900 p-3 md:p-4 flex justify-between items-center flex-shrink-0 border-b border-gray-800">
             <div className="flex items-center space-x-3 text-white">
                <div className="p-2 bg-fuchsia-600 rounded-lg hidden md:block">
                    <span className="material-icons text-xl">construction</span>
                </div>
                <div>
                    <h2 className="text-base md:text-lg font-bold tracking-wide flex items-center">
                        MVP Builder
                        <span className="ml-2 text-[10px] bg-fuchsia-900 text-fuchsia-300 px-2 py-0.5 rounded-full border border-fuchsia-700">VIBE CODING</span>
                    </h2>
                </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
                <button 
                    onClick={handleSaveProject}
                    className={`flex items-center space-x-1 text-xs md:text-sm font-medium px-3 py-1.5 rounded-md transition-colors border ${saveStatus === 'saved' ? 'bg-green-600 text-white border-green-600' : 'bg-gray-800 text-gray-300 border-gray-700 hover:text-white hover:border-gray-500'}`}
                >
                    <span className="material-icons text-sm">{saveStatus === 'saved' ? 'check' : saveStatus === 'saving' ? 'sync' : 'save'}</span>
                    <span className="hidden md:inline">{saveStatus === 'saved' ? 'Saved!' : saveStatus === 'saving' ? 'Saving...' : 'Save'}</span>
                </button>
                
                <button 
                    onClick={() => setShowProjectList(!showProjectList)}
                    className="text-gray-300 hover:text-white flex items-center space-x-1 text-xs md:text-sm font-medium bg-gray-800 px-3 py-1.5 rounded-md transition-colors border border-gray-700 hover:border-gray-500 relative"
                >
                    <span className="material-icons text-sm">folder_open</span>
                    <span className="hidden md:inline">Projects</span>
                    {showProjectList && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 text-gray-800 animate-fadeIn">
                            <div className="p-3 border-b border-gray-100 font-bold text-xs uppercase text-gray-500">Your Saved Projects</div>
                            <div className="max-h-60 overflow-y-auto">
                                {projects.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-400">No saved projects yet.</div>
                                ) : (
                                    projects.map(p => (
                                        <div key={p.id} className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0" onClick={() => handleLoadProject(p)}>
                                            <div className="truncate text-sm font-medium">{p.name}</div>
                                            <button onClick={(e) => handleDeleteProject(p.id, e)} className="text-gray-400 hover:text-red-500 p-1 rounded">
                                                <span className="material-icons text-sm">delete</span>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </button>

                <div className="h-4 w-px bg-gray-700 mx-1 md:mx-2"></div>
                
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`text-gray-300 hover:text-white flex items-center space-x-1 text-xs md:text-sm font-medium bg-gray-800 px-3 py-1.5 rounded-md transition-colors ${!isSidebarOpen && 'text-fuchsia-400 border border-fuchsia-900'}`}>
                    <span className="material-icons text-sm">{isSidebarOpen ? 'fullscreen' : 'menu_open'}</span>
                    <span className="hidden md:inline">{isSidebarOpen ? 'Hide Cockpit' : 'Open Cockpit'}</span>
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors">
                    <span className="material-icons">close</span>
                </button>
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
            
            {/* Sidebar (Founder's Cockpit) */}
            <div 
                className={`bg-white border-r border-gray-200 flex flex-col absolute md:relative z-20 h-full shadow-xl md:shadow-none transition-all duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0'}`}
                style={{ width: isSidebarOpen ? (window.innerWidth < 768 ? '100%' : '400px') : '0px' }}
            >
                {/* Sidebar Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors flex flex-col items-center justify-center ${activeTab === 'chat' ? 'border-fuchsia-600 text-fuchsia-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                        <span className="material-icons text-lg mb-1">chat</span>
                        Architect
                    </button>
                    <button 
                        onClick={() => setActiveTab('gallery')}
                        className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors flex flex-col items-center justify-center ${activeTab === 'gallery' ? 'border-fuchsia-600 text-fuchsia-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                        <span className="material-icons text-lg mb-1">collections</span>
                        Inspo
                    </button>
                    <button 
                        onClick={() => setActiveTab('learn')}
                        className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors flex flex-col items-center justify-center ${activeTab === 'learn' ? 'border-fuchsia-600 text-fuchsia-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                        <span className="material-icons text-lg mb-1">school</span>
                        Learn
                    </button>
                    <button 
                        onClick={() => setActiveTab('design')}
                        className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors flex flex-col items-center justify-center ${activeTab === 'design' ? 'border-fuchsia-600 text-fuchsia-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                        <span className="material-icons text-lg mb-1">tune</span>
                        Settings
                    </button>
                </div>

                {/* CHAT TAB CONTENT */}
                {activeTab === 'chat' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[90%] p-3 rounded-xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-gray-900 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
                                        {msg.image && (
                                            <img src={`data:${msg.image.mimeType};base64,${msg.image.base64}`} alt="Attached" className="max-w-full rounded-lg mb-2 max-h-40 object-cover" />
                                        )}
                                        <div className="whitespace-pre-wrap">{msg.text}</div>
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm rounded-bl-none">
                                        <LoadingSpinner />
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        
                        {/* Strategy Strip (Suggestions) */}
                        <div className="px-4 py-2 bg-white border-t border-gray-100 flex space-x-2 overflow-x-auto scrollbar-hide">
                            <button onClick={() => handleSendMessage("Add AI Analytics with Gemini")} className="flex-shrink-0 px-3 py-1 bg-fuchsia-50 text-fuchsia-700 text-xs rounded-full border border-fuchsia-100 hover:bg-fuchsia-100 whitespace-nowrap flex items-center" title="Add AI Analytics"><span className="material-icons text-[12px] mr-1">analytics</span> Gemini Analytics</button>
                            <button onClick={() => handleSendMessage("Add Veo Video Player")} className="flex-shrink-0 px-3 py-1 bg-fuchsia-50 text-fuchsia-700 text-xs rounded-full border border-fuchsia-100 hover:bg-fuchsia-100 whitespace-nowrap flex items-center" title="Add Video Player"><span className="material-icons text-[12px] mr-1">play_circle</span> Veo Player</button>
                            <button onClick={() => handleSendMessage("Generate images with Imagen")} className="flex-shrink-0 px-3 py-1 bg-fuchsia-50 text-fuchsia-700 text-xs rounded-full border border-fuchsia-100 hover:bg-fuchsia-100 whitespace-nowrap flex items-center" title="Add Generated Images"><span className="material-icons text-[12px] mr-1">image</span> Imagen Assets</button>
                             <button onClick={() => handleSendMessage("Add Nano Banana effects")} className="flex-shrink-0 px-3 py-1 bg-fuchsia-50 text-fuchsia-700 text-xs rounded-full border border-fuchsia-100 hover:bg-fuchsia-100 whitespace-nowrap flex items-center" title="Add Fun Effects"><span className="material-icons text-[12px] mr-1">auto_fix_high</span> Nano Banana</button>
                        </div>

                        <div className="p-4 bg-white border-t border-gray-200">
                            {attachedImage && (
                                <div className="relative inline-block mb-2">
                                    <img src={attachedImage.preview} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                                    <button onClick={removeAttachedImage} className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-0.5 hover:bg-red-500">
                                        <span className="material-icons text-xs">close</span>
                                    </button>
                                </div>
                            )}
                            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative flex items-end space-x-2">
                                <textarea
                                    ref={textareaRef}
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Describe features, layout, logic..."
                                    className="flex-1 pl-4 pr-20 py-3 bg-gray-100 border border-transparent focus:bg-white focus:border-fuchsia-500 rounded-2xl focus:ring-2 focus:ring-fuchsia-200 outline-none text-sm transition-all text-gray-900 placeholder-gray-500 resize-none min-h-[48px] max-h-[300px]"
                                    rows={1}
                                    disabled={isChatLoading}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            // Enter creates new line as requested
                                        }
                                    }}
                                />
                                
                                {/* Attachment Button */}
                                <button 
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute right-24 bottom-2 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                                    title="Attach file or image"
                                >
                                    <span className="material-icons">attach_file</span>
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*,.txt,.md,.json" />

                                {/* Voice Input Button */}
                                <button 
                                    type="button"
                                    onClick={toggleListening}
                                    className={`absolute right-14 bottom-2 p-2 rounded-full transition-colors ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
                                    title="Voice Input"
                                >
                                    <span className="material-icons">{isListening ? 'mic' : 'mic_none'}</span>
                                </button>

                                <button 
                                    type="submit" 
                                    disabled={(!chatInput.trim() && !attachedImage) || isChatLoading}
                                    className="p-3 bg-fuchsia-600 text-white rounded-full hover:bg-fuchsia-700 disabled:opacity-50 transition-colors mb-1 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                >
                                    <span className="material-icons text-sm block">arrow_upward</span>
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* DESIGN TAB CONTENT */}
                {activeTab === 'design' && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Visual Identity</label>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-medium text-gray-500 mb-1">LAYOUT STYLE</label>
                                    <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-fuchsia-500">
                                        {styles.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium text-gray-500 mb-1">TYPOGRAPHY</label>
                                    <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-fuchsia-500">
                                        {fonts.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* GALLERY TAB */}
                {activeTab === 'gallery' && renderGallery()}

                {/* LEARN TAB */}
                {activeTab === 'learn' && renderLearn()}

                {/* Render Action Bar */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <button 
                        onClick={handleRenderApp}
                        disabled={isLoading}
                        className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black shadow-lg transition-transform transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ring-2 ring-offset-2 ring-gray-900 focus:ring-fuchsia-500"
                    >
                        {isLoading ? (
                            <span className="ml-2 text-sm">Building...</span>
                        ) : (
                            <>
                                <span className="material-icons mr-2 text-lg">{generatedCode ? 'autorenew' : 'auto_awesome'}</span>
                                <span className="text-lg">{generatedCode ? 'Update Build' : 'Build MVP'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-gray-100 relative flex flex-col h-full overflow-hidden">
                {generatedCode ? (
                    <>
                        {/* Toolbar */}
                        <div className="absolute top-4 right-4 z-10 flex space-x-2">
                             <button 
                                onClick={handleFullScreenPreview}
                                className="px-4 py-2 bg-black/80 text-white backdrop-blur-md rounded-full text-xs font-bold shadow-lg hover:bg-black transition-colors flex items-center"
                                title="Open in New Tab"
                            >
                                <span className="material-icons text-sm mr-2">open_in_new</span>
                                Full Screen
                            </button>
                             <button 
                                onClick={() => setShowCode(!showCode)}
                                className="px-4 py-2 bg-black/80 text-white backdrop-blur-md rounded-full text-xs font-bold shadow-lg hover:bg-black transition-colors flex items-center"
                            >
                                <span className="material-icons text-sm mr-2">{showCode ? 'preview' : 'code'}</span>
                                {showCode ? 'Preview' : 'Inspect Code'}
                            </button>
                            <button 
                                onClick={() => setShowRoadmap(true)} 
                                className="px-4 py-2 bg-fuchsia-600 text-white rounded-full text-xs font-bold shadow-lg hover:bg-fuchsia-700 transition-colors flex items-center group"
                                title="Launch Roadmap"
                            >
                                <span className="material-icons text-sm mr-2">rocket_launch</span>
                                Export Pack
                            </button>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 relative w-full h-full">
                            {showCode ? (
                                <textarea 
                                    value={generatedCode} 
                                    onChange={(e) => setGeneratedCode(e.target.value)}
                                    className="w-full h-full bg-gray-900 text-green-400 font-mono p-4 text-xs resize-none focus:outline-none"
                                    spellCheck={false}
                                />
                            ) : (
                                <iframe 
                                    srcDoc={generatedCode}
                                    title="App Preview"
                                    className="w-full h-full border-none bg-transparent"
                                    sandbox="allow-scripts allow-same-origin"
                                />
                            )}
                        </div>
                    </>
                ) : (
                    // Loading / Empty State
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                        {isLoading ? (
                            <div className="flex flex-col items-center animate-fadeIn">
                                <div className="relative w-24 h-24 mb-6">
                                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full opacity-25"></div>
                                    <div className="absolute inset-0 border-4 border-fuchsia-600 rounded-full border-t-transparent animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="material-icons text-4xl text-fuchsia-600 animate-pulse">construction</span>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800">Engineering Prototype...</h3>
                                <div className="mt-4 space-y-2 text-sm font-mono text-gray-500">
                                    <p className={`transition-opacity duration-500 ${loadingStep >= 0 ? 'opacity-100' : 'opacity-30'}`}>Compiling Logic...</p>
                                    <p className={`transition-opacity duration-500 ${loadingStep >= 1 ? 'opacity-100' : 'opacity-30'}`}>Applying {styles.find(s => s.id === selectedStyle)?.label} Theme...</p>
                                    <p className={`transition-opacity duration-500 ${loadingStep >= 2 ? 'opacity-100' : 'opacity-30'}`}>Injecting React State...</p>
                                    <p className={`transition-opacity duration-500 ${loadingStep >= 3 ? 'opacity-100' : 'opacity-30'}`}>Optimizing for Mobile...</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                                    <span className="material-icons text-5xl text-gray-400">rocket_launch</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-500">Start Vibe Coding</h3>
                                <p className="max-w-xs mt-2 text-sm mb-6">Describe your dream tool, dashboard, or app, and I'll build the functional prototype.</p>
                                {!isSidebarOpen && (
                                    <button 
                                        onClick={() => setIsSidebarOpen(true)}
                                        className="px-6 py-2 bg-fuchsia-600 text-white rounded-full text-sm font-bold shadow-md hover:bg-fuchsia-700 transition-colors"
                                    >
                                        Open Cockpit
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MVPBuilderModal;
