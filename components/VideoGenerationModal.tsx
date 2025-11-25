

import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { MediaAsset, subscribeToAssets, deleteAsset, auth } from '../services/firebase';

type Mode = 'text' | 'image';

interface VideoGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, aspectRatio: '16:9' | '9:16', sourceImage?: { base64: string, mimeType: string }) => Promise<void>;
  isLoading: boolean;
  loadingMessage: string;
  generatedVideo: string | null;
  initialMode: Mode;
  initialPrompt?: string;
  initialImage?: { base64: string, mimeType: string };
}

const blobToBase64 = (blob: Blob): Promise<{ base64: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve({ base64: base64String, mimeType: blob.type });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const VideoGenerationModal: React.FC<VideoGenerationModalProps> = ({ isOpen, onClose, onGenerate, isLoading, loadingMessage, generatedVideo, initialMode, initialPrompt, initialImage }) => {
  const [activeTab, setActiveTab] = useState<Mode>(initialMode);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [sourceImage, setSourceImage] = useState<{ file: File, url: string, data: { base64: string, mimeType: string } } | null>(null);
  
  // History
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  const [isKeyNeeded, setIsKeyNeeded] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  // Retry State
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimer, setRetryTimer] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = subscribeToAssets(auth.currentUser.uid, (allAssets) => {
        const videos = allAssets.filter(a => a.type === 'video');
        setAssets(videos);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen) {
        setActiveTab(initialMode);
        setPrompt(initialPrompt || '');
        setApiKeyError(false);
        setGeneralError(null);
        setRetryCount(0);
        setRetryTimer(0);
        checkApiKey();
        
        if (initialImage) {
             // Construct a pseudo-file object for display if needed, or just set data
             // Since we don't have the original File object easily, we mock it for display purposes
             // or we just rely on the data being present.
             const mockUrl = `data:${initialImage.mimeType};base64,${initialImage.base64}`;
             setSourceImage({
                 file: { name: 'Uploaded Image' } as File,
                 url: mockUrl,
                 data: initialImage
             });
             setActiveTab('image');
        } else {
            setSourceImage(null);
        }
    }
  }, [isOpen, initialMode, initialPrompt, initialImage]);

  useEffect(() => {
      if (generatedVideo) {
           setSelectedAsset({
              id: 'temp',
              userId: auth.currentUser?.uid || '',
              type: 'video',
              url: generatedVideo,
              prompt: prompt,
              createdAt: new Date().toISOString()
          });
          setRetryCount(0);
          setRetryTimer(0);
      }
  }, [generatedVideo]);

  const checkApiKey = async () => {
    if ((window as any).aistudio && typeof (window as any).aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setIsKeyNeeded(!hasKey);
    }
  };

  const handleSelectKey = async () => {
    if ((window as any).aistudio && typeof (window as any).aistudio.openSelectKey === 'function') {
      await (window as any).aistudio.openSelectKey();
      setIsKeyNeeded(false);
      setApiKeyError(false);
      setGeneralError(null);
    }
  };

  const handleSelectAsset = (asset: MediaAsset) => {
      setSelectedAsset(asset);
      setPrompt(asset.prompt);
  };

  const handleDeleteAsset = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(window.confirm("Delete this video?")) {
          if (auth.currentUser) await deleteAsset(auth.currentUser.uid, id);
          if (selectedAsset?.id === id) setSelectedAsset(null);
      }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const data = await blobToBase64(file);
      setSourceImage({ file, url, data });
    }
  };

  const executeGenerate = async (attempt: number) => {
    setGeneralError(null);
    setApiKeyError(false);
    
    try {
        await onGenerate(prompt, aspectRatio, sourceImage?.data);
    } catch (error: any) {
        console.error(`Video Generation Attempt ${attempt} Failed:`, error);
        let msg = error.message || error.toString();

        // Attempt to parse raw JSON error
        const jsonMatch = msg.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.error && parsed.error.message) {
                    msg = parsed.error.message;
                }
            } catch (e) {}
        }

        // 1. Check for HARD Quota limits (429 / Resource Exhausted)
        // If we hit this, retrying immediately won't help.
        const isQuotaError = msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429") || msg.toLowerCase().includes("quota");
        
        if (isQuotaError) {
            setGeneralError("Daily video generation limit reached. Please try again tomorrow or contact support.");
            return; // Do NOT retry
        }

        // 2. Check for API Key issues
        if (msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("entity was not found") || msg.includes("404")) {
            setApiKeyError(true);
            setIsKeyNeeded(true);
            return; // Do NOT retry
        }

        // 3. If it's a soft error (like server busy), retry up to 3 times
        if (attempt < 3) {
             // Auto-Retry Logic for transient Rate Limits (RPM)
             const waitTime = (attempt + 1) * 5; // 5s, 10s, 15s
             setRetryTimer(waitTime);
             setRetryCount(attempt + 1);
             
             const interval = setInterval(() => {
                 setRetryTimer((prev) => {
                     if (prev <= 1) {
                         clearInterval(interval);
                         return 0;
                     }
                     return prev - 1;
                 });
             }, 1000);

             setTimeout(() => {
                 executeGenerate(attempt + 1);
             }, waitTime * 1000);
             return; 
         }
         
        // If all retries fail
        setGeneralError(msg);
        setRetryCount(0);
        setRetryTimer(0);
    }
  };

  const handleSubmit = async () => {
    if (activeTab === 'image' && !sourceImage) {
        setGeneralError("Please upload an image to animate.");
        return;
    }
    setRetryCount(0);
    executeGenerate(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col md:flex-row bg-gray-900 text-white font-sans animate-fadeIn">
        {/* Sidebar: History */}
        <div className="w-full md:w-80 flex-shrink-0 bg-gray-800 border-b md:border-b-0 md:border-r border-gray-700 flex flex-col h-1/3 md:h-full">
            <div className="p-4 pb-2">
                <button onClick={onClose} className="w-full mb-2 flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors">
                    <span className="material-icons">arrow_back</span>
                    <span>Back to Dashboard</span>
                </button>
            </div>
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-gray-100">Video Gallery</h3>
                <span className="text-xs text-gray-500">{assets.length} items</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {assets.map(asset => (
                    <div 
                        key={asset.id} 
                        onClick={() => handleSelectAsset(asset)}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedAsset?.id === asset.id ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/30' : 'border-transparent hover:border-gray-600'}`}
                    >
                        <video src={asset.url} className="w-full h-24 object-cover pointer-events-none" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10">
                            <span className="material-icons text-white drop-shadow-lg">play_circle_outline</span>
                        </div>
                        <button 
                            onClick={(e) => handleDeleteAsset(e, asset.id)}
                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                            <span className="material-icons text-xs">close</span>
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 truncate">
                             <p className="text-[10px] text-gray-300 truncate">{asset.prompt}</p>
                        </div>
                    </div>
                ))}
                {assets.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        No videos generated yet.
                    </div>
                )}
            </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col relative bg-gray-900 h-2/3 md:h-full">
            {/* Header */}
            <div className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900">
                <div className="flex items-center">
                    <h2 className="text-lg font-bold flex items-center mr-3">
                        <span className="material-icons text-fuchsia-500 mr-2">videocam</span>
                        Video Studio (Veo)
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 tracking-wide">
                        BETA
                    </span>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
                    <span className="material-icons">close</span>
                </button>
            </div>

            {/* Info Banner */}
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center text-xs text-amber-200">
                <span className="material-icons text-sm mr-2">info</span>
                <span>Veo is in Beta. Provisioning limits are currently low. We have requested quota increases from Google.</span>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                {retryCount > 0 ? (
                    <div className="flex flex-col items-center text-center bg-gray-800 p-8 rounded-2xl shadow-2xl border border-fuchsia-500/30">
                        <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                            <svg className="animate-spin absolute w-full h-full text-fuchsia-500 opacity-50" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="30 60" />
                            </svg>
                            <span className="text-xl font-bold text-white">{retryTimer}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">High Traffic Volume</h3>
                        <p className="text-gray-300 text-sm mb-4 max-w-md">
                            Our video servers are experiencing high demand. We are automatically queuing your request...
                        </p>
                        <p className="text-fuchsia-400 text-xs font-mono uppercase tracking-wider">
                            Attempt {retryCount}/3
                        </p>
                    </div>
                ) : isLoading ? (
                     <div className="flex flex-col items-center text-center">
                        <LoadingSpinner />
                        <p className="mt-4 text-fuchsia-400 animate-pulse font-medium text-lg">Generating Video...</p>
                        <p className="text-gray-500 text-sm mt-2">{loadingMessage}</p>
                     </div>
                ) : generalError ? (
                    <div className="text-center max-w-md p-6 bg-red-900/30 border border-red-800 rounded-lg animate-fadeIn">
                        <span className="material-icons text-4xl text-red-500 mb-2">error_outline</span>
                        <h3 className="text-lg font-bold text-white mb-2">Generation Failed</h3>
                        <p className="text-red-200 text-sm mb-4">{generalError}</p>
                        <button onClick={() => setGeneralError(null)} className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded text-sm">
                            Dismiss
                        </button>
                    </div>
                ) : selectedAsset ? (
                    <div className="relative max-w-full max-h-full shadow-2xl group">
                        <video 
                            src={selectedAsset.url} 
                            controls 
                            autoPlay 
                            loop 
                            className="max-w-full max-h-[calc(100vh-250px)] object-contain rounded-lg border border-gray-800" 
                        />
                        <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a 
                                href={selectedAsset.url} 
                                download={`sb-video-${Date.now()}.mp4`} 
                                className="p-2 bg-gray-900/80 hover:bg-fuchsia-600 text-white rounded-full backdrop-blur-sm transition-colors shadow-lg"
                                title="Download"
                            >
                                <span className="material-icons">download</span>
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-600">
                        <span className="material-icons text-6xl opacity-20">movie_creation</span>
                        <p className="mt-4 text-lg font-medium opacity-50">Bring your ideas to life with Veo</p>
                    </div>
                )}
            </div>

            {/* Bottom Control Bar */}
            <div className="h-auto min-h-[80px] bg-gray-800 border-t border-gray-700 p-4 px-6 flex flex-col md:flex-row items-stretch md:items-end space-y-3 md:space-y-0 md:space-x-4">
                
                {/* Mode Toggle */}
                <div className="flex bg-gray-900 rounded-lg p-1 self-start md:self-end border border-gray-700 mb-2 md:mb-0">
                    <button 
                        onClick={() => setActiveTab('text')}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center ${activeTab === 'text' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        <span className="material-icons text-sm mr-1">text_fields</span>
                        Text
                    </button>
                    <button 
                        onClick={() => setActiveTab('image')}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center ${activeTab === 'image' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        <span className="material-icons text-sm mr-1">image</span>
                        Image
                    </button>
                </div>

                <div className="flex-1 space-y-2">
                    {activeTab === 'image' && (
                        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-300">
                            {sourceImage ? (
                                <div className="flex items-center space-x-2 flex-1 overflow-hidden">
                                    <img src={sourceImage.url} alt="Source" className="h-8 w-8 rounded object-cover flex-shrink-0" />
                                    <span className="text-xs text-gray-700 truncate">{sourceImage.file.name}</span>
                                    <button onClick={() => setSourceImage(null)} className="text-gray-500 hover:text-red-500 ml-auto">
                                        <span className="material-icons text-sm">close</span>
                                    </button>
                                </div>
                            ) : (
                                <label className="flex-1 cursor-pointer flex items-center justify-center text-xs text-gray-600 hover:text-fuchsia-600">
                                    <span className="material-icons text-sm mr-2">upload_file</span>
                                    Upload Image to Animate
                                    <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleImageUpload} />
                                </label>
                            )}
                        </div>
                    )}
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={activeTab === 'text' ? "Describe the video you want to create..." : "Describe how you want to animate this image..."}
                        className="w-full bg-white text-gray-900 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 resize-none h-12 placeholder-gray-500"
                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if(!isLoading) handleSubmit(); } }}
                    />
                </div>
                
                <div className="w-full md:w-32">
                     <label className="text-xs font-medium text-gray-400 ml-1 mb-1 block">Aspect Ratio</label>
                     <select 
                        value={aspectRatio} 
                        onChange={(e) => setAspectRatio(e.target.value as any)}
                        className="w-full h-12 bg-white text-gray-900 border-gray-300 rounded-lg px-3 focus:ring-2 focus:ring-fuchsia-500 outline-none"
                    >
                        <option value="16:9">16:9 (Wide)</option>
                        <option value="9:16">9:16 (Reel)</option>
                     </select>
                </div>

                <div className="flex flex-col space-y-1">
                    {isKeyNeeded || apiKeyError ? (
                        <button
                            onClick={handleSelectKey}
                            className="h-12 px-6 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-lg flex items-center justify-center whitespace-nowrap animate-pulse"
                        >
                            <span className="material-icons mr-2">key</span>
                            Select API Key
                        </button>
                    ) : (
                        <button 
                            onClick={handleSubmit}
                            disabled={isLoading || !prompt.trim() || (activeTab === 'image' && !sourceImage)}
                            className="h-12 px-8 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-fuchsia-500/30 flex items-center justify-center"
                        >
                            {isLoading ? 'Generating...' : 'Generate'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default VideoGenerationModal;