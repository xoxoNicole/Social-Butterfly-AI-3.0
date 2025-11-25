
import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { UserProfile } from '../services/firebase';
import { GoogleGenAI } from '@google/genai';

interface WebsiteGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onGenerate: (prompt: string, style: string, currentHtml?: string, refinementRequest?: string) => Promise<string>;
  isLoading: boolean;
}

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

const imageVibes = [
    { id: 'business', label: 'Professional / Office' },
    { id: 'nature', label: 'Calm / Nature' },
    { id: 'tech', label: 'Technology / Abstract' },
    { id: 'fashion', label: 'Lifestyle / Fashion' },
    { id: 'minimal', label: 'Minimalist / Objects' }
];

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const WebsiteGeneratorModal: React.FC<WebsiteGeneratorModalProps> = ({ isOpen, onClose, userProfile, onGenerate, isLoading: parentIsLoading }) => {
  // Visual Settings
  const [selectedStyle, setSelectedStyle] = useState(styles[0].id);
  const [selectedFont, setSelectedFont] = useState(fonts[0].id);
  const [selectedImageVibe, setSelectedImageVibe] = useState(imageVibes[0].id);
  
  // Site State
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'design'>('chat');
  const [showCode, setShowCode] = useState(false);
  const [showPublishWizard, setShowPublishWizard] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); // Local loading state
  
  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // AI Instance for Local Chat
  const aiRef = useRef<GoogleGenAI | null>(null);

  // Combine loading states
  const isLoading = parentIsLoading || isGenerating;

  useEffect(() => {
      if (process.env.API_KEY) {
          aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
      }
  }, []);

  useEffect(() => {
      if (isOpen) {
          // Initialize chat with a welcome message based on profile
          const welcomeMsg = userProfile.business 
            ? `I see you're building for **${userProfile.business}**. Let's architect the perfect landing page.\n\nWhat's the main goal of this page? (e.g., Capture emails, Sell a course, Book calls)`
            : `Welcome to the Site Architect! 🏗️\n\nTell me about your business or idea. I'll help you craft the strategy, copy, and layout before we build it.`;
          
          setChatHistory([{ role: 'model', text: welcomeMsg }]);
          setGeneratedCode(null);
          setIsSidebarOpen(true);
          setShowPublishWizard(false);
          setIsGenerating(false);
      }
  }, [isOpen, userProfile]);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, activeTab]);

  const handleSendMessage = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!chatInput.trim() || isChatLoading) return;

      const userMsg = chatInput;
      setChatInput('');
      
      // Optimistically add user message
      setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
      setIsChatLoading(true);

      try {
          if (!aiRef.current) throw new Error("AI not initialized");

          const systemInstruction = `You are an expert Landing Page Strategist and Copywriter. 
          Your goal is to help the user define the content, structure, and persuasion strategy for their website.
          
          1. Ask clarifying questions about their audience, offer, and unique value proposition.
          2. Suggest high-converting headlines or copy blocks.
          3. Keep responses concise and conversational. 
          4. DO NOT generate HTML code in the chat. Just discuss the plan. The user will click "Render" to generate code.`;

          // Construct history for API from EXISTING state (before this new message)
          // Filter out empty messages to prevent API errors
          const history = chatHistory
            .filter(msg => msg.text && msg.text.trim().length > 0)
            .map(msg => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.text }]
            }));

          const chat = aiRef.current.chats.create({
              model: 'gemini-2.5-flash',
              config: { systemInstruction },
              history
          });

          const result = await chat.sendMessage({ message: userMsg });
          const responseText = result.text; // Correct property access for text

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

  const handleRenderSite = async () => {
      setIsGenerating(true);
      try {
        // Combine chat history into a context prompt
        const conversationContext = chatHistory.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
        
        const prompt = `
        **CONTEXT FROM STRATEGY SESSION:**
        ${conversationContext}
        
        **DESIGN SETTINGS:**
        - Style: ${selectedStyle} (${styles.find(s => s.id === selectedStyle)?.desc})
        - Font: ${selectedFont}
        - Image Vibe: ${selectedImageVibe}
        
        **INSTRUCTIONS:**
        Generate the full HTML landing page based on the strategy session above. 
        - Use the copy and structure discussed.
        - If specific copy wasn't defined, generate high-converting placeholder copy based on the business context.
        - STRICTLY follow the layout rules (no absolute positioning, use Tailwind grid/flex).
        - Ensure all images use the provided placeholder service (picsum.photos) or similar reliable source.
        `;

        // If code exists, we treat this as a refinement of the existing code
        const code = await onGenerate(prompt, selectedStyle, generatedCode || undefined, generatedCode ? "Update the site based on the latest conversation conversation." : undefined);
        setGeneratedCode(code);
        
        // On mobile, collapse sidebar to show result
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
      } catch (error) {
          console.error("Render Site Error:", error);
          setChatHistory(prev => [...prev, { role: 'model', text: "❌ I encountered an error while rendering the site. Please try again or check your connection." }]);
      } finally {
          setIsGenerating(false);
      }
  };

  const handleDownload = () => {
      if (!generatedCode) return;
      const blob = new Blob([generatedCode], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `index.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden relative" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gray-900 p-3 md:p-4 flex justify-between items-center flex-shrink-0 border-b border-gray-800">
             <div className="flex items-center space-x-3 text-white">
                <div className="p-2 bg-fuchsia-600 rounded-lg hidden md:block">
                    <span className="material-icons text-xl">web</span>
                </div>
                <div>
                    <h2 className="text-base md:text-lg font-bold tracking-wide flex items-center">
                        Landing Page Architect 
                        <span className="ml-2 text-[10px] bg-fuchsia-900 text-fuchsia-300 px-2 py-0.5 rounded-full border border-fuchsia-700">BETA</span>
                    </h2>
                </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`text-gray-300 hover:text-white flex items-center space-x-1 text-xs md:text-sm font-medium bg-gray-800 px-3 py-1.5 rounded-md transition-colors ${!isSidebarOpen && 'text-fuchsia-400 border border-fuchsia-900'}`}>
                    <span className="material-icons text-sm">{isSidebarOpen ? 'fullscreen' : 'menu_open'}</span>
                    <span className="hidden md:inline">{isSidebarOpen ? 'Hide Architect' : 'Open Architect'}</span>
                </button>
                <div className="h-4 w-px bg-gray-700 mx-1 md:mx-2"></div>
                <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors">
                    <span className="material-icons">close</span>
                </button>
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
            
            {/* Sidebar (Architect) */}
            <div 
                className={`bg-white border-r border-gray-200 flex flex-col absolute md:relative z-20 h-full shadow-xl md:shadow-none transition-all duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0'}`}
                style={{ width: isSidebarOpen ? (window.innerWidth < 768 ? '100%' : '400px') : '0px' }}
            >
                {/* Sidebar Tabs */}
                <div className="flex border-b border-gray-200">
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center ${activeTab === 'chat' ? 'border-fuchsia-600 text-fuchsia-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <span className="material-icons text-sm mr-2">chat</span>
                        Strategy & Copy
                    </button>
                    <button 
                        onClick={() => setActiveTab('design')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center ${activeTab === 'design' ? 'border-fuchsia-600 text-fuchsia-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <span className="material-icons text-sm mr-2">palette</span>
                        Design Settings
                    </button>
                </div>

                {/* CHAT TAB CONTENT */}
                {activeTab === 'chat' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-xl text-sm whitespace-pre-wrap shadow-sm ${msg.role === 'user' ? 'bg-gray-900 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
                                        {msg.text}
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
                        
                        <div className="p-4 bg-white border-t border-gray-200">
                            <form onSubmit={handleSendMessage} className="relative">
                                <input 
                                    type="text" 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Discuss copy, strategy, or changes..."
                                    className="w-full pl-4 pr-12 py-3 bg-gray-100 border border-transparent focus:bg-white focus:border-fuchsia-500 rounded-full focus:ring-2 focus:ring-fuchsia-200 outline-none text-sm transition-all text-gray-900 placeholder-gray-500"
                                    disabled={isChatLoading}
                                />
                                <button 
                                    type="submit" 
                                    disabled={!chatInput.trim() || isChatLoading}
                                    className="absolute right-2 top-1.5 p-1.5 bg-fuchsia-600 text-white rounded-full hover:bg-fuchsia-700 disabled:opacity-50 transition-colors"
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
                                    <p className="text-[10px] text-gray-400 mt-1">{styles.find(s => s.id === selectedStyle)?.desc}</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium text-gray-500 mb-1">TYPOGRAPHY</label>
                                    <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-fuchsia-500">
                                        {fonts.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium text-gray-500 mb-1">IMAGE AESTHETIC</label>
                                    <select value={selectedImageVibe} onChange={(e) => setSelectedImageVibe(e.target.value)} className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-fuchsia-500">
                                        {imageVibes.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center">
                                <span className="material-icons text-sm mr-1">lightbulb</span> Pro Tip
                            </h4>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                The "Architect Chat" is the most powerful tool. Use it to define your value prop before generating. After generating, use the chat to request specific changes (e.g., "Make the buttons rounder", "Add a pricing section").
                            </p>
                        </div>
                    </div>
                )}

                {/* Render Action Bar */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <button 
                        onClick={handleRenderSite}
                        disabled={isLoading}
                        className="w-full py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black shadow-lg transition-transform transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <LoadingSpinner />
                                <span className="ml-2 text-sm">Architecting...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-icons mr-2 text-sm">{generatedCode ? 'autorenew' : 'auto_awesome'}</span>
                                {generatedCode ? 'Update Render' : 'Render Site'}
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
                                onClick={() => setShowCode(!showCode)}
                                className="px-4 py-2 bg-black/80 text-white backdrop-blur-md rounded-full text-xs font-bold shadow-lg hover:bg-black transition-colors flex items-center"
                            >
                                <span className="material-icons text-sm mr-2">code</span>
                                {showCode ? 'Hide Code' : 'View Code'}
                            </button>
                            <button 
                                onClick={() => setShowPublishWizard(true)} 
                                className="px-4 py-2 bg-fuchsia-600 text-white rounded-full text-xs font-bold shadow-lg hover:bg-fuchsia-700 transition-colors flex items-center group"
                                title="Export code"
                            >
                                <span className="material-icons text-sm mr-2">save_alt</span>
                                Export Site
                            </button>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 relative w-full h-full">
                            {showCode ? (
                                <textarea 
                                    readOnly 
                                    value={generatedCode} 
                                    className="w-full h-full bg-gray-900 text-green-400 font-mono p-4 text-xs resize-none focus:outline-none"
                                />
                            ) : (
                                <iframe 
                                    srcDoc={generatedCode}
                                    title="Website Preview"
                                    className="w-full h-full border-none bg-white"
                                    sandbox="allow-scripts"
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
                                        <span className="material-icons text-4xl text-fuchsia-600 animate-pulse">architecture</span>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800">Architecting Vision...</h3>
                                <div className="mt-4 space-y-2 text-sm font-mono text-gray-500">
                                    <p className="animate-pulse delay-75">Writing semantic HTML5...</p>
                                    <p className="animate-pulse delay-150">Applying {styles.find(s => s.id === selectedStyle)?.label} typography...</p>
                                    <p className="animate-pulse delay-300">Ensuring mobile responsiveness...</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                                    <span className="material-icons text-5xl text-gray-400">chat</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-500">Start the Conversation</h3>
                                <p className="max-w-xs mt-2 text-sm mb-6">Use the Architect Chat on the left to define your strategy and copy, then click Render.</p>
                                {!isSidebarOpen && (
                                    <button 
                                        onClick={() => setIsSidebarOpen(true)}
                                        className="px-6 py-2 bg-fuchsia-600 text-white rounded-full text-sm font-bold shadow-md hover:bg-fuchsia-700 transition-colors"
                                    >
                                        Open Architect
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Export Options Modal */}
            {showPublishWizard && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 relative text-center">
                        <button 
                            onClick={() => setShowPublishWizard(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <span className="material-icons">close</span>
                        </button>
                        
                        <div className="w-16 h-16 bg-fuchsia-100 text-fuchsia-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-icons text-3xl">save_alt</span>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Export Your Website</h3>
                        <p className="text-gray-600 mb-8">Your design is ready. Grab the code below.</p>
                        
                        <div className="space-y-4">
                            <button 
                                onClick={handleDownload}
                                className="w-full py-4 bg-gray-900 text-white text-lg font-bold rounded-xl hover:bg-black shadow-lg flex items-center justify-center transition-transform transform hover:-translate-y-1"
                            >
                                <span className="material-icons mr-3">download</span>
                                Download index.html
                            </button>

                            <button 
                                onClick={() => {
                                    if (generatedCode) {
                                        navigator.clipboard.writeText(generatedCode);
                                        alert("Code copied to clipboard!");
                                    }
                                }}
                                className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-colors"
                            >
                                <span className="material-icons mr-3 text-gray-400">content_copy</span>
                                Copy Source Code
                            </button>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">How to go live?</p>
                            <p className="text-sm text-gray-600">
                                You can host this file anywhere (WordPress, Shopify, Squarespace custom code, or drag-and-drop hosts like <a href="https://app.netlify.com/drop" target="_blank" rel="noopener noreferrer" className="text-fuchsia-600 hover:underline font-medium">Netlify Drop</a>).
                            </p>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default WebsiteGeneratorModal;
