import React, { useState } from 'react';
import { ChatMessage } from '../types';

interface MessageProps {
  message: ChatMessage;
  userProfilePhoto?: string;
}

const BotIcon = () => (
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-fuchsia-500 flex items-center justify-center text-white font-bold">
        <span>AI</span>
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


const Message: React.FC<MessageProps> = ({ message, userProfilePhoto }) => {
  const [copied, setCopied] = useState(false);
  const isModel = message.role === 'model';

  const createMarkup = (text: string) => {
    if (typeof window !== 'undefined' && (window as any).marked) {
      return { __html: (window as any).marked.parse(text) };
    }
    return { __html: text.replace(/\n/g, '<br>') };
  };

  const handleCopy = () => {
    if (!message.parts[0].text) return;
    navigator.clipboard.writeText(message.parts[0].text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  if (isModel && !message.parts[0].text) {
    return null; // Don't render empty model messages (placeholders)
  }

  return (
    <div className={`flex items-start gap-4 ${isModel ? 'justify-start' : 'justify-end'}`}>
      {isModel && <BotIcon />}
      <div className="relative group">
        <div
            className={`prose prose-sm max-w-2xl px-4 py-3 rounded-2xl shadow-sm ${
            isModel ? 'bg-white' : 'bg-gray-800 text-white'
            }`}
            dangerouslySetInnerHTML={createMarkup(message.parts[0].text)}
        />
        {isModel && message.parts[0].text && (
            <button 
                onClick={handleCopy} 
                className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 opacity-0 group-hover:opacity-100 transition-all duration-200 focus:opacity-100 focus:outline-none"
                aria-label={copied ? "Copied" : "Copy text"}
            >
                <span className="material-icons" style={{ fontSize: '16px' }}>
                    {copied ? 'check' : 'content_copy'}
                </span>
            </button>
        )}
      </div>
      {!isModel && <UserIcon photo={userProfilePhoto} />}
    </div>
  );
};

export default Message;