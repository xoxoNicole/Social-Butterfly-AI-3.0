import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isListening: boolean;
  onToggleVoice: () => void;
  voiceState: 'idle' | 'listening' | 'processing' | 'speaking';
  liveTranscription: { user: string; model: string };
}

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


const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, isListening, onToggleVoice, voiceState, liveTranscription }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isListening && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input, isListening]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if(e) e.preventDefault();
    if (input.trim() && !isLoading && !isListening) {
      onSendMessage(input.trim());
      setInput('');
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
          <div className="absolute inset-0 bg-gray-100 p-3 flex flex-col justify-center text-sm text-gray-600 rounded-xl overflow-y-auto">
              {liveTranscription.user && <p><strong className="font-semibold text-gray-800">You:</strong> {liveTranscription.user}</p>}
              {liveTranscription.model && <p className="mt-1"><strong className="font-semibold text-fuchsia-700">AI:</strong> {liveTranscription.model}</p>}
              {statusText && <p className="mt-2 text-center text-gray-500 italic">{statusText}</p>}
          </div>
      )
  }

  return (
    <div className="bg-white/80 backdrop-blur-lg border-t border-gray-200 p-4 sticky bottom-0">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative flex items-end space-x-2 bg-gray-100 rounded-xl p-2 shadow-sm">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={"Tell me about your business idea..."}
            className="flex-1 p-2 bg-transparent resize-none border-none focus:ring-0 focus:outline-none max-h-48"
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
                disabled={isLoading || isListening || !input.trim()}
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
