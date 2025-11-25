
import React, { useState } from 'react';
import { PlanDetails } from '../types';
import { loginUser, registerUser, resetPassword } from '../services/firebase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (plan?: PlanDetails, isAdmin?: boolean) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'email-sent'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        if (view === 'login') {
            await loginUser(email, password);
            onLoginSuccess(); 
        } else {
            await registerUser(email, password);
            onLoginSuccess();
        }
    } catch (err: any) {
        console.error(err);
        // Specific handling for common Firebase errors
        const msg = err.message || err.toString();
        if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
            setError('Incorrect email or password. Please try again or sign up.');
        } else if (msg.includes('auth/email-already-in-use')) {
            setError('This email is already registered. Please log in instead.');
        } else {
            setError('Authentication failed. Please check your connection and try again.');
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) {
          setError('Please enter your email address.');
          return;
      }
      setIsLoading(true);
      try {
        await resetPassword(email);
        setView('email-sent');
        setError('');
      } catch (err: any) {
          console.error(err);
          setError(err.message || 'Failed to send reset email.');
      } finally {
          setIsLoading(false);
      }
  };

  const switchView = (v: 'login' | 'register' | 'forgot') => {
      setView(v);
      setError('');
  };

  return (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8 modal-content relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-t-2xl"></div>

        <div className="flex justify-between items-center mb-6 flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-900">
                {view === 'login' ? 'Welcome Back' : view === 'register' ? 'Create Account' : 'Reset Password'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-2 hover:bg-gray-100">
                <span className="material-icons">close</span>
            </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 -mr-1">
        {(view === 'login' || view === 'register') && (
            <form onSubmit={handleAuth} className="space-y-6 pb-2">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                             <span className="material-icons text-[20px]">email</span>
                        </span>
                        <input 
                            type="email" 
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                            required
                        />
                    </div>
                </div>
                
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                             <span className="material-icons text-[20px]">lock</span>
                        </span>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer h-full w-10 justify-center"
                        >
                            <span className="material-icons text-[20px]">
                                {showPassword ? 'visibility' : 'visibility_off'}
                            </span>
                        </button>
                    </div>
                    {view === 'login' && (
                        <div className="flex justify-end mt-2">
                            <button type="button" onClick={() => switchView('forgot')} className="text-sm text-fuchsia-600 hover:text-fuchsia-800 font-medium hover:underline">
                                Forgot Password?
                            </button>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200 flex items-center animate-pulse">
                        <span className="material-icons text-lg mr-2">error_outline</span>
                        {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-lg transition-all transform hover:scale-[1.01] shadow-lg hover:shadow-xl flex items-center justify-center disabled:bg-gray-400"
                >
                    {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        view === 'login' ? 'Log In' : 'Create Account'
                    )}
                </button>

                <div className="pt-4 text-center">
                    {view === 'login' ? (
                        <p className="text-sm text-gray-600">Don't have an account? <button type="button" onClick={() => switchView('register')} className="text-fuchsia-600 font-bold hover:underline">Sign Up</button></p>
                    ) : (
                        <p className="text-sm text-gray-600">Already have an account? <button type="button" onClick={() => switchView('login')} className="text-fuchsia-600 font-bold hover:underline">Log In</button></p>
                    )}
                </div>
            </form>
        )}

        {view === 'forgot' && (
            <form onSubmit={handleResetRequest} className="space-y-6">
                <p className="text-gray-600 text-sm">
                    Enter the email address associated with your account and we'll send you a link to reset your password.
                </p>
                <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <span className="material-icons text-[20px]">email</span>
                        </span>
                        <input 
                            type="email" 
                            id="reset-email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none bg-white text-gray-900 placeholder-gray-400"
                            required
                        />
                    </div>
                </div>
                {error && <div className="text-red-500 text-sm">{error}</div>}
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-lg transition-colors"
                >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button 
                    type="button"
                    onClick={() => switchView('login')} 
                    className="w-full py-3 px-4 text-gray-600 hover:text-gray-800 font-medium rounded-lg"
                >
                    Back to Log In
                </button>
            </form>
        )}

        {view === 'email-sent' && (
            <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-icons text-3xl">mark_email_read</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Check your email</h3>
                <p className="text-gray-600 mb-6 text-sm">
                    We've sent a password reset link to <strong>{email}</strong>.
                </p>
                <button onClick={() => switchView('login')} className="text-fuchsia-600 font-medium hover:underline text-sm">
                    Back to Login
                </button>
            </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
