import React from 'react';
import { STRIPE_TOP_UP_500_CREDITS } from '../config';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleBuy = (url: string) => {
    if (url.includes('placeholder')) {
      alert('Stripe link for this top-up is not configured yet.');
      return;
    }
    window.location.href = url;
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 text-amber-600 mx-auto">
          <span className="material-icons text-4xl">shopping_cart</span>
        </div>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">Out of Credits?</h2>
        <p className="mt-4 text-gray-600">
          No problem! Purchase a credit pack to continue creating without interrupting your flow. Your subscription credits will still renew on your next billing date.
        </p>
        
        <div className="mt-8 space-y-4">
            <div className="p-4 border border-fuchsia-500 rounded-lg bg-fuchsia-50/50">
                <h3 className="font-bold text-lg text-fuchsia-800">500 Credits</h3>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">$7</p>
                <p className="text-sm text-gray-600">One-Time Purchase</p>
                <button
                    onClick={() => handleBuy(STRIPE_TOP_UP_500_CREDITS)}
                    className="mt-4 w-full px-6 py-2 text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700 transition-colors"
                >
                    Buy Now
                </button>
            </div>
        </div>
        
        <button onClick={onClose} className="mt-6 text-sm text-gray-500 hover:underline">
          Maybe later
        </button>
      </div>
    </div>
  );
};

export default BuyCreditsModal;
