import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import ChatPage from './components/ChatPage';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'chat'>('landing');

  const enterApp = () => {
    setView('chat');
  };

  const goHome = () => {
    setView('landing');
  }

  if (view === 'landing') {
    return <LandingPage onEnterApp={enterApp} />;
  }

  return <ChatPage onGoHome={goHome} />;
};

export default App;