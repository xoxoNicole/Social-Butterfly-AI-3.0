import React from 'react';
import { features, Feature } from '../features';

export type DashboardAction = 
  | { type: 'send_message', payload: string }
  | { type: 'open_modal', payload: 'gtm' };

interface DashboardProps {
  onAction: (action: DashboardAction) => void;
}

const featureActions: Record<string, DashboardAction> = {
  "Market Validation": { type: 'send_message', payload: "I have a business idea I'd like to validate. Can you guide me through the market validation process?" },
  "Audience Discovery": { type: 'send_message', payload: "I need help with audience discovery. Where should I start?" },
  "Product Suite Strategy": { type: 'send_message', payload: "Let's work on my product suite strategy." },
  "Customer Journey Mapping": { type: 'send_message', payload: "Can you help me map out my customer journey?" },
  "Content Pillar Development": { type: 'send_message', payload: "I need to develop content pillars for my brand." },
  "Content Calendar Creation": { type: 'send_message', payload: "Help me create a content calendar." },
  "AI-Powered Content Generation": { type: 'send_message', payload: "I'd like to generate some content for my social media." },
  "Go-to-Market Plan": { type: 'open_modal', payload: 'gtm' },
  "Faith Alignment Lens": { type: 'send_message', payload: "I want to explore using the Faith Alignment Lens for my business." }
};

const Dashboard: React.FC<DashboardProps> = ({ onAction }) => {
  return (
    <div className="max-w-4xl mx-auto mt-6 mb-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.filter(f => f.title !== 'Image & Video Generation').map((feature: Feature) => (
          <button
            key={feature.title}
            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 flex flex-col items-start text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 h-full"
            onClick={() => onAction(featureActions[feature.title] || { type: 'send_message', payload: `Tell me more about ${feature.title}` })}
            aria-label={`Start with ${feature.title}`}
          >
            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-fuchsia-100 text-fuchsia-600">
              <span className="material-icons" aria-hidden="true">{feature.icon}</span>
            </div>
            <div className="flex flex-col flex-grow mt-4">
                <h3 className="text-md font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{feature.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
