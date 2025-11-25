import React, { useState } from 'react';
import { STRIPE_PAYMENT_LINKS } from '../config';
import { individualPlans, teamPlans, Plan, PlanID } from '../plans';

interface SubscriptionModalProps {
  onClose: () => void;
}

const CheckIcon = () => (
    <svg className="h-5 w-5 text-fuchsia-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
);

const ButtonSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
          <button onClick={increment} type="button" className="h-5 w-5 flex items-center justify-center text-gray-500 hover:text-gray-800" aria-label="Increase seats">▲</button>
          <button onClick={decrement} type="button" className="h-5 w-5 flex items-center justify-center text-gray-500 hover:text-gray-800" aria-label="Decrease seats">▼</button>
        </div>
      </div>
    );
};

const PricingCard: React.FC<{
    plan: Plan;
    billingCycle: 'monthly' | 'annual';
    isTeamPlan?: boolean;
    onSubscribe: () => void;
    isRedirecting: boolean;
    seats: number;
    setSeats: (seats: number) => void;
  }> = ({ plan, billingCycle, isTeamPlan = false, onSubscribe, isRedirecting, seats, setSeats }) => {
    // Safeguard: Ensure individual plans always calculate as 1 seat, regardless of props passed.
    const effectiveSeats = isTeamPlan ? seats : 1;
    
    const price = plan.pricing[billingCycle];
    const totalMonthlyPrice = price * effectiveSeats;
    const totalAnnualPrice = totalMonthlyPrice * 12;
    const features = typeof plan.features === 'function' ? plan.features(billingCycle) : plan.features;
  
    return (
      <div className={`border rounded-xl p-6 flex flex-col bg-white ${plan.isFeatured ? 'border-fuchsia-500 shadow-xl' : 'border-gray-200'}`}>
        {plan.isFeatured ? (
            <div className="self-center bg-fuchsia-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
                Most Popular
            </div>
        ) : (
            <div className="h-6 mb-4" aria-hidden="true"></div>
        )}
        <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
        <p className="mt-2 text-gray-600 h-10 text-sm">{plan.description}</p>
        
        <div className="mt-4">
          <span className="text-4xl font-extrabold text-gray-900">${totalMonthlyPrice}</span>
          <span className="text-base font-medium text-gray-500">/mo{isTeamPlan ? ' total' : ''}</span>
        </div>

        {billingCycle === 'annual' && (
             <p className="text-xs font-medium text-fuchsia-700 mt-2 bg-fuchsia-50 inline-block px-2 py-1 rounded self-start">
                Billed ${totalAnnualPrice} annually
             </p>
        )}
        
        {isTeamPlan && <p className="text-xs text-gray-500 mt-1">${price}/seat/month</p>}
        
        <p className="mt-2 text-md font-semibold text-fuchsia-600">{plan.credits.toLocaleString()} credits {isTeamPlan ? 'per seat' : ''}</p>
        
        {isTeamPlan && (
            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of seats</label>
                <NumberInput value={seats} onChange={setSeats} />
            </div>
        )}

        <ul className="mt-6 space-y-3 flex-grow">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <div className="flex-shrink-0 pt-1"><CheckIcon /></div>
              <p className="ml-3 text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: feature }} />
            </li>
          ))}
        </ul>
        <button 
          onClick={onSubscribe} 
          disabled={isRedirecting}
          className={`mt-6 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium ${plan.isFeatured ? 'text-white bg-fuchsia-600 hover:bg-fuchsia-700' : 'text-fuchsia-700 bg-fuchsia-100 hover:bg-fuchsia-200'} disabled:opacity-75 disabled:cursor-wait flex justify-center items-center`}>
          {isRedirecting ? <ButtonSpinner /> : 'Choose Plan'}
        </button>
      </div>
    );
};

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose }) => {
    const [isRedirecting, setIsRedirecting] = useState<PlanID | null>(null);
    const [planType, setPlanType] = useState<'individual' | 'team'>('individual');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
    const [teamSeats, setTeamSeats] = useState(2);
    const [businessSeats, setBusinessSeats] = useState(10);

    const handleSubscribe = (planId: PlanID) => {
        setIsRedirecting(planId);
        
        let url = STRIPE_PAYMENT_LINKS[planId][billingCycle];
        
        if (!url || url.includes('placeholder')) {
            alert('Stripe Payment Link is not configured. Please update the links in `config.ts`.');
            setIsRedirecting(null);
            return;
        }

        // Add quantity for team plans to pre-fill the Stripe checkout page
        if (planId === 'team' || planId === 'business') {
          const seats = planId === 'team' ? teamSeats : businessSeats;
          const quantity = Math.max(1, seats); // Ensure at least 1 seat
          if (url.includes('?')) {
            url += `&prefilled_quantity=${quantity}`;
          } else {
            url += `?prefilled_quantity=${quantity}`;
          }
        }

        setTimeout(() => {
            window.location.href = url;
        }, 100);
    };
    
    const plansToShow = planType === 'individual' ? individualPlans : teamPlans;
      
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4 modal-backdrop" onClick={onClose}>
            <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-5xl p-6 modal-content flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="text-center relative">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Choose Your Plan
                    </h2>
                    <p className="mt-4 text-lg text-gray-600">
                        Unlock the power of Social Butterfly-AI.
                    </p>
                    <button onClick={onClose} className="absolute -top-2 -right-2 text-gray-500 hover:text-gray-800" aria-label="Close subscription modal">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Toggles */}
                <div className="mt-8 flex flex-col items-center space-y-4">
                    <div className="bg-white p-1 rounded-full shadow-inner flex items-center">
                        <button onClick={() => setPlanType('individual')} className={`px-4 py-2 text-sm font-semibold rounded-full ${planType === 'individual' ? 'bg-fuchsia-500 text-white' : 'text-gray-600'}`}>Individual</button>
                        <button onClick={() => setPlanType('team')} className={`px-4 py-2 text-sm font-semibold rounded-full ${planType === 'team' ? 'bg-fuchsia-500 text-white' : 'text-gray-600'}`}>Team</button>
                    </div>
                    <div className="bg-gray-200 p-1 rounded-full flex items-center relative">
                        <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${billingCycle === 'monthly' ? 'bg-white shadow' : 'text-gray-600'}`}>Pay monthly</button>
                        <button onClick={() => setBillingCycle('annual')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${billingCycle === 'annual' ? 'bg-white shadow' : 'text-gray-600'}`}>Pay annually</button>
                    </div>
                </div>

                <div className={`mt-8 space-y-8 lg:space-y-0 lg:grid lg:gap-x-6 overflow-y-auto px-2 pb-4 ${planType === 'individual' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
                    {plansToShow.map(plan => {
                         // Determine seat count: 1 for individual, dynamic for team
                         const currentSeats = planType === 'individual' 
                            ? 1 
                            : (plan.id === 'team' ? teamSeats : businessSeats);
                         
                         const currentSetSeats = planType === 'individual' 
                            ? () => {} // No-op for individual
                            : (plan.id === 'team' ? setTeamSeats : setBusinessSeats);

                        return (
                            <PricingCard
                                key={plan.id}
                                plan={plan}
                                billingCycle={billingCycle}
                                isTeamPlan={planType === 'team'}
                                onSubscribe={() => handleSubscribe(plan.id)}
                                isRedirecting={isRedirecting === plan.id}
                                seats={currentSeats}
                                setSeats={currentSetSeats}
                            />
                        );
                    })}
                </div>

            </div>
        </div>
    );
};

export default SubscriptionModal;