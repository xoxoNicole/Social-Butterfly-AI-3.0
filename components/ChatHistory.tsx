
import React, { useState, useMemo, useEffect } from 'react';
import { ChatSession } from '../types';

interface ChatHistoryProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  isOpenOnMobile: boolean;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ sessions, activeSessionId, onNewChat, onSelectSession, onDeleteSession, isOpenOnMobile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  // Categories are collapsed by default (empty object means all false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Group sessions by category
  const groupedSessions = useMemo(() => {
      const groups: Record<string, ChatSession[]> = {};
      
      // Filter based on search
      const filtered = sessions.filter(s => {
          if (!searchTerm) return true;
          const term = searchTerm.toLowerCase();
          const matchesTitle = s.title.toLowerCase().includes(term);
          const matchesContent = s.messages.some(m => m.parts.some(p => p.text?.toLowerCase().includes(term)));
          return matchesTitle || matchesContent;
      });

      filtered.forEach(session => {
          // Fallback to 'General' if no category is set
          const cat = session.category || 'General';
          if (!groups[cat]) {
              groups[cat] = [];
          }
          groups[cat].push(session);
      });
      
      return groups;
  }, [sessions, searchTerm]);

  // Only expand groups if the user is actively searching
  useEffect(() => {
      if (searchTerm) {
          const allExpanded: Record<string, boolean> = {};
          Object.keys(groupedSessions).forEach(k => allExpanded[k] = true);
          setExpandedCategories(allExpanded);
      }
  }, [searchTerm, groupedSessions]);

  const toggleCategory = (category: string) => {
      setExpandedCategories(prev => ({
          ...prev,
          [category]: !prev[category]
      }));
  };

  const sortedCategories = Object.keys(groupedSessions).sort((a, b) => {
      // Keep General at top, everything else alphabetical
      if (a === 'General') return -1;
      if (b === 'General') return 1;
      return a.localeCompare(b);
  });

  return (
    <div className={`absolute md:relative z-[60] h-full w-64 bg-gray-900 text-white flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out ${isOpenOnMobile ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 border-r border-gray-800 shadow-xl`}>
      
      {/* Header & New Chat */}
      <div className="p-4 border-b border-gray-800 space-y-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center p-3 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-700 transition-colors text-sm font-bold shadow-md"
        >
          <span className="material-icons mr-2" style={{ fontSize: '20px' }}>add</span>
          New Chat
        </button>

        {/* Search Bar */}
        <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <span className="material-icons text-sm">search</span>
            </span>
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none placeholder-gray-500 transition-all"
            />
        </div>
      </div>

      {/* Grouped List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {sortedCategories.length === 0 ? (
             <div className="text-center py-8 text-gray-500 text-xs">
                 {searchTerm ? 'No chats found' : 'Start a new conversation'}
             </div>
        ) : (
            sortedCategories.map(category => (
                <div key={category} className="mb-1">
                    <button 
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-white transition-colors hover:bg-gray-800/30 rounded"
                    >
                        <span className="flex items-center truncate max-w-[180px]">
                            {category === 'General' && <span className="material-icons text-[14px] mr-1">chat_bubble_outline</span>}
                            {category === 'The Sanctuary' && <span className="material-icons text-[14px] mr-1">favorite</span>}
                            {category === 'Butterfly Academy' && <span className="material-icons text-[14px] mr-1">school</span>}
                            {category !== 'General' && category !== 'The Sanctuary' && category !== 'Butterfly Academy' && <span className="material-icons text-[14px] mr-1">folder</span>}
                            {category}
                        </span>
                        <span className={`material-icons text-sm transition-transform duration-200 ${expandedCategories[category] ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>
                    
                    {expandedCategories[category] && (
                        <div className="mt-1 space-y-1 animate-fadeIn pl-2 border-l border-gray-800 ml-2">
                            {groupedSessions[category].map(session => (
                                <div key={session.id} className="group relative">
                                    <button
                                        onClick={() => onSelectSession(session.id)}
                                        className={`w-full text-left px-3 py-2 rounded-md truncate text-sm transition-all border-l-2 ${
                                            session.id === activeSessionId 
                                            ? 'bg-gray-800 border-fuchsia-500 text-white' 
                                            : 'border-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                                        }`}
                                    >
                                        {session.title || 'New Chat'}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm('Are you sure you want to delete this chat?')) {
                                            onDeleteSession(session.id);
                                            }
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-500 hover:text-red-400 hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-all"
                                        aria-label="Delete chat"
                                    >
                                        <span className="material-icons" style={{ fontSize: '14px' }}>delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <div className="flex items-center space-x-2 text-gray-400">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center">
                 <span className="material-icons text-white text-sm">auto_awesome</span>
            </div>
            <div>
                <h3 className="text-xs font-bold text-gray-200">Social Butterfly-AI</h3>
                <p className="text-[10px] text-gray-500">v3.0 Beta</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHistory;
