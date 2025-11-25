import React from 'react';
import Header from './Header';
import LandingHero from './LandingHero';
import LandingFeatures from './LandingFeatures';
import LandingInclusivity from './LandingInclusivity';
import LandingTestimonials from './LandingTestimonials';
import LandingPricing from './LandingPricing';
import Footer from './Footer';

interface LandingPageProps {
  onEnterApp: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onLogin }) => {
  return (
    <div className="bg-white text-gray-800">
      <Header onEnterApp={onEnterApp} onLogin={onLogin} />
      <main>
        <LandingHero onEnterApp={onEnterApp} />
        <LandingFeatures />
        <LandingInclusivity />
        <LandingTestimonials />
        <LandingPricing onEnterApp={onEnterApp} />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;