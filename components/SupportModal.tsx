


import React, { useState } from 'react';
import { submitSupportTicket } from '../services/firebase';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
}

const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, userId, userEmail }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitSupportTicket({
        userId,
        userEmail,
        subject,
        message
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setSubject('');
        setMessage('');
      }, 2000);
    } catch (error) {
      console.error("Error submitting ticket", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 modal-content" onClick={e => e.stopPropagation()}>
        
        {success ? (
            <div className="text-center py-10">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                    <span className="material-icons text-3xl text-green-600">check</span>
                </div>
                <h3 className="mt-4 text-xl font-bold text-gray-900">Message Sent!</h3>
                <p className="mt-2 text-gray-600">We've received your request and will get back to you shortly at <strong>{userEmail}</strong>.</p>
            </div>
        ) : (
            <>
                <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <span className="material-icons text-fuchsia-600 mr-2">support_agent</span>
                    Contact Support
                </h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                    <span className="material-icons">close</span>
                </button>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                    Having trouble? Send us a message directly. We're here to help you build your business without technical roadblocks.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <select 
                            value={subject} 
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900"
                            required
                        >
                            <option value="" disabled>Select a topic...</option>
                            <option value="Billing & Subscription">Billing & Subscription</option>
                            <option value="Technical Issue">Technical Issue</option>
                            <option value="Feature Request">Feature Request</option>
                            <option value="Feedback">General Feedback</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe your issue or question..."
                            className="w-full p-3 border border-gray-300 rounded-md h-32 resize-none focus:ring-2 focus:ring-fuchsia-500 outline-none bg-white text-gray-900 placeholder-gray-400"
                            required
                        />
                    </div>

                    <div className="pt-2 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700 transition-colors disabled:bg-gray-400 flex items-center"
                        >
                            {isSubmitting ? 'Sending...' : 'Send Message'}
                        </button>
                    </div>
                </form>
            </>
        )}
      </div>
    </div>
  );
};

export default SupportModal;