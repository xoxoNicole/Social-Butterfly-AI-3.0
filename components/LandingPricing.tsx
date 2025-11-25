import React, { useState } from 'react';
import { individualPlans, teamPlans, Plan } from '../plans';

interface LandingPricingProps {
  onEnterApp: () => void;
}

const CheckIcon = () => (
  <svg className="h-5 w-5 text-fuchsia-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

const NumberInput: React.FC<{ value: number; onChange: (value: number) => void }> = ({ value, onChange }) => {
  const increment = () => onChange(value + 1);
  const decrement = () => onChange(Math.max(1, value - 1));

  return (
    <div className="relative flex items-center">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 1)}
        className="w-full border-gray-300 rounded-md shadow-sm text-center"
        min="1"
      />
      <div className="absolute right-1 flex flex-col">
        <button onClick={increment} className="h-5 w-5 flex items-center justify-center text-gray-500 hover:text-gray-800" aria-label="Increase seats">▲</button>
        <button onClick={decrement} className="h-5 w-5 flex items-center justify-center text-gray-500 hover:text-gray-800" aria-label="Decrease seats">▼</button>
      </div>
    </div>
  );
};


const PricingCard: React.FC<{
  plan: Plan;
  billingCycle: 'monthly' | 'annual';
  isTeamPlan?: boolean;
  onSubscribe: () => void;
}> = ({ plan, billingCycle, isTeamPlan = false, onSubscribe }) => {
  const [seats, setSeats] = useState(isTeamPlan ? (plan.id === 'team' ? 2 : 10) : 1);
  const price = plan.pricing[billingCycle];
  const totalMonthlyPrice = price * seats;
  const totalAnnualPrice = totalMonthlyPrice * 12;

  const features = typeof plan.features === 'function' ? plan.features(billingCycle) : plan.features;

  return (
    <div className={`border rounded-xl p-6 flex flex-col bg-white ${plan.isFeatured ? 'border-fuchsia-500 shadow-2xl' : 'border-gray-200'}`}>
      {plan.isFeatured ? (
        <div className="self-center bg-fuchsia-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            Most Popular
        </div>
      ) : (
        <div className="h-6 mb-4" aria-hidden="true"></div>
      )}
      <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
      <p className="mt-2 text-gray-600 h-10">{plan.description}</p>
      
      <div className="mt-6">
        <span className="text-5xl font-extrabold text-gray-900">${totalMonthlyPrice}</span>
        <span className="text-base font-medium text-gray-500">/mo{isTeamPlan ? ' total' : ''}</span>
      </div>
      
      {isTeamPlan && (
        <p className="text-sm text-gray-500">
          ${price}/seat/month
          {billingCycle === 'annual' && `, billed $${price * 12} per seat annually`}
        </p>
      )}

      {billingCycle === 'annual' && !isTeamPlan && (
         <p className="text-sm text-gray-500">Billed ${totalAnnualPrice} annually</p>
      )}

      <p className="mt-2 text-md font-semibold text-fuchsia-600">
        {plan.credits.toLocaleString()} credits {isTeamPlan ? 'per seat' : ''}
      </p>

      {isTeamPlan && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of seats</label>
          <NumberInput value={seats} onChange={setSeats} />
        </div>
      )}

      <button onClick={onSubscribe} className={`mt-8 w-full py-3 px-6 rounded-md text-center font-medium ${plan.isFeatured ? 'text-white bg-fuchsia-600 hover:bg-fuchsia-700' : 'text-fuchsia-700 bg-fuchsia-100 hover:bg-fuchsia-200'}`}>
        Choose Plan
      </button>

      <ul className="mt-8 space-y-3 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <div className="flex-shrink-0 pt-1"><CheckIcon /></div>
            <p className="ml-3 text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: feature }} />
          </li>
        ))}
      </ul>
    </div>
  );
};

const LandingPricing: React.FC<LandingPricingProps> = ({ onEnterApp }) => {
  const [planType, setPlanType] = useState<'individual' | 'team'>('individual');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  
  const plansToShow = planType === 'individual' ? individualPlans : teamPlans;
  const annualDiscount = planType === 'individual' ? 28 : 20;

  return (
    <section id="pricing" className="py-20 bg-gray-50 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose the plan that's right for you
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Simple, transparent pricing for entrepreneurs and teams at every stage.
          </p>
        </div>

        {/* Toggles */}
        <div className="mt-10 flex flex-col items-center space-y-4">
            <div className="bg-white p-1 rounded-full shadow-inner flex items-center">
                <button onClick={() => setPlanType('individual')} className={`px-4 py-2 text-sm font-semibold rounded-full ${planType === 'individual' ? 'bg-fuchsia-500 text-white' : 'text-gray-600'}`}>Individual</button>
                <button onClick={() => setPlanType('team')} className={`px-4 py-2 text-sm font-semibold rounded-full ${planType === 'team' ? 'bg-fuchsia-500 text-white' : 'text-gray-600'}`}>Team</button>
            </div>
            <div className="bg-gray-200 p-1 rounded-full flex items-center relative">
                <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${billingCycle === 'monthly' ? 'bg-white shadow' : 'text-gray-600'}`}>Pay monthly</button>
                <button onClick={() => setBillingCycle('annual')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${billingCycle === 'annual' ? 'bg-white shadow' : 'text-gray-600'}`}>Pay annually</button>
                <span className="absolute -top-6 right-0 bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">Save up to {annualDiscount}%</span>
            </div>
        </div>

        <div className={`mt-12 space-y-12 lg:space-y-0 lg:grid lg:gap-x-6 ${planType === 'individual' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
          {plansToShow.map(plan => (
            <PricingCard 
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              isTeamPlan={planType === 'team'}
              onSubscribe={onEnterApp}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingPricing;