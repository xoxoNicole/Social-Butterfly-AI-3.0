
import React, { useEffect, useRef } from 'react';
import { ChatMessage as MessageType } from '../types';
import Message from './Message';
import LoadingSpinner from './LoadingSpinner';

interface MessageListProps {
  messages: MessageType[];
  isLoading: boolean;
  userProfilePhoto?: string;
  onExportMessage?: (content: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, userProfilePhoto, onExportMessage }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-4">
      {messages.map((msg, index) => (
        <Message 
            key={index} 
            message={msg} 
            userProfilePhoto={userProfilePhoto} 
            onExport={onExportMessage}
        />
      ))}
      {isLoading && messages.length > 0 && messages[messages.length-1].role === 'model' && messages[messages.length-1].parts.length === 0 && (
        <div className="flex justify-start">
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-400 rounded-full">
                    <LoadingSpinner />
                </div>
            </div>
        </div>
      )}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default MessageList;
