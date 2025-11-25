
import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ChatInputProps {
  onSendMessage: (message: string, image?: { base64: string, mimeType: string }, toolId?: string) => void;
  isLoading: boolean;
  isListening: boolean;
  onToggleVoice: () => void;
  voiceState: 'idle' | 'listening' | 'processing' | 'speaking';
  liveTranscription: { user: string; model: string };
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

const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const MicIcon: React.FC<{ isListening: boolean }> = ({ isListening }) => (
    <span className={`material-icons transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-600'}`}>
      {isListening ? 'mic' : 'mic_none'}
    </span>
);

const ToolsMenu = ({ onSelect, onClose }: { onSelect: (id: string) => void, onClose: () => void }) => {
    const tools = [
        { id: 'auto', icon: 'auto_awesome', label: 'Auto / Chat' },
        { id: 'web_search', icon: 'travel_explore', label: 'Web Search' },
        { id: 'deep_research', icon: 'manage_search', label: 'Deep Research' },
        { id: 'image', icon: 'image', label: 'Create images' },
    ];

    return (
        <div className="absolute bottom-14 left-0 bg-white rounded-xl shadow-xl border border-gray-200 w-56 overflow-hidden z-50 animate-fadeIn transform origin-bottom-left">
             <div className="p-2">
                 {tools.map(tool => (
                     <button 
                        key={tool.id}
                        onClick={() => { onSelect(tool.id); onClose(); }}
                        className="w-full flex items-center px-3 py-2.5 hover:bg-gray-50 rounded-lg text-left text-gray-700 text-sm transition-colors group"
                     >
                         <span className="material-icons text-gray-500 mr-3 text-lg group-hover:text-fuchsia-600 transition-colors">{tool.icon}</span>
                         <span className="font-medium group-hover:text-gray-900">{tool.label}</span>
                     </button>
                 ))}
             </div>
             <div className="bg-gray-50 px-3 py-2 border-t border-gray-100">
                 <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Canvas & More coming soon</p>
             </div>
        </div>
    );
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, isListening, onToggleVoice, voiceState, liveTranscription }) => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [selectedTool, setSelectedTool] = useState('auto');
  const [showTools, setShowTools] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isListening && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input, isListening]);
  
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
              setShowTools(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage({ file, previewUrl: URL.createObjectURL(file) });
    }
  };
  
  const removeImage = () => {
    if (image) {
      URL.revokeObjectURL(image.previewUrl);
      setImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if(e) e.preventDefault();
    if ((input.trim() || image) && !isLoading && !isListening) {
      let imageData: { base64: string, mimeType: string } | undefined = undefined;
      if (image) {
        imageData = await blobToBase64(image.file);
      }
      // Use selected tool
      onSendMessage(input.trim(), imageData, selectedTool);
      
      setInput('');
      removeImage();
      // Reset tool to auto after specialized requests to prevent accidental usage
      if (selectedTool !== 'auto') setSelectedTool('auto'); 
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const VoiceStatusDisplay = () => {
      let statusText;
      switch(voiceState) {
          case 'listening': statusText = 'Listening...'; break;
          case 'processing': statusText = 'AI is thinking...'; break;
          case 'speaking': statusText = 'AI is speaking...'; break;
          default: statusText = '';
      }

      return (
          <div className="absolute inset-0 bg-gray-100 p-3 flex flex-col justify-center text-sm text-gray-600 rounded-xl overflow-y-auto z-10">
              {liveTranscription.user && <p><strong className="font-semibold text-gray-800">You:</strong> {liveTranscription.user}</p>}
              {liveTranscription.model && <p className="mt-1"><strong className="font-semibold text-fuchsia-700">AI:</strong> {liveTranscription.model}</p>}
              {statusText && <p className="mt-2 text-center text-gray-500 italic">{statusText}</p>}
          </div>
      )
  }

  const getActiveToolIcon = () => {
      switch(selectedTool) {
          case 'web_search': return 'travel_explore';
          case 'deep_research': return 'manage_search';
          case 'image': return 'image';
          case 'video': return 'videocam';
          default: return 'add_circle_outline';
      }
  }
  
  const getActiveToolLabel = () => {
      switch(selectedTool) {
          case 'web_search': return 'Web Search';
          case 'deep_research': return 'Deep Research';
          case 'image': return 'Image Gen';
          case 'video': return 'Video Gen';
          default: return null;
      }
  }
  
  const activeLabel = getActiveToolLabel();

  return (
    <div className="bg-white/80 backdrop-blur-lg border-t border-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Active Tool Indicator */}
        {activeLabel && (
            <div className="flex space-x-2 mb-2 animate-fadeIn">
                <div className="flex items-center bg-fuchsia-100 text-fuchsia-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-fuchsia-200">
                    <span className="material-icons text-sm mr-1">{getActiveToolIcon()}</span>
                    {activeLabel}
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex items-end space-x-2 bg-gray-100 rounded-xl p-2 shadow-sm">
          {image && (
            <div className="absolute bottom-full left-2 mb-2 p-1 bg-white rounded-lg shadow-md">
              <img src={image.previewUrl} alt="Upload preview" className="h-20 w-20 object-cover rounded" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                aria-label="Remove image"
              >
                &times;
              </button>
            </div>
          )}
          
          <div ref={toolsRef} className="relative">
             <button
                type="button"
                onClick={() => setShowTools(!showTools)}
                disabled={isLoading || isListening}
                className={`p-2 rounded-full transition-colors flex items-center justify-center ${selectedTool !== 'auto' ? 'bg-fuchsia-100 text-fuchsia-600 ring-2 ring-fuchsia-200' : 'hover:bg-gray-200 text-gray-600'}`}
                aria-label="Select Tool"
                title="Select Tool"
              >
                <span className="material-icons">{selectedTool === 'auto' ? 'add_circle_outline' : getActiveToolIcon()}</span>
              </button>
              {showTools && <ToolsMenu onSelect={setSelectedTool} onClose={() => setShowTools(false)} />}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isListening}
            className="p-2 self-end rounded-full hover:bg-gray-200 disabled:opacity-50 transition-colors"
            aria-label="Attach image"
          >
            <span className="material-icons text-gray-600">attach_file</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={image ? "Describe the image..." : selectedTool === 'auto' ? "Ask me anything... (Tip: Try 'Search for...' or 'Generate image...')" : `Enter prompt for ${selectedTool.replace('_', ' ')}...`}
            className="flex-1 p-2 bg-transparent resize-none border-none focus:ring-0 focus:outline-none max-h-48 placeholder-gray-400 text-gray-900"
            rows={1}
            disabled={isLoading || isListening}
          />
          {isListening && <VoiceStatusDisplay />}
          <div className="flex items-center self-end">
            <button
                type="button"
                onClick={onToggleVoice}
                disabled={isLoading}
                className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50 transition-colors"
                aria-label={isListening ? "Stop listening" : "Start listening"}
            >
                <MicIcon isListening={isListening} />
            </button>
            <button
                type="submit"
                disabled={isLoading || isListening || (!input.trim() && !image)}
                className="p-2 rounded-full text-white bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
                {isLoading && !isListening ? <LoadingSpinner /> : <SendIcon />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;
