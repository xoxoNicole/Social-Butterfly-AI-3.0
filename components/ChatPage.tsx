import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Chat, LiveServerMessage, Modality, Blob, LiveSession } from '@google/genai';
import { ChatMessage, Task } from '../types';
import { generateSystemInstruction } from '../constants';
import Header from './Header';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import Dashboard, { DashboardAction } from './Dashboard';
import OnboardingModal from './OnboardingModal';
import TaskModal from './TaskModal';
import ProfileModal from './ProfileModal';
import GoToMarketPlanner, { GtmFormData } from './GoToMarketPlanner';

interface ChatPageProps {
  onGoHome: () => void;
}

// --- Audio Utility Functions ---
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

function createBlob(data: Float32Array): Blob {
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
// --- End Audio Utility Functions ---


const ChatPage: React.FC<ChatPageProps> = ({ onGoHome }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showTasks, setShowTasks] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showGtmPlanner, setShowGtmPlanner] = useState<boolean>(false);

  // Feature states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<{ name: string; business: string; photo: string; role: string; }>({ name: '', business: '', photo: '', role: '' });
  const [isInitialOnboardingFlow, setIsInitialOnboardingFlow] = useState(false);

  // --- Voice Agent State ---
  const [isListening, setIsListening] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [liveTranscription, setLiveTranscription] = useState({ user: '', model: ''});
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const audioResourcesRef = useRef<{
    stream: MediaStream | null;
    inputAudioContext: AudioContext | null;
    outputAudioContext: AudioContext | null;
    scriptProcessor: ScriptProcessorNode | null;
    source: MediaStreamAudioSourceNode | null;
    outputSources: Set<AudioBufferSourceNode>;
    nextStartTime: number;
  }>({
    stream: null,
    inputAudioContext: null,
    outputAudioContext: null,
    scriptProcessor: null,
    source: null,
    outputSources: new Set(),
    nextStartTime: 0,
  });
  const fullTurnTranscriptions = useRef({ user: '', model: ''});

  // --- Initialization and Data Persistence ---

  const initChat = useCallback((profileData?: { name: string; business: string; role: string; }) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const systemInstruction = generateSystemInstruction(profileData);
      const newChat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: systemInstruction,
        },
      });
      setChat(newChat);
      if (messages.length === 0) {
        setMessages([
          {
            role: 'model',
            parts: [{ text: 'Hello! I am Social Butterfly-AI 3.0. How can I help you bring your God-given idea to life today? Select a feature below or type your own message to get started.' }],
          },
        ]);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to initialize the chat. Please check your API key and refresh the page.');
    }
  }, [messages.length]);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');

    try {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) setTasks(JSON.parse(storedTasks));
    } catch (e) { console.error("Failed to parse tasks", e); }
    
    let userProfile = { name: '', business: '', photo: '', role: '' };
    try {
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          userProfile = { ...userProfile, ...parsed };
        }
    } catch (e) { console.error("Failed to parse profile", e); }
    setProfile(userProfile);
    
    if (!hasCompletedOnboarding) {
      setIsInitialOnboardingFlow(true);
      setShowProfile(true);
    }
    
    initChat(userProfile);

    return () => { // Cleanup on unmount
      if (sessionPromiseRef.current) stopVoiceSession();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  useEffect(() => {
    try { localStorage.setItem('tasks', JSON.stringify(tasks)); } 
    catch(e) { console.error("Failed to save tasks", e); }
  }, [tasks]);
  
  const handleSaveProfile = (newProfile: { name: string; business: string; photo: string; role: string; }) => {
    setProfile(newProfile);
    try { localStorage.setItem('userProfile', JSON.stringify(newProfile)); } 
    catch(e) { console.error("Failed to save profile", e); }
    initChat(newProfile); // Re-initialize chat with new context
    setShowProfile(false);
    if (isInitialOnboardingFlow) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingFinish = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    setShowOnboarding(false);
    setIsInitialOnboardingFlow(false);
  };

  // --- Message Handling ---

  const handleSendMessage = useCallback(async (userInput: string) => {
    if (!chat || isLoading) return;

    setIsLoading(true);
    setError(null);
    const userMessage: ChatMessage = { role: 'user', parts: [{ text: userInput }] };
    
    setMessages(prev => [...prev, userMessage, { role: 'model', parts: [{ text: '' }] }]);

    try {
      const stream = await chat.sendMessageStream({ message: userInput });

      let fullResponse = '';
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        fullResponse += chunkText;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].parts[0].text = fullResponse;
          return newMessages;
        });
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to get a response: ${errorMessage}`);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [chat, isLoading]);

  const handleDashboardAction = (action: DashboardAction) => {
    if (action.type === 'send_message') {
        handleSendMessage(action.payload);
    } else if (action.type === 'open_modal' && action.payload === 'gtm') {
        setShowGtmPlanner(true);
    }
  };

  const handleGenerateGtmPlan = (data: GtmFormData) => {
    const prompt = `Please generate a Go-to-Market Strategy based on the following details:
- **Ideal Customer Persona:** ${data.audience}
- **Unique Value Proposition:** ${data.valueProp}
- **Selected Marketing Channels:** ${data.channels.join(', ')}
- **Primary Launch Goals:** ${data.goals}

Please structure the output with a Customer Journey Map, Launch Phases, and a Marketing Message Framework.`;
    handleSendMessage(prompt);
    setShowGtmPlanner(false);
  };

  // --- Voice Agent Logic ---
  const stopVoiceSession = useCallback(async () => {
    setIsListening(false);
    setVoiceState('idle');
    if (sessionPromiseRef.current) {
        try {
            const session = await sessionPromiseRef.current;
            session.close();
        } catch (e) {
            console.error("Error closing session", e);
        }
        sessionPromiseRef.current = null;
    }
    
    const res = audioResourcesRef.current;
    res.stream?.getTracks().forEach(track => track.stop());
    res.scriptProcessor?.disconnect();
    res.source?.disconnect();
    if (res.inputAudioContext?.state !== 'closed') res.inputAudioContext?.close();
    if (res.outputAudioContext?.state !== 'closed') res.outputAudioContext?.close();
    
    Object.assign(res, { stream: null, scriptProcessor: null, source: null, inputAudioContext: null, outputAudioContext: null });
    res.outputSources.clear();
    res.nextStartTime = 0;
    setLiveTranscription({ user: '', model: ''});
    fullTurnTranscriptions.current = { user: '', model: ''};
  }, []);


  const startVoiceSession = useCallback(async () => {
    setIsListening(true);
    setError(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const systemInstruction = generateSystemInstruction(profile);

        const res = audioResourcesRef.current;
        res.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        res.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        res.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    setVoiceState('listening');
                    const inputAudioContext = audioResourcesRef.current.inputAudioContext!;
                    const stream = audioResourcesRef.current.stream!;
                    
                    res.source = inputAudioContext.createMediaStreamSource(stream);
                    res.scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);

                    res.scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        
                        sessionPromiseRef.current?.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    res.source.connect(res.scriptProcessor);
                    res.scriptProcessor.connect(inputAudioContext.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    let userInput = '';
                    let modelOutput = '';
                    if (message.serverContent?.inputTranscription) {
                        userInput = message.serverContent.inputTranscription.text;
                        fullTurnTranscriptions.current.user = userInput;
                        setVoiceState('processing');
                    }
                    if (message.serverContent?.outputTranscription) {
                        modelOutput = message.serverContent.outputTranscription.text;
                        fullTurnTranscriptions.current.model = modelOutput;
                    }
                    setLiveTranscription({ user: fullTurnTranscriptions.current.user, model: fullTurnTranscriptions.current.model });

                    if (message.serverContent?.turnComplete) {
                        if (fullTurnTranscriptions.current.user.trim()) {
                            setMessages(prev => [...prev, { role: 'user', parts: [{ text: fullTurnTranscriptions.current.user }] }]);
                        }
                        if (fullTurnTranscriptions.current.model.trim()) {
                           setMessages(prev => [...prev, { role: 'model', parts: [{ text: fullTurnTranscriptions.current.model }] }]);
                        }
                        fullTurnTranscriptions.current = { user: '', model: '' };
                        setLiveTranscription({ user: '', model: ''});
                        setVoiceState('listening'); // Ready for next turn
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                    if (base64Audio) {
                        setVoiceState('speaking');
                        const outputAudioContext = audioResourcesRef.current.outputAudioContext!;
                        const res = audioResourcesRef.current;
                        res.nextStartTime = Math.max(res.nextStartTime, outputAudioContext.currentTime);

                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                        const source = outputAudioContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAudioContext.destination);
                        source.addEventListener('ended', () => {
                            res.outputSources.delete(source);
                            if (res.outputSources.size === 0 && voiceState !== 'idle') {
                                setVoiceState('listening');
                            }
                        });
                        source.start(res.nextStartTime);
                        res.nextStartTime += audioBuffer.duration;
                        res.outputSources.add(source);
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Voice session error:', e);
                    setError('An error occurred with the voice session.');
                    stopVoiceSession();
                },
                onclose: (e: CloseEvent) => {
                   stopVoiceSession();
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction: systemInstruction,
            },
        });
    } catch (e) {
        console.error('Failed to start voice session', e);
        setError('Could not start voice session. Please ensure microphone permissions are granted.');
        stopVoiceSession();
    }
  }, [stopVoiceSession, profile]);

  const handleToggleVoice = useCallback(() => {
    if (isListening) {
      stopVoiceSession();
    } else {
      startVoiceSession();
    }
  }, [isListening, startVoiceSession, stopVoiceSession]);

  // --- Task Management ---
  const handleToggleTasks = () => setShowTasks(prev => !prev);
  const handleAddTask = (text: string) => setTasks(prev => [...prev, { id: Date.now(), text, completed: false }]);
  const handleToggleTask = (id: number) => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const handleDeleteTask = (id: number) => setTasks(prev => prev.filter(t => t.id !== id));

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800">
      {showOnboarding && <OnboardingModal onFinish={handleOnboardingFinish} />}
      <TaskModal isOpen={showTasks} onClose={handleToggleTasks} tasks={tasks} onAddTask={handleAddTask} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} onSave={handleSaveProfile} currentProfile={profile} />
      <GoToMarketPlanner isOpen={showGtmPlanner} onClose={() => setShowGtmPlanner(false)} onGenerate={handleGenerateGtmPlan} />
      
      <Header onGoHome={onGoHome} onToggleTasks={handleToggleTasks} onOpenProfile={() => setShowProfile(true)} isChatPage={true} profile={profile} />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <MessageList messages={messages} isLoading={isLoading && !isListening} userProfilePhoto={profile.photo} />
          {messages.length === 1 && <Dashboard onAction={handleDashboardAction} />}
          {error && <div className="text-red-500 text-center p-4 bg-red-100 rounded-lg">{error}</div>}
      </main>
      
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isListening={isListening}
        onToggleVoice={handleToggleVoice}
        voiceState={voiceState}
        liveTranscription={liveTranscription}
      />
    </div>
  );
};

export default ChatPage;