
import React from 'react';
import { appUpdates, UpdateType } from '../updates';

interface UpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TypeBadge: React.FC<{ type: UpdateType }> = ({ type }) => {
  switch (type) {
    case 'feature':
      return <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded border border-purple-400">New Feature</span>;
    case 'fix':
      return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded border border-green-400">Bug Fix</span>;
    case 'improvement':
      return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded border border-blue-400">Improvement</span>;
    default:
      return null;
  }
};

const UpdatesModal: React.FC<UpdatesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 modal-content flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-fuchsia-100 rounded-full text-fuchsia-600">
                <span className="material-icons">notifications_active</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">What's New</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors" aria-label="Close updates">
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {appUpdates.map((update) => (
            <div key={update.id} className="relative pl-4 border-l-2 border-gray-200">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-200 border-2 border-white"></div>
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                   <TypeBadge type={update.type} />
                   <span className="text-xs text-gray-500">{update.date}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{update.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {update.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">Social Butterfly-AI 3.0</p>
        </div>
      </div>
    </div>
  );
};

export default UpdatesModal;
