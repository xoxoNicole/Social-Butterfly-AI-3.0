import React from 'react';

interface LandingPricingProps {
  onEnterApp: () => void;
}

const CheckIcon = () => (
  <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

const PricingCard: React.FC<{
  level: string,
  price: number,
  description: string,
  features: string[],
  isFeatured?: boolean,
  onSubscribe: () => void
}> = ({ level, price, description, features, isFeatured = false, onSubscribe }) => (
  <div className={`border rounded-lg p-8 flex flex-col ${isFeatured ? 'border-fuchsia-500 shadow-2xl relative' : 'border-gray-200 bg-white'}`}>
    {isFeatured && <div className="absolute top-0 -translate-y-1/2 bg-fuchsia-500 text-white text-sm font-semibold px-3 py-1 rounded-full uppercase">Most Popular</div>}
    <h3 className="text-2xl font-semibold text-gray-900">{level} Level</h3>
    <p className="mt-4 text-gray-600">{description}</p>
    <div className="mt-6">
      <span className="text-5xl font-extrabold text-gray-900">${price}</span>
      <span className="text-base font-medium text-gray-500">/mo</span>
    </div>
    <ul className="mt-8 space-y-4 flex-grow">
      {features.map((feature) => (
        <li key={feature} className="flex items-start">
          <div className="flex-shrink-0"><CheckIcon /></div>
          <p className="ml-3 text-base text-gray-600">{feature}</p>
        </li>
      ))}
    </ul>
    <button onClick={onSubscribe} className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium ${isFeatured ? 'text-white bg-fuchsia-600 hover:bg-fuchsia-700' : 'text-fuchsia-700 bg-fuchsia-100 hover:bg-fuchsia-200'}`}>
      Choose Plan
    </button>
  </div>
);

const LandingPricing: React.FC<LandingPricingProps> = ({ onEnterApp }) => {
  const creatorFeatures = [
    "AI Powered Chatbot",
    "Market Validation Reports",
    "Audience Discovery",
    "Content Idea Generation"
  ];

  const proFeatures = [
    ...creatorFeatures,
    "Full Product Suite Strategy",
    "Customer Journey Mapping",
    "Content Calendar Creation",
    "Image & Video Generation",
    "Optional Faith Alignment Lens"
  ];

  return (
    <section id="pricing" className="py-20 bg-white scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Path to Purposeful Profit
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Simple, transparent pricing for entrepreneurs at every stage.
          </p>
        </div>
        <div className="mt-12 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-8">
          <PricingCard 
            level="Creator"
            price={10}
            description="Perfect for validating your idea and getting started."
            features={creatorFeatures}
            onSubscribe={onEnterApp}
          />
          <PricingCard 
            level="Pro"
            price={18}
            description="For entrepreneurs ready to scale with powerful, advanced tools."
            features={proFeatures}
            isFeatured={true}
            onSubscribe={onEnterApp}
          />
        </div>
      </div>
    </section>
  );
};

export default LandingPricing;
