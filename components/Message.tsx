
import React, { useState } from 'react';
import { ChatMessage, MessagePart } from '../types';
import { ButterflyIcon } from './Header';

interface MessageProps {
  message: ChatMessage;
  userProfilePhoto?: string;
  onExport?: (content: string) => void;
}

const BotIcon = () => (
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-fuchsia-100 flex items-center justify-center border border-fuchsia-200">
        <ButterflyIcon className="h-6 w-6 text-fuchsia-600" />
    </div>
);

const UserIcon: React.FC<{ photo?: string }> = ({ photo }) => {
    if (photo) {
        return <img src={photo} alt="User" className="flex-shrink-0 w-10 h-10 rounded-full object-cover" />;
    }
    return (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold">
            <span>U</span>
        </div>
    );
};


const Message: React.FC<MessageProps> = ({ message, userProfilePhoto, onExport }) => {
  const [copied, setCopied] = useState(false);
  const isModel = message.role === 'model';

  const createMarkup = (text: string) => {
    if (typeof window !== 'undefined' && (window as any).marked) {
      return { __html: (window as any).marked.parse(text) };
    }
    return { __html: text.replace(/\n/g, '<br>') };
  };
  
  const textContent = message.parts.filter(p => p.text).map(p => p.text).join('\n\n');

  const handleCopy = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };
  
  // Grounding (Citations) handling
  const groundingChunks = message.groundingMetadata?.groundingChunks || [];
  const hasGrounding = groundingChunks.length > 0;

  if (isModel && message.parts.length === 0) {
    return null; // Don't render empty model messages (placeholders for streaming)
  }
  
  const renderPart = (part: MessagePart, index: number) => {
    if (part.inlineData?.mimeType.startsWith('image/')) {
        return (
            <div key={index} className="p-2">
                <img 
                    src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} 
                    alt="User content" 
                    className="rounded-lg max-w-xs lg:max-w-sm"
                />
            </div>
        );
    }
    if (part.text) {
        return (
            <div
                key={index}
                className={`prose prose-sm max-w-2xl ${isModel ? '' : 'text-white'}`}
                dangerouslySetInnerHTML={createMarkup(part.text)}
            />
        );
    }
    return null;
  };

  return (
    <div className={`flex items-start gap-4 ${isModel ? 'justify-start' : 'justify-end'}`}>
      {isModel && <BotIcon />}
      <div className="relative group">
        <div
            className={`px-4 py-3 rounded-2xl shadow-sm space-y-2 flex flex-col ${
            isModel ? 'bg-white' : 'bg-gray-800'
            }`}
        >
          {message.parts.map(renderPart)}
          
          {/* Sources Display (Grounding) */}
          {isModel && hasGrounding && (
              <div className="pt-3 mt-2 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500 mb-1 flex items-center">
                    <span className="material-icons text-xs mr-1">public</span>
                    Sources
                  </p>
                  <div className="flex flex-wrap gap-2">
                      {groundingChunks.map((chunk: any, i: number) => {
                          if (chunk.web?.uri) {
                              return (
                                  <a 
                                    key={i} 
                                    href={chunk.web.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-xs bg-gray-100 hover:bg-gray-200 text-fuchsia-600 px-2 py-1 rounded flex items-center truncate max-w-[200px] border border-gray-200"
                                  >
                                      <span className="material-icons text-[10px] mr-1">link</span>
                                      {chunk.web.title || 'Source Link'}
                                  </a>
                              )
                          }
                          return null;
                      })}
                  </div>
              </div>
          )}
        </div>
        
        {isModel && textContent && (
            <div className="absolute -bottom-8 left-0 opacity-0 group-hover:opacity-100 transition-all duration-200 flex space-x-2 z-10">
                {/* Copy Button */}
                <button 
                    onClick={handleCopy} 
                    className="p-1.5 rounded-full bg-white text-gray-500 hover:bg-gray-100 border border-gray-200 shadow-sm focus:outline-none"
                    aria-label={copied ? "Copied" : "Copy text"}
                    title="Copy to clipboard"
                >
                    <span className="material-icons" style={{ fontSize: '16px' }}>
                        {copied ? 'check' : 'content_copy'}
                    </span>
                </button>
                
                {/* Export Button */}
                {onExport && (
                    <button 
                        onClick={() => onExport(textContent)} 
                        className="p-1.5 rounded-full bg-white text-gray-500 hover:text-fuchsia-600 hover:bg-gray-100 border border-gray-200 shadow-sm focus:outline-none"
                        aria-label="Export to Drive"
                        title="Export to Google Drive"
                    >
                        <span className="material-icons" style={{ fontSize: '16px' }}>save_alt</span>
                    </button>
                )}
            </div>
        )}
      </div>
      {!isModel && <UserIcon photo={userProfilePhoto} />}
    </div>
  );
};

export default Message;
