import React, { useState } from 'react';

interface OnboardingModalProps {
  onFinish: () => void;
}

const onboardingSteps = [
  {
    icon: 'spark',
    title: 'Welcome to Social Butterfly-AI 3.0',
    description: 'Your new best friend in business. I\'m here to help you validate, design, launch, and scale your dream venture with confidence and clarity.',
  },
  {
    icon: 'dashboard',
    title: 'Your Strategic Dashboard',
    description: 'After this quick tour, you\'ll see a dashboard with powerful features. Click any of them to kickstart a specific task, like market validation or content creation.',
  },
  {
    icon: 'chat',
    title: 'Start a Conversation',
    description: 'You can also simply type a message into the chat bar. Tell me about your business idea, ask a question, or describe a challenge you\'re facing.',
  },
  {
    icon: 'favorite',
    title: 'The Faith Alignment Lens',
    description: 'For faith-led entrepreneurs, there\'s an optional "Faith Alignment Lens" feature to help you build a business that honors your values without compromising excellence.',
  },
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onFinish }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = onboardingSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4 modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center modal-content">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-fuchsia-100 text-fuchsia-600 mx-auto">
          <span className="material-icons text-4xl">{step.icon}</span>
        </div>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">{step.title}</h2>
        <p className="mt-4 text-gray-600">{step.description}</p>
        
        <div className="mt-8 flex justify-center space-x-2">
            {onboardingSteps.map((_, index) => (
                <div key={index} className={`w-2.5 h-2.5 rounded-full transition-colors ${index === currentStep ? 'bg-fuchsia-600' : 'bg-gray-300'}`}></div>
            ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <button
            onClick={handlePrev}
            className={`px-6 py-3 text-sm font-medium rounded-md transition-colors ${
              currentStep === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            disabled={currentStep === 0}
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-3 text-sm font-medium text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700 transition-colors"
          >
            {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
