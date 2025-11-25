
import React, { useState } from 'react';
import { UserProfile, updateUserProfile } from '../services/firebase';
import Certificate from './Certificate';
import LoadingSpinner from './LoadingSpinner';

export interface PitchAnalysisResult {
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  refinedPitch: string;
}

export interface PromptGradingResult {
    score: number;
    feedback: string;
    improvedPrompt: string;
}

interface AcademyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onAnalyzePitch: (audience: string, pitch: string) => Promise<PitchAnalysisResult>;
  onGradePrompt?: (prompt: string) => Promise<PromptGradingResult>;
}

const AcademyModal: React.FC<AcademyModalProps> = ({ isOpen, onClose, userProfile, onAnalyzePitch, onGradePrompt }) => {
  // Updated view type to include prompting states
  const [view, setView] = useState<'home' | 'pitch-input' | 'pitch-result' | 'prompt-lesson' | 'prompt-practice' | 'prompt-result' | 'certificate'>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [completedCourseName, setCompletedCourseName] = useState('');
  
  // Pitch State
  const [audience, setAudience] = useState(userProfile.audience || '');
  const [pitch, setPitch] = useState('');
  const [result, setResult] = useState<PitchAnalysisResult | null>(null);

  // Prompt Masterclass State
  const [practicePrompt, setPracticePrompt] = useState("Write a blog post about coffee."); // Bad starting prompt
  const [promptResult, setPromptResult] = useState<PromptGradingResult | null>(null);

  const handleStartPitch = () => {
    setView('pitch-input');
  };

  const handleStartPrompting = () => {
      setView('prompt-lesson');
  };

  const handleAnalyzePitch = async () => {
    if (!audience || !pitch) return;
    setIsLoading(true);
    try {
      const data = await onAnalyzePitch(audience, pitch);
      setResult(data);
      setView('pitch-result');
    } catch (e) {
      console.error(e);
      alert("Failed to analyze pitch. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradePrompt = async () => {
      if (!onGradePrompt || !practicePrompt) return;
      setIsLoading(true);
      try {
          const data = await onGradePrompt(practicePrompt);
          setPromptResult(data);
          setView('prompt-result');
      } catch (e) {
          console.error(e);
          alert("Failed to grade prompt. Please try again.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleCompleteCourse = async (courseId: string, courseName: string) => {
    const existingCourses = userProfile.completedCourses || [];
    if (!existingCourses.find(c => c.id === courseId)) {
        const newCourse = {
            id: courseId,
            name: courseName,
            completedAt: new Date().toLocaleDateString()
        };
        await updateUserProfile(userProfile.uid, {
            completedCourses: [...existingCourses, newCourse]
        });
    }
    setCompletedCourseName(courseName);
    setView('certificate');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 p-6 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center space-x-3 text-white">
                <span className="material-icons text-3xl">school</span>
                <div>
                    <h2 className="text-2xl font-bold">Butterfly Academy</h2>
                    <p className="text-purple-100 text-sm">Master your business skills with AI</p>
                </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
                <span className="material-icons">close</span>
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-10">
            
            {/* HOME VIEW */}
            {view === 'home' && (
                <div className="max-w-5xl mx-auto">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Available Learning Pods</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Pitch Perfector */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="h-32 bg-fuchsia-100 flex items-center justify-center group-hover:bg-fuchsia-200 transition-colors">
                                <span className="material-icons text-6xl text-fuchsia-500">mic_external_on</span>
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg text-gray-900">Pitch Perfector</h4>
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">Active</span>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">Master your elevator pitch. Get instant, shark-tank style feedback (but nicer) and a refined script.</p>
                                <button 
                                    onClick={handleStartPitch}
                                    className="w-full py-2 bg-fuchsia-600 text-white font-medium rounded-lg hover:bg-fuchsia-700 transition-colors"
                                >
                                    Start Workshop
                                </button>
                            </div>
                        </div>

                        {/* Prompting Masterclass */}
                         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="h-32 bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <span className="material-icons text-6xl text-blue-500">auto_awesome</span>
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg text-gray-900">Prompting Excellence</h4>
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">Active</span>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">Learn the "Golden Formula" for speaking to AI. Transform vague requests into powerful results.</p>
                                <button 
                                    onClick={handleStartPrompting}
                                    className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Start Masterclass
                                </button>
                            </div>
                        </div>

                        {/* Coming Soon */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden opacity-75">
                            <div className="h-32 bg-gray-100 flex items-center justify-center">
                                <span className="material-icons text-6xl text-gray-400">campaign</span>
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg text-gray-900">Brand Voice Bootcamp</h4>
                                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">Coming Soon</span>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">Define your unique personality and tone to attract your dream clients.</p>
                                <button disabled className="w-full py-2 bg-gray-200 text-gray-500 font-medium rounded-lg cursor-not-allowed">
                                    Locked
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Completed History */}
                    {(userProfile.completedCourses || []).length > 0 && (
                        <div className="mt-12">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Your Achievements</h3>
                            <div className="flex flex-wrap gap-4">
                                {userProfile.completedCourses?.map(course => (
                                    <div key={course.id} className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                                        <span className="material-icons text-yellow-500">emoji_events</span>
                                        <span className="font-medium text-gray-700">{course.name}</span>
                                        <span className="text-xs text-gray-400 ml-2">({course.completedAt})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ================= PITCH PERFECTOR FLOW ================= */}

            {/* PITCH INPUT VIEW */}
            {view === 'pitch-input' && (
                <div className="max-w-3xl mx-auto animate-fadeIn">
                    <button onClick={() => setView('home')} className="mb-6 flex items-center text-gray-500 hover:text-gray-800">
                        <span className="material-icons mr-1">arrow_back</span> Back
                    </button>
                    
                    <div className="text-center mb-8">
                        <h3 className="text-3xl font-bold text-gray-900">Pitch Perfector</h3>
                        <p className="text-gray-600 mt-2">Paste your elevator pitch or sales script. I'll critique it and help you refine it.</p>
                    </div>

                    <div className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Who are you pitching to?</label>
                            <input 
                                type="text" 
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                                placeholder="e.g. A busy angel investor, a potential coaching client..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Your Current Pitch</label>
                            <textarea 
                                value={pitch}
                                onChange={(e) => setPitch(e.target.value)}
                                placeholder="Hi, I help..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none h-40 resize-none"
                            />
                        </div>
                        <button 
                            onClick={handleAnalyzePitch}
                            disabled={!pitch.trim() || !audience.trim() || isLoading}
                            className="w-full py-4 bg-fuchsia-600 text-white font-bold rounded-lg hover:bg-fuchsia-700 transition-colors shadow-lg flex items-center justify-center disabled:opacity-50"
                        >
                            {isLoading ? <LoadingSpinner /> : 'Analyze My Pitch'}
                        </button>
                    </div>
                </div>
            )}

            {/* PITCH RESULT VIEW */}
            {view === 'pitch-result' && result && (
                <div className="max-w-4xl mx-auto animate-fadeIn">
                     <button onClick={() => setView('pitch-input')} className="mb-6 flex items-center text-gray-500 hover:text-gray-800">
                        <span className="material-icons mr-1">arrow_back</span> Edit Input
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Score Card */}
                        <div className="md:col-span-1 space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
                                <h4 className="text-gray-500 font-medium uppercase text-xs tracking-wider mb-2">Impact Score</h4>
                                <div className="relative inline-flex items-center justify-center">
                                    <svg className="w-32 h-32">
                                        <circle className="text-gray-200" strokeWidth="8" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                                        <circle 
                                            className={`${result.score > 80 ? 'text-green-500' : result.score > 60 ? 'text-yellow-500' : 'text-red-500'}`} 
                                            strokeWidth="8" 
                                            strokeDasharray={365} 
                                            strokeDashoffset={365 - (365 * result.score) / 100} 
                                            strokeLinecap="round" 
                                            stroke="currentColor" 
                                            fill="transparent" 
                                            r="58" 
                                            cx="64" 
                                            cy="64" 
                                            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%'}}
                                        />
                                    </svg>
                                    <span className="absolute text-3xl font-bold text-gray-800">{result.score}</span>
                                </div>
                                <p className="mt-4 text-sm text-gray-600 italic">"{result.feedback}"</p>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h4 className="font-bold text-green-700 flex items-center mb-3">
                                    <span className="material-icons mr-2 text-sm">thumb_up</span> Strengths
                                </h4>
                                <ul className="space-y-2">
                                    {result.strengths.map((s, i) => (
                                        <li key={i} className="text-sm text-gray-600 flex items-start">
                                            <span className="mr-2 text-green-500">•</span> {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                             <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h4 className="font-bold text-red-600 flex items-center mb-3">
                                    <span className="material-icons mr-2 text-sm">construction</span> Improvements
                                </h4>
                                <ul className="space-y-2">
                                    {result.weaknesses.map((w, i) => (
                                        <li key={i} className="text-sm text-gray-600 flex items-start">
                                            <span className="mr-2 text-red-400">•</span> {w}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Refined Pitch */}
                        <div className="md:col-span-2 bg-white p-8 rounded-xl border border-fuchsia-200 shadow-md flex flex-col">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">🦋 The Butterfly Version</h3>
                            <p className="text-gray-500 text-sm mb-6">Here is a more polished, high-impact version of your pitch.</p>
                            
                            <div className="bg-fuchsia-50 p-6 rounded-lg border-l-4 border-fuchsia-500 mb-6 flex-1">
                                <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">{result.refinedPitch}</p>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button 
                                    onClick={() => navigator.clipboard.writeText(result.refinedPitch)}
                                    className="px-4 py-2 text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg font-medium transition-colors"
                                >
                                    Copy Text
                                </button>
                                <button 
                                    onClick={() => handleCompleteCourse('pitch-perfector', 'Pitch Perfector')}
                                    className="px-6 py-2 bg-fuchsia-600 text-white font-bold rounded-lg hover:bg-fuchsia-700 shadow-md transition-transform transform hover:-translate-y-1"
                                >
                                    Accept & Complete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= PROMPTING MASTERCLASS FLOW ================= */}

            {/* LESSON VIEW */}
            {view === 'prompt-lesson' && (
                 <div className="max-w-4xl mx-auto animate-fadeIn">
                    <button onClick={() => setView('home')} className="mb-6 flex items-center text-gray-500 hover:text-gray-800">
                        <span className="material-icons mr-1">arrow_back</span> Back
                    </button>
                    
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                        <div className="text-center mb-8">
                            <span className="bg-blue-100 text-blue-700 p-3 rounded-full inline-block mb-4">
                                <span className="material-icons text-3xl">auto_awesome</span>
                            </span>
                            <h3 className="text-3xl font-bold text-gray-900">The Golden Formula of Prompting</h3>
                            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                                To get the absolute most out of Social Butterfly (and any AI), you need to speak its language. 
                                The difference between a mediocre answer and a brilliant strategy lies in <strong>context</strong>.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                            <div className="space-y-4">
                                <h4 className="font-bold text-lg text-gray-800">The 4 Pillars</h4>
                                <ul className="space-y-3">
                                    <li className="flex items-start">
                                        <span className="bg-fuchsia-100 text-fuchsia-700 font-bold rounded px-2 mr-3">1</span>
                                        <div>
                                            <span className="font-bold block text-gray-900">Persona</span>
                                            <span className="text-sm text-gray-600">Who is the AI? (e.g., "Act as a Senior Marketing VP")</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-fuchsia-100 text-fuchsia-700 font-bold rounded px-2 mr-3">2</span>
                                        <div>
                                            <span className="font-bold block text-gray-900">Task</span>
                                            <span className="text-sm text-gray-600">What specific thing do you need? (e.g., "Write a 3-part email sequence")</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-fuchsia-100 text-fuchsia-700 font-bold rounded px-2 mr-3">3</span>
                                        <div>
                                            <span className="font-bold block text-gray-900">Context</span>
                                            <span className="text-sm text-gray-600">Who is the audience? What is the goal? (e.g., "For tired moms who need a break.")</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-fuchsia-100 text-fuchsia-700 font-bold rounded px-2 mr-3">4</span>
                                        <div>
                                            <span className="font-bold block text-gray-900">Format</span>
                                            <span className="text-sm text-gray-600">How should it look? (e.g., "Use bullet points, casual tone, under 200 words.")</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wide mb-4">Example Comparison</h4>
                                
                                <div className="mb-4">
                                    <p className="text-xs font-bold text-red-500 mb-1">❌ Weak Prompt</p>
                                    <div className="bg-white p-3 rounded border border-red-100 text-gray-600 text-sm italic">
                                        "Write a post about coffee."
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-green-500 mb-1">✅ Golden Prompt</p>
                                    <div className="bg-white p-3 rounded border border-green-100 text-gray-800 text-sm">
                                        "<strong>Act as</strong> a barista. <strong>Write a</strong> catchy Instagram caption about morning coffee <strong>for</strong> busy entrepreneurs. <strong>Use</strong> emojis and keep it under 2 sentences."
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <button 
                                onClick={() => setView('prompt-practice')}
                                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 shadow-lg transition-transform transform hover:-translate-y-1"
                            >
                                Start Practice Exercise
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PRACTICE VIEW */}
            {view === 'prompt-practice' && (
                <div className="max-w-3xl mx-auto animate-fadeIn">
                     <button onClick={() => setView('prompt-lesson')} className="mb-6 flex items-center text-gray-500 hover:text-gray-800">
                        <span className="material-icons mr-1">arrow_back</span> Back to Lesson
                    </button>
                    
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center space-x-4 mb-6">
                            <span className="material-icons text-4xl text-amber-500">fitness_center</span>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">The Challenge</h3>
                                <p className="text-gray-600">Turn this weak prompt into a masterpiece using the 4 Pillars.</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm font-bold text-gray-500 uppercase mb-2">Original Weak Prompt:</p>
                            <div className="bg-gray-100 p-4 rounded-lg text-gray-700 italic">
                                "Write a blog post about coffee."
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Your Improved Version:</label>
                            <textarea 
                                value={practicePrompt}
                                onChange={(e) => setPracticePrompt(e.target.value)}
                                className="w-full p-4 border-2 border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[150px] text-gray-800"
                                placeholder="Act as a... Write a... For an audience of... Using a tone of..."
                            />
                            <p className="text-xs text-gray-400 mt-2 text-right">Remember: Persona, Task, Context, Format</p>
                        </div>

                        <button 
                            onClick={handleGradePrompt}
                            disabled={isLoading}
                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center"
                        >
                            {isLoading ? <LoadingSpinner /> : 'Grade My Prompt'}
                        </button>
                    </div>
                </div>
            )}

            {/* PROMPT RESULT VIEW */}
            {view === 'prompt-result' && promptResult && (
                <div className="max-w-4xl mx-auto animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* Feedback Card */}
                        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
                            <h4 className="text-gray-500 font-medium uppercase text-xs tracking-wider mb-4">Prompt Score</h4>
                            <div className="relative inline-flex items-center justify-center mb-6">
                                <div className={`w-32 h-32 rounded-full flex items-center justify-center border-8 ${promptResult.score >= 80 ? 'border-green-500 text-green-600' : 'border-amber-500 text-amber-600'}`}>
                                    <span className="text-4xl font-bold">{promptResult.score}</span>
                                </div>
                            </div>
                            <h3 className={`text-xl font-bold mb-2 ${promptResult.score >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
                                {promptResult.score >= 80 ? 'Excellent Work!' : 'Room for Improvement'}
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {promptResult.feedback}
                            </p>

                            {promptResult.score < 80 && (
                                <button 
                                    onClick={() => setView('prompt-practice')}
                                    className="mt-6 text-blue-600 font-medium hover:underline"
                                >
                                    Try Again
                                </button>
                            )}
                        </div>

                        {/* "Golden" Version */}
                        <div className="bg-gray-900 p-8 rounded-2xl text-white flex flex-col justify-between shadow-xl">
                            <div>
                                <div className="flex items-center space-x-2 mb-4">
                                    <span className="material-icons text-yellow-400">star</span>
                                    <h4 className="font-bold text-yellow-400 uppercase tracking-wide text-sm">The Golden Version</h4>
                                </div>
                                <p className="text-gray-300 text-sm mb-4">Here is how an expert prompt engineer would write it:</p>
                                <div className="bg-white/10 p-4 rounded-lg border border-white/20 text-gray-100 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                                    {promptResult.improvedPrompt}
                                </div>
                            </div>
                            
                            {promptResult.score >= 80 && (
                                <button 
                                    onClick={() => handleCompleteCourse('prompting-masterclass', 'Prompting Excellence')}
                                    className="mt-8 w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:-translate-y-1"
                                >
                                    Claim Certificate
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}


            {/* CERTIFICATE VIEW */}
            {view === 'certificate' && (
                <div className="flex flex-col items-center animate-slideInUp pb-10">
                    <span className="material-icons text-6xl text-yellow-400 mb-4 animate-bounce">stars</span>
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">Congratulations!</h2>
                    <p className="text-gray-600 text-lg mb-8">You've mastered the {completedCourseName} module.</p>
                    
                    <Certificate 
                        userName={userProfile.name}
                        courseName={completedCourseName}
                        date={new Date().toLocaleDateString()}
                    />
                    
                    <button 
                        onClick={() => setView('home')}
                        className="mt-12 text-gray-500 hover:text-fuchsia-600 underline"
                    >
                        Back to Academy Home
                    </button>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default AcademyModal;
