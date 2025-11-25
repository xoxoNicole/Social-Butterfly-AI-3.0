
import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { addWatermarkToImage } from '../utils/watermark';
import { MediaAsset, subscribeToAssets, deleteAsset, auth } from '../services/firebase';

interface ImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, aspectRatio: string, modelType: 'imagen' | 'flash') => void;
  isLoading: boolean;
  generatedImage: string | null;
  initialPrompt?: string;
}

const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({ isOpen, onClose, onGenerate, isLoading, generatedImage, initialPrompt }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [modelType, setModelType] = useState<'imagen' | 'flash'>('imagen');
  const [watermarkedImage, setWatermarkedImage] = useState<string | null>(null);
  const [isProcessingWatermark, setIsProcessingWatermark] = useState(false);
  
  // Mobile History Toggle
  // False by default on mobile so the user sees the creation canvas first
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  
  // History State
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = subscribeToAssets(auth.currentUser.uid, (allAssets) => {
        const images = allAssets.filter(a => a.type === 'image');
        setAssets(images);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
      if (isOpen && initialPrompt) {
          setPrompt(initialPrompt);
      } else if (isOpen && !initialPrompt) {
          setPrompt('');
      }
      // Always reset mobile history to closed when opening fresh
      setShowMobileHistory(false);
  }, [isOpen, initialPrompt]);

  useEffect(() => {
    if (generatedImage) {
      const processWatermark = async () => {
        setIsProcessingWatermark(true);
        try {
          const watermarked = await addWatermarkToImage(generatedImage);
          setWatermarkedImage(watermarked);
          // Set as selected view
          setSelectedAsset({
              id: 'temp',
              userId: auth.currentUser?.uid || '',
              type: 'image',
              url: watermarked,
              prompt: prompt,
              createdAt: new Date().toISOString()
          });
          // Auto-hide history on mobile when new image arrives so user sees the result
          setShowMobileHistory(false);
        } catch (e) {
          console.error("Failed to watermark image", e);
          setWatermarkedImage(generatedImage);
        } finally {
          setIsProcessingWatermark(false);
        }
      };
      processWatermark();
    }
  }, [generatedImage]);

  const handleSelectAsset = (asset: MediaAsset) => {
      setSelectedAsset(asset);
      setWatermarkedImage(asset.url);
      setPrompt(asset.prompt);
      // Try to infer aspect ratio from meta if available, else keep current
      if (asset.meta?.aspectRatio) setAspectRatio(asset.meta.aspectRatio);
      // On mobile, close history after selection to see image
      setShowMobileHistory(false);
  };

  const handleDeleteAsset = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(window.confirm("Delete this image?")) {
          if (auth.currentUser) await deleteAsset(auth.currentUser.uid, id);
          if (selectedAsset?.id === id) setSelectedAsset(null);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt, aspectRatio, modelType);
      setShowMobileHistory(false); // Ensure we are looking at the canvas
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col md:flex-row bg-gray-900 text-white font-sans animate-fadeIn">
        {/* Sidebar: History */}
        {/* On Mobile: Only show if showMobileHistory is true. Absolute positioning to overlay or take full screen. */}
        {/* On Desktop: Always show (md:flex), relative positioning. */}
        <div className={`${showMobileHistory ? 'flex' : 'hidden'} md:flex w-full md:w-80 flex-shrink-0 bg-gray-800 border-b md:border-b-0 md:border-r border-gray-700 flex-col h-full absolute md:relative z-20`}>
            <div className="p-4 pb-2 flex items-center justify-between md:block">
                <button onClick={onClose} className="w-full md:mb-2 flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors">
                    <span className="material-icons">arrow_back</span>
                    <span>Back to Dashboard</span>
                </button>
                {/* Mobile only close history button */}
                <button onClick={() => setShowMobileHistory(false)} className="md:hidden ml-2 p-2 text-gray-400 hover:text-white">
                    <span className="material-icons">close</span>
                </button>
            </div>
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-gray-100">Gallery</h3>
                <span className="text-xs text-gray-500">{assets.length} items</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {assets.map(asset => (
                    <div 
                        key={asset.id} 
                        onClick={() => handleSelectAsset(asset)}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedAsset?.id === asset.id ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/30' : 'border-transparent hover:border-gray-600'}`}
                    >
                        <img src={asset.url} alt="Thumbnail" className="w-full h-32 object-cover" />
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
                        No images generated yet.
                    </div>
                )}
            </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col relative bg-gray-900 h-full w-full">
            {/* Header */}
            <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 md:px-6 bg-gray-900 shrink-0">
                <div className="flex items-center">
                    <h2 className="text-lg font-bold flex items-center mr-4">
                        <span className="material-icons text-fuchsia-500 mr-2">image</span>
                        Image Studio
                    </h2>
                    {/* Mobile Toggle History Button */}
                    <button 
                        onClick={() => setShowMobileHistory(!showMobileHistory)}
                        className="md:hidden px-3 py-1 text-xs font-medium bg-gray-800 hover:bg-gray-700 rounded-full flex items-center text-gray-300 border border-gray-700"
                    >
                        <span className="material-icons text-sm mr-1">history</span>
                        Gallery
                    </button>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
                    <span className="material-icons">close</span>
                </button>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                {isLoading ? (
                     <div className="flex flex-col items-center">
                        <LoadingSpinner />
                        <p className="mt-4 text-fuchsia-400 animate-pulse font-medium">Creating your masterpiece...</p>
                     </div>
                ) : selectedAsset || watermarkedImage ? (
                    <div className="relative max-w-full max-h-full shadow-2xl group flex items-center justify-center w-full h-full">
                        <img 
                            src={selectedAsset?.url || watermarkedImage!} 
                            alt="Current View" 
                            className="max-w-full max-h-full object-contain rounded-lg border border-gray-800" 
                        />
                        <div className="absolute bottom-4 right-4 flex space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <a 
                                href={selectedAsset?.url || watermarkedImage!} 
                                download={`sb-image-${Date.now()}.png`} 
                                className="p-3 bg-gray-900/90 hover:bg-fuchsia-600 text-white rounded-full backdrop-blur-sm transition-colors shadow-lg"
                                title="Download"
                            >
                                <span className="material-icons">download</span>
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-600">
                        <span className="material-icons text-6xl opacity-20">auto_awesome</span>
                        <p className="mt-4 text-lg font-medium opacity-50">Enter a prompt to start creating</p>
                    </div>
                )}
            </div>

            {/* Bottom Control Bar */}
            <div className="h-auto min-h-[80px] bg-gray-800 border-t border-gray-700 p-4 px-4 md:px-6 flex flex-col md:flex-row items-stretch md:items-end space-y-3 md:space-y-0 md:space-x-4 shrink-0">
                <div className="flex-1">
                    <label className="text-xs font-medium text-gray-400 ml-1 mb-1 block">Prompt</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your image..."
                        className="w-full bg-white text-gray-900 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 resize-none h-16 md:h-12 placeholder-gray-500 text-sm"
                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if(!isLoading) handleSubmit(e); } }}
                    />
                </div>
                
                <div className="flex space-x-2 md:contents">
                    <div className="w-1/2 md:w-32">
                         <label className="text-xs font-medium text-gray-400 ml-1 mb-1 block">Aspect Ratio</label>
                         <select 
                            value={aspectRatio} 
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className="w-full h-10 md:h-12 bg-white text-gray-900 border-gray-300 rounded-lg px-2 focus:ring-2 focus:ring-fuchsia-500 outline-none text-sm"
                        >
                            {aspectRatios.map(r => <option key={r} value={r}>{r}</option>)}
                         </select>
                    </div>

                    <div className="w-1/2 md:w-36">
                         <label className="text-xs font-medium text-gray-400 ml-1 mb-1 block">Model</label>
                         <select 
                            value={modelType} 
                            onChange={(e) => setModelType(e.target.value as any)}
                            className="w-full h-10 md:h-12 bg-white text-gray-900 border-gray-300 rounded-lg px-2 focus:ring-2 focus:ring-fuchsia-500 outline-none text-sm"
                        >
                            <option value="imagen">Imagen 4</option>
                            <option value="flash">Flash</option>
                         </select>
                    </div>
                </div>

                <button 
                    onClick={handleSubmit}
                    disabled={isLoading || !prompt.trim()}
                    className="h-12 px-8 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-fuchsia-500/30 flex items-center justify-center"
                >
                    {isLoading ? '...' : 'Generate'}
                </button>
            </div>
        </div>
    </div>
  );
};

export default ImageGenerationModal;
