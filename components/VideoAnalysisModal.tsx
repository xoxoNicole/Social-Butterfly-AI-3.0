import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

export type VideoAnalysisMode = 'reels' | 'transcript' | 'repurpose';

interface VideoAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (file: File, mode: VideoAnalysisMode, customPrompt?: string) => void;
  isLoading: boolean;
}

const VideoAnalysisModal: React.FC<VideoAnalysisModalProps> = ({ isOpen, onClose, onAnalyze, isLoading }) => {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<VideoAnalysisMode>('reels');
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Limit to ~40MB for browser stability (processing large base64 strings can crash the tab)
  const MAX_FILE_SIZE = 40 * 1024 * 1024; 

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        if (selectedFile.size > MAX_FILE_SIZE) {
            setError('File is too large. Please upload a video under 40MB.');
            setFile(null);
        } else {
            setFile(selectedFile);
            setError(null);
        }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      onAnalyze(file, mode, customPrompt);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
        if (droppedFile.type.startsWith('video/')) {
            if (droppedFile.size > MAX_FILE_SIZE) {
                setError('File is too large. Please upload a video under 40MB.');
            } else {
                setFile(droppedFile);
                setError(null);
            }
        } else {
            setError('Please upload a valid video file.');
        }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 modal-content flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Video Understanding & Reels</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Close modal">
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <p className="text-gray-600 mb-6 text-sm">
            Upload a longer video to extract viral clips, generate transcripts, or repurpose content. 
            <span className="block mt-1 text-xs text-amber-600 font-medium">Note: File size limited to 40MB for browser processing.</span>
        </p>
        
        <div className="flex-1 overflow-y-auto pr-2">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload Area */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Source Video</label>
                    <div 
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-4 transition-colors ${file ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                    >
                        {file ? (
                            <div className="flex flex-col items-center">
                                <span className="material-icons text-4xl text-green-500">movie</span>
                                <p className="mt-2 font-semibold text-gray-800 truncate max-w-xs">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                <button type="button" onClick={() => setFile(null)} className="mt-2 text-xs text-red-500 hover:underline">Remove</button>
                            </div>
                        ) : (
                            <div>
                                <span className="material-icons text-5xl text-gray-400">cloud_upload</span>
                                <p className="mt-2 text-gray-600">Drag & drop video here or</p>
                                <label htmlFor="video-upload" className="mt-2 cursor-pointer text-sm font-medium text-fuchsia-600 hover:underline">
                                    <span>click to browse</span>
                                    <input id="video-upload" type="file" className="hidden" accept="video/mp4,video/webm,video/quicktime" onChange={handleFileChange} />
                                </label>
                                <p className="text-xs text-gray-400 mt-1">MP4, MOV, WEBM</p>
                            </div>
                        )}
                    </div>
                    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                </div>

                {/* Modes Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Select Action</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                            type="button"
                            onClick={() => setMode('reels')}
                            className={`p-3 rounded-lg border text-left flex flex-col items-start transition-all ${mode === 'reels' ? 'border-fuchsia-500 bg-fuchsia-50 ring-1 ring-fuchsia-500' : 'border-gray-200 hover:border-fuchsia-300'}`}
                        >
                            <span className="material-icons text-fuchsia-600 mb-2">cut</span>
                            <span className="font-semibold text-gray-800 text-sm">Reel Architect</span>
                            <span className="text-xs text-gray-500 mt-1">Identify & script viral clips</span>
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setMode('transcript')}
                            className={`p-3 rounded-lg border text-left flex flex-col items-start transition-all ${mode === 'transcript' ? 'border-fuchsia-500 bg-fuchsia-50 ring-1 ring-fuchsia-500' : 'border-gray-200 hover:border-fuchsia-300'}`}
                        >
                            <span className="material-icons text-fuchsia-600 mb-2">subtitles</span>
                            <span className="font-semibold text-gray-800 text-sm">Transcript</span>
                            <span className="text-xs text-gray-500 mt-1">Full text log of audio</span>
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setMode('repurpose')}
                            className={`p-3 rounded-lg border text-left flex flex-col items-start transition-all ${mode === 'repurpose' ? 'border-fuchsia-500 bg-fuchsia-50 ring-1 ring-fuchsia-500' : 'border-gray-200 hover:border-fuchsia-300'}`}
                        >
                            <span className="material-icons text-fuchsia-600 mb-2">autorenew</span>
                            <span className="font-semibold text-gray-800 text-sm">Repurpose</span>
                            <span className="text-xs text-gray-500 mt-1">Blog, Email, Summary</span>
                        </button>
                    </div>
                </div>

                {/* Custom Prompt for Repurpose Mode */}
                {mode === 'repurpose' && (
                    <div className="animate-fadeIn">
                        <label htmlFor="repurpose-prompt" className="block text-sm font-medium text-gray-700 mb-1">Custom Instructions</label>
                        <textarea
                            id="repurpose-prompt"
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="e.g., Write a LinkedIn post highlighting the top 3 takeaways from this video..."
                            className="w-full p-2 border border-gray-300 rounded-md min-h-[80px] focus:ring-2 focus:ring-fuchsia-500 outline-none"
                            rows={3}
                        />
                    </div>
                )}

                <div className="pt-2 flex justify-end">
                    <button
                        type="submit"
                        className="px-6 py-3 text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[150px]"
                        disabled={!file || isLoading}
                    >
                        {isLoading ? <LoadingSpinner/> : 'Process Video'}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default VideoAnalysisModal;