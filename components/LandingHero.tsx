import React from 'react';

interface LandingHeroProps {
  onEnterApp: () => void;
}

const LandingHero: React.FC<LandingHeroProps> = ({ onEnterApp }) => {
  return (
    <section 
      id="hero" 
      className="relative bg-gradient-to-br from-gray-900 to-fuchsia-900"
    >
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-gray-50 to-transparent"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-32 md:py-48 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight">
          <span className="block">The Future of Work is</span>
          <span className="block text-fuchsia-400">Social Butterfly AI</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-200">
          Your best friend in business. Validate, design, launch, and scale your dream venture with a partner that gets you.
        </p>
        <div className="mt-10">
          <button
            onClick={onEnterApp}
            className="px-8 py-3 text-lg font-medium text-white bg-fuchsia-600 rounded-full hover:bg-fuchsia-700 transition-transform transform hover:scale-105 shadow-lg"
          >
            Start Building Your Future
          </button>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;