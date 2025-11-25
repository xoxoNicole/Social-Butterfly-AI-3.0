

import React from 'react';
import { features, Feature } from '../features';

export type DashboardAction = 
  | { type: 'send_message', payload: string }
  | { type: 'open_modal', payload: 'gtm' | 'image_generation' | 'image_editing' | 'video_text' | 'video_image' | 'document_analysis' | 'video_analysis' | 'sanctuary' | 'academy' | 'site_architect' };

interface DashboardProps {
  onAction: (action: DashboardAction, featureTitle: string) => void;
}

const featureActions: Record<string, DashboardAction> = {
  "Market Validation": { type: 'send_message', payload: "I have a business idea I'd like to validate. Can you guide me through the market validation process?" },
  "Ready, Set, Launch!": { type: 'send_message', payload: "I am ready to launch! Please generate a custom 'Ready, Set, Launch!' plan for my business, covering pre-launch, launch day, and post-launch strategies. Make sure to tailor it to my specific business model and audience." },
  "Audience Discovery": { type: 'send_message', payload: "I need help with audience discovery. Where should I start?" },
  "Product Suite Strategy": { type: 'send_message', payload: "Let's work on my product suite strategy." },
  "Customer Journey Mapping": { type: 'send_message', payload: "Can you help me map out my customer journey?" },
  "Content Pillar Development": { type: 'send_message', payload: "I need to develop content pillars for my brand." },
  "AI-Powered Content Generation": { type: 'send_message', payload: "I'd like to generate some content for my social media." },
  "Go-to-Market Plan": { type: 'open_modal', payload: 'gtm' },
  "Document Analysis": { type: 'open_modal', payload: 'document_analysis' },
  "Video Understanding & Reels": { type: 'open_modal', payload: 'video_analysis' },
  "Generate Images": { type: 'open_modal', payload: 'image_generation' },
  "Edit Images": { type: 'open_modal', payload: 'image_editing' },
  "Generate Video": { type: 'open_modal', payload: 'video_text' },
  "Animate Image": { type: 'open_modal', payload: 'video_image' },
  "The Sanctuary": { type: 'open_modal', payload: 'sanctuary' },
  "Butterfly Academy": { type: 'open_modal', payload: 'academy' },
  "Landing Page Architect": { type: 'open_modal', payload: 'site_architect' },
  "Faith Alignment Lens": { type: 'send_message', payload: "I want to explore using the Faith Alignment Lens for my business." }
};

const Dashboard: React.FC<DashboardProps> = ({ onAction }) => {
  const multimediaFeatures = features.filter(f => f.category === 'multimedia');
  const coreFeatures = features.filter(f => f.category === 'core' && f.title !== 'The Sanctuary' && f.title !== 'Butterfly Academy');
  
  const specialFeatures: Feature[] = [
    { 
        title: "The Sanctuary", 
        icon: "self_improvement", 
        description: "A safe space for mindset, motivation, and difficult conversations.", 
        category: 'core' 
    },
    { 
        title: "Butterfly Academy", 
        icon: "school", 
        description: "Interactive learning pods to master your pitch, brand, and strategy.", 
        category: 'core',
        badge: 'NEW'
    }
  ];
  
  const FeatureButton: React.FC<{feature: Feature, isHighlight?: boolean}> = ({ feature, isHighlight }) => (
      <button
        key={feature.title}
        className={`bg-white p-4 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200 cursor-pointer border ${isHighlight ? 'border-fuchsia-300 bg-fuchsia-50/50' : 'border-gray-200'} flex flex-col items-start text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 h-full relative group`}
        onClick={() => onAction(featureActions[feature.title] || { type: 'send_message', payload: `Tell me more about ${feature.title}` }, feature.title)}
        aria-label={`Start with ${feature.title}`}
      >
        <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md ${isHighlight ? 'bg-fuchsia-200 text-fuchsia-700' : 'bg-fuchsia-100 text-fuchsia-600'}`}>
          <span className="material-icons" aria-hidden="true">{feature.icon}</span>
        </div>
        <div className="flex flex-col flex-grow mt-4 w-full">
            <div className="flex items-center justify-between w-full">
                <h3 className="text-md font-semibold text-gray-900">{feature.title}</h3>
                {feature.badge && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wide">
                        {feature.badge}
                    </span>
                )}
            </div>
            <p className="mt-1 text-sm text-gray-600">{feature.description}</p>
        </div>
      </button>
  );

  return (
    <div className="max-w-4xl mx-auto mt-6 mb-8 space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4 px-1">Creative AI Studio</h3>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {multimediaFeatures.map((feature: Feature) => (
            <FeatureButton key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4 px-1">Growth & Mindset</h3>
        <div className="grid gap-4 md:grid-cols-2">
            {specialFeatures.map((feature) => (
                <FeatureButton key={feature.title} feature={feature} isHighlight={true} />
            ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4 px-1">Business Strategy Tools</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coreFeatures.map((feature: Feature) => (
            <FeatureButton key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;