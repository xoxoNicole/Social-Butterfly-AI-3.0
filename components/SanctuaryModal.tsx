
import React, { useState } from 'react';
import { UserProfile, updateUserProfile } from '../services/firebase';

interface SanctuaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onStartSession: (prompt: string) => void;
}

type Tab = 'vault' | 'dojo' | 'headspace';

const SanctuaryModal: React.FC<SanctuaryModalProps> = ({ isOpen, onClose, userProfile, onStartSession }) => {
  const [activeTab, setActiveTab] = useState<Tab>('headspace');
  const [newWin, setNewWin] = useState('');
  const [roleplayRole, setRoleplayRole] = useState('');
  const [roleplayTopic, setRoleplayTopic] = useState('');

  // Vault Logic
  const handleAddWin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWin.trim()) return;
    
    const currentVault = userProfile.confidenceVault || [];
    const updatedVault = [newWin, ...currentVault];
    
    await updateUserProfile(userProfile.uid, { confidenceVault: updatedVault });
    setNewWin('');
  };

  const handleDeleteWin = async (index: number) => {
      const currentVault = userProfile.confidenceVault || [];
      const updatedVault = currentVault.filter((_, i) => i !== index);
      await updateUserProfile(userProfile.uid, { confidenceVault: updatedVault });
  };

  const handleBoostMe = () => {
      const wins = userProfile.confidenceVault || [];
      if (wins.length === 0) {
          onStartSession("I'm feeling a bit of Imposter Syndrome and I don't have any wins saved yet. Can you help me remember why I started this and give me a pep talk?");
      } else {
          const prompt = `I need a confidence boost. I'm opening the "Confidence Vault". Here are my past wins:\n\n${wins.map(w => `- ${w}`).join('\n')}\n\nBased on this evidence, remind me of who I am and why I am capable of handling my current challenges. Be my hype person!`;
          onStartSession(prompt);
      }
      onClose();
  };

  // Roleplay Logic
  const handleStartRoleplay = () => {
      if(!roleplayRole || !roleplayTopic) return;
      
      const prompt = `**ROLEPLAY MODE ACTIVATED**\n\nI want to practice a difficult conversation. \n\n**Your Role:** ${roleplayRole}\n**The Topic:** ${roleplayTopic}\n\n**Rules:**\n1. Stay in character completely. Do not break character.\n2. Start the conversation as ${roleplayRole}.\n3. Be realistic—challenge me if appropriate for the character, but ultimately help me practice.\n4. After the conversation ends, break character and give me feedback.\n\nLet's begin.`;
      onStartSession(prompt);
      onClose();
  };

  // Headspace Logic
  const handleStartVent = () => {
      const prompt = `**MODE: VENT SESSION (The Safe Space)**\n\nI need to vent. Please just listen. \n\n**Rules for AI:**\n1. Do NOT offer solutions or strategy yet.\n2. Validate my feelings.\n3. Ask gentle clarifying questions (e.g., "How did that make you feel?", "Tell me more.").\n4. Be warm, empathetic, and supportive.\n5. Only switch to "Fix it" mode if I explicitly ask.\n\nI'm ready to talk.`;
      onStartSession(prompt);
      onClose();
  };

  const handleStartSolve = () => {
      const prompt = `**MODE: WAR ROOM (Fix It Now)**\n\nI have a problem and I need immediate, tactical solutions. \n\n**Rules for AI:**\n1. Skip the fluff.\n2. Analyze the root cause.\n3. Give me a bulleted list of action steps.\n4. Be direct, strategic, and high-energy.\n\nLet's get to work.`;
      onStartSession(prompt);
      onClose();
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-fuchsia-50 p-6 border-b md:border-b-0 md:border-r border-fuchsia-100 flex flex-col flex-shrink-0">
            <div className="flex items-center space-x-2 mb-8 text-fuchsia-800">
                <span className="material-icons">favorite</span>
                <h2 className="font-bold text-lg">The Sanctuary</h2>
            </div>
            
            <nav className="space-y-2 flex-1">
                <button 
                    onClick={() => setActiveTab('headspace')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'headspace' ? 'bg-white text-fuchsia-700 shadow-md transform scale-105' : 'text-gray-600 hover:bg-fuchsia-100'}`}
                >
                    <span className="material-icons">self_improvement</span>
                    <span>Headspace</span>
                </button>
                <button 
                    onClick={() => setActiveTab('vault')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'vault' ? 'bg-white text-fuchsia-700 shadow-md transform scale-105' : 'text-gray-600 hover:bg-fuchsia-100'}`}
                >
                    <span className="material-icons">emoji_events</span>
                    <span>Confidence Vault</span>
                </button>
                <button 
                    onClick={() => setActiveTab('dojo')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'dojo' ? 'bg-white text-fuchsia-700 shadow-md transform scale-105' : 'text-gray-600 hover:bg-fuchsia-100'}`}
                >
                    <span className="material-icons">sports_kabaddi</span>
                    <span>Roleplay Dojo</span>
                </button>
            </nav>

            <button onClick={onClose} className="mt-auto text-gray-500 hover:text-gray-800 flex items-center text-sm">
                <span className="material-icons text-sm mr-2">arrow_back</span>
                Back to Business
            </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-white">
            
            {/* HEADSPACE TAB */}
            {activeTab === 'headspace' && (
                <div className="animate-fadeIn max-w-lg mx-auto text-center space-y-8 pt-4">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">How is your heart today?</h3>
                        <p className="text-gray-500 mt-2">Business is emotional. I'm here to help you process, not just produce.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button onClick={handleStartVent} className="p-6 rounded-2xl border-2 border-purple-100 hover:border-purple-300 bg-purple-50 hover:bg-purple-100 transition-all group text-left relative overflow-hidden">
                            <div className="relative z-10">
                                <span className="material-icons text-4xl text-purple-400 mb-4 group-hover:scale-110 transition-transform">spa</span>
                                <h4 className="text-lg font-bold text-purple-900">I need to Vent</h4>
                                <p className="text-sm text-purple-700 mt-2">A safe space to just let it out. No solutions, just listening and validation.</p>
                            </div>
                        </button>

                        <button onClick={handleStartSolve} className="p-6 rounded-2xl border-2 border-fuchsia-100 hover:border-fuchsia-300 bg-fuchsia-50 hover:bg-fuchsia-100 transition-all group text-left relative overflow-hidden">
                            <div className="relative z-10">
                                <span className="material-icons text-4xl text-fuchsia-400 mb-4 group-hover:scale-110 transition-transform">bolt</span>
                                <h4 className="text-lg font-bold text-fuchsia-900">Fix It Now</h4>
                                <p className="text-sm text-fuchsia-700 mt-2">High-energy war room mode. Root cause analysis and immediate action steps.</p>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* CONFIDENCE VAULT TAB */}
            {activeTab === 'vault' && (
                <div className="animate-fadeIn h-full flex flex-col">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">The Confidence Vault</h3>
                            <p className="text-gray-500 mt-1">Store your wins here. Read them when you forget who you are.</p>
                        </div>
                        <button 
                            onClick={handleBoostMe}
                            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all flex items-center transform hover:-translate-y-1"
                        >
                            <span className="material-icons mr-2">auto_awesome</span>
                            Hype Me Up
                        </button>
                    </div>

                    {/* Input */}
                    <form onSubmit={handleAddWin} className="mb-6 relative">
                        <input 
                            type="text" 
                            value={newWin}
                            onChange={(e) => setNewWin(e.target.value)}
                            placeholder="I closed a new client... I launched my website..."
                            className="w-full pl-4 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none transition-all"
                        />
                        <button 
                            type="submit" 
                            disabled={!newWin.trim()}
                            className="absolute right-2 top-2 bottom-2 px-4 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition-colors font-medium"
                        >
                            Add
                        </button>
                    </form>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {(userProfile.confidenceVault || []).length === 0 ? (
                            <div className="text-center py-20 opacity-50">
                                <span className="material-icons text-6xl text-gray-300">lock_open</span>
                                <p className="mt-4 text-gray-500">Your vault is empty. Add your first win above!</p>
                            </div>
                        ) : (
                            [...(userProfile.confidenceVault || [])].reverse().map((win, idx) => (
                                <div key={idx} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group">
                                    <p className="text-gray-800 font-medium">{win}</p>
                                    <button 
                                        onClick={() => handleDeleteWin((userProfile.confidenceVault?.length || 0) - 1 - idx)}
                                        className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <span className="material-icons">delete</span>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* DOJO TAB */}
            {activeTab === 'dojo' && (
                <div className="animate-fadeIn max-w-lg mx-auto pt-4">
                    <div className="text-center mb-8">
                         <h3 className="text-2xl font-bold text-gray-900">Roleplay Dojo</h3>
                         <p className="text-gray-500 mt-2">Practice difficult conversations in a safe environment before you have them in real life.</p>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Who am I (the AI) playing?</label>
                            <input 
                                type="text"
                                value={roleplayRole}
                                onChange={(e) => setRoleplayRole(e.target.value)}
                                placeholder="e.g., An angry client, My co-founder, A skeptical investor"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">What is the situation/topic?</label>
                            <textarea 
                                value={roleplayTopic}
                                onChange={(e) => setRoleplayTopic(e.target.value)}
                                placeholder="e.g., I need to tell them I'm raising my prices by 20%..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none h-32 resize-none"
                            />
                        </div>

                        <button 
                            onClick={handleStartRoleplay}
                            disabled={!roleplayRole || !roleplayTopic}
                            className="w-full py-4 bg-fuchsia-600 text-white font-bold rounded-xl shadow-lg hover:bg-fuchsia-700 hover:shadow-fuchsia-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Enter the Dojo
                        </button>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default SanctuaryModal;
