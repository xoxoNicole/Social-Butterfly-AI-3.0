
import React, { useState, useEffect } from 'react';
import { auth, updateUserProfile, subscribeToProfile, UserProfile } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import LandingPage from './components/LandingPage';
import ChatPage from './components/ChatPage';
import SubscriptionModal from './components/SubscriptionModal';
import LoginModal from './components/LoginModal';
import SupportModal from './components/SupportModal';
import { PlanID, getPlanDetails } from './plans';
import { PlanDetails } from './types';
import { appUpdates } from './updates';

const App: React.FC = () => {
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'landing' | 'chat'>('landing');
  const [showSubscription, setShowSubscription] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasUnreadUpdates, setHasUnreadUpdates] = useState(false);

  // Check for unread updates
  useEffect(() => {
    const lastSeen = localStorage.getItem('last_update_seen');
    if (appUpdates.length > 0 && lastSeen !== appUpdates[0].id) {
        setHasUnreadUpdates(true);
    }
  }, []);

  // Real Firebase Auth State Listener
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
            setUser(firebaseUser);
            
            // Subscribe to real Firestore profile and WAIT for it before showing app
            unsubscribeProfile = subscribeToProfile(firebaseUser.uid, (profile) => {
                setUserProfile(profile);
                setLoading(false); // Stop loading only after profile is ready
                setView('chat');
            });
        } else {
            setUser(null);
            setUserProfile(null);
            setView('landing');
            if (unsubscribeProfile) {
                unsubscribeProfile();
                unsubscribeProfile = undefined;
            }
            setLoading(false); // Stop loading immediately if no user
        }
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // This function is called when a user successfully "subscribes" via Stripe redirect.
  const handleSubscriptionSuccess = async (plan: PlanDetails) => {
    if (user) {
        // Look up the plan configuration to find out how many credits they should get
        const planConfig = getPlanDetails(plan.id);
        const newCredits = planConfig ? planConfig.credits : 500;
        
        // Strict Overwrite: Ensure we give them the FULL plan amount immediately
        await updateUserProfile(user.uid, {
            plan,
            credits: newCredits 
        });
        localStorage.setItem('userPlan', JSON.stringify(plan)); 
    }
    setShowSubscription(false);
    setShowLogin(false);
    setView('chat');
  };

  // Handle One-Time Credit Top-Up Success
  const handleCreditTopUpSuccess = async (amount: number) => {
      if (user && userProfile) {
          // Only apply if we haven't applied this specific transaction recently (simple debounce)
          const currentCredits = userProfile.credits || 0;
          await updateUserProfile(user.uid, {
              credits: currentCredits + amount
          });
          alert(`Successfully added ${amount} credits to your account!`);
      }
  };

  // Check for successful payment redirect from Stripe on initial load.
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const paymentStatus = query.get('payment');
    
    if (paymentStatus === 'success') {
      // Check for Plan Subscription
      const rawPlanId = query.get('plan');
      const planId = rawPlanId ? rawPlanId.toLowerCase() as PlanID : null;
      const billing = (query.get('billing') || 'monthly') as 'monthly' | 'annual';
      
      // Check for Credit Top Up
      const type = query.get('type');
      const amount = parseInt(query.get('amount') || '0', 10);

      if (planId) {
        if (user) {
            handleSubscriptionSuccess({ id: planId, billing });
        } else {
            localStorage.setItem('pendingPlan', JSON.stringify({ id: planId, billing }));
            setShowLogin(true); 
        }
      } else if (type === 'credits' && amount > 0) {
          if (user && userProfile) { // Ensure profile loaded
             handleCreditTopUpSuccess(amount);
          } 
      }
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, userProfile]); 

  const enterApp = () => {
    if (user) {
      setView('chat');
    } else {
      setShowLogin(true);
    }
  };
  
  const goHome = () => {
    setView('landing');
  }

  if (loading) {
      return <div className="h-screen w-screen flex items-center justify-center bg-white"><div className="animate-spin h-8 w-8 border-4 border-fuchsia-600 rounded-full border-t-transparent"></div></div>;
  }

  return (
    <>
      {view === 'landing' && (
        <LandingPage 
            onEnterApp={enterApp} 
            onLogin={() => setShowLogin(true)} 
        />
      )}
      {view === 'chat' && user && userProfile && (
        <ChatPage 
            onGoHome={goHome} 
            currentUser={user} 
            initialProfile={userProfile}
            onOpenSupport={() => setShowSupport(true)} 
            onManageSubscription={() => setShowSubscription(true)}
        />
      )}
      {showSubscription && <SubscriptionModal onClose={() => setShowSubscription(false)} />}
      {showSupport && user && (
        <SupportModal 
            isOpen={showSupport} 
            onClose={() => setShowSupport(false)} 
            userId={user.uid} 
            userEmail={user.email || ''} 
        />
      )}
      {showLogin && (
        <LoginModal 
            isOpen={showLogin} 
            onClose={() => setShowLogin(false)} 
            onLoginSuccess={() => {
                setShowLogin(false);
                const pending = localStorage.getItem('pendingPlan');
                if (pending) {
                    const plan = JSON.parse(pending);
                    handleSubscriptionSuccess(plan);
                    localStorage.removeItem('pendingPlan');
                }
            }} 
        />
      )}
    </>
  );
};

export default App;
