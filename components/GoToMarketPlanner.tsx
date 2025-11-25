

import React, { useState } from 'react';

export interface GtmFormData {
    audience: string;
    valueProp: string;
    channels: string[];
    goals: string;
}

interface GoToMarketPlannerProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: GtmFormData) => void;
}

const marketingChannels = [
    "Social Media",
    "Email Marketing",
    "Content Marketing / SEO",
    "Paid Advertising",
    "Partnerships / Affiliates",
    "Public Relations",
    "Community Building",
    "Offline Events"
];


const GoToMarketPlanner: React.FC<GoToMarketPlannerProps> = ({ isOpen, onClose, onGenerate }) => {
  const [formData, setFormData] = useState<GtmFormData>({
    audience: '',
    valueProp: '',
    channels: [],
    goals: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChannelChange = (channel: string) => {
    setFormData(prev => {
        const newChannels = prev.channels.includes(channel)
            ? prev.channels.filter(c => c !== channel)
            : [...prev.channels, channel];
        return { ...prev, channels: newChannels };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 modal-content flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Go-to-Market Strategy Planner</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Close planner">
            <span className="material-icons">close</span>
          </button>
        </div>

        <p className="text-gray-600 mb-6">Fill out these key areas to generate a foundational Go-to-Market plan.</p>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-4">
            <div>
                <label htmlFor="audience" className="block text-sm font-semibold text-gray-700 mb-1">Ideal Customer Persona</label>
                <textarea id="audience" name="audience" value={formData.audience} onChange={handleInputChange} required rows={3} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400" placeholder="Describe your target audience..."></textarea>
            </div>
            <div>
                <label htmlFor="valueProp" className="block text-sm font-semibold text-gray-700 mb-1">Unique Value Proposition</label>
                <textarea id="valueProp" name="valueProp" value={formData.valueProp} onChange={handleInputChange} required rows={3} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400" placeholder="What makes your offer unique and valuable?"></textarea>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Marketing & Distribution Channels</h3>
                <div className="grid grid-cols-2 gap-2">
                    {marketingChannels.map(channel => (
                        <label key={channel} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" checked={formData.channels.includes(channel)} onChange={() => handleChannelChange(channel)} className="h-4 w-4 rounded text-fuchsia-600" />
                            <span className="text-sm text-gray-800">{channel}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div>
                <label htmlFor="goals" className="block text-sm font-semibold text-gray-700 mb-1">Primary Launch Goals</label>
                <textarea id="goals" name="goals" value={formData.goals} onChange={handleInputChange} required rows={3} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400" placeholder="e.g., Acquire 100 beta users, achieve $5k in pre-sales..."></textarea>
            </div>
            <div className="pt-4 flex justify-end">
                <button type="submit" className="px-6 py-2 text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700">Generate Plan</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default GoToMarketPlanner;