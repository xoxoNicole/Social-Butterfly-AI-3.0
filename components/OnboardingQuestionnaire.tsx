
import React, { useState } from 'react';

interface OnboardingQuestionnaireProps {
  isOpen: boolean;
  onComplete: (answers: Record<string, string>) => void;
}

const questions = [
  {
    key: 'audience',
    title: "Who is your ideal customer?",
    placeholder: "e.g., Faith-led female coaches in their first 1-2 years of business who feel overwhelmed by marketing.",
    icon: 'group'
  },
  {
    key: 'problem',
    title: "What's the single biggest problem you solve for them?",
    placeholder: "e.g., They struggle to create a clear, effective marketing strategy that feels authentic to their calling.",
    icon: 'crisis_alert'
  },
  {
    key: 'transformation',
    title: "What is the transformation you promise?",
    placeholder: "e.g., From feeling lost and inconsistent to launching and scaling a profitable business with confidence and spiritual integrity.",
    icon: 'auto_awesome'
  },
  {
    key: 'motivation',
    title: "What is your personal motivation for this venture?",
    placeholder: "e.g., I feel called to help other women build businesses that honor God and create financial freedom.",
    icon: 'favorite_border'
  },
  {
    key: 'fear',
    title: "What is your biggest fear or uncertainty right now?",
    placeholder: "e.g., I'm afraid no one will buy my offer, or that I'm not 'expert' enough to succeed.",
    icon: 'psychology'
  }
];

const OnboardingQuestionnaire: React.FC<OnboardingQuestionnaireProps> = ({ isOpen, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAnswers(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleIdkClick = () => {
    const key = questions[currentStep].key;
    setAnswers(prev => ({
      ...prev,
      [key]: "I'm not sure about this yet. I would like your help to figure it out."
    }));
  };

  if (!isOpen) return null;

  const currentQuestion = questions[currentStep];
  const progressPercentage = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4 modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 md:p-8 modal-content flex flex-col text-center max-h-[90vh] overflow-y-auto">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6 flex-shrink-0">
            <div className="bg-fuchsia-600 h-2 rounded-full" style={{ width: `${progressPercentage}%`, transition: 'width 0.5s ease-in-out' }}></div>
        </div>

        <div className="flex items-center justify-center h-12 w-12 md:h-16 md:w-16 rounded-full bg-fuchsia-100 text-fuchsia-600 mx-auto flex-shrink-0">
            <span className="material-icons text-3xl md:text-4xl">{currentQuestion.icon}</span>
        </div>
        
        <h2 className="mt-4 md:mt-6 text-xl md:text-2xl font-bold text-gray-900">{currentQuestion.title}</h2>
        <p className="mt-2 text-gray-600 text-sm md:text-base">Your answers will help me provide hyper-personalized strategies for you.</p>

        <div className="mt-6 w-full flex-1 flex flex-col">
            <textarea
                name={currentQuestion.key}
                value={answers[currentQuestion.key] || ''}
                onChange={handleAnswerChange}
                placeholder={currentQuestion.placeholder}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 min-h-[120px] text-center resize-y bg-white text-gray-900 placeholder-gray-400"
                rows={4}
            />
            <button type="button" onClick={handleIdkClick} className="mt-2 text-sm text-fuchsia-600 hover:underline focus:outline-none self-center">
                I'm not sure, can you help with this?
            </button>
        </div>

        <div className="mt-6 md:mt-8 grid grid-cols-2 gap-4 flex-shrink-0">
            <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="px-6 py-3 font-medium rounded-md transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
                Back
            </button>
            <button
                onClick={handleNext}
                className="px-6 py-3 font-medium text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700 transition-colors"
            >
                {currentStep === questions.length - 1 ? 'Finish' : 'Next'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingQuestionnaire;