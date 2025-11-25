import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cost: number;
  remaining: number;
  actionName: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, cost, remaining, actionName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-fuchsia-100 text-fuchsia-600 mx-auto">
          <span className="material-icons text-4xl">check_circle_outline</span>
        </div>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">Confirm Action</h2>
        <p className="mt-4 text-gray-600">
          Please confirm you'd like to proceed with <strong className="font-semibold">{actionName}</strong>.
        </p>
        
        <div className="mt-6 p-4 bg-gray-100 rounded-lg flex justify-around items-center">
            <div>
                <p className="text-sm text-gray-500">Cost</p>
                <p className="text-xl font-bold text-red-600">-{cost} Credits</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Remaining</p>
                <p className="text-xl font-bold text-green-600">{remaining} Credits</p>
            </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 font-medium rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 font-medium text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700 transition-colors"
          >
            Confirm & Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
