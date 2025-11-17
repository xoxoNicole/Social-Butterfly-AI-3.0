import React, { useState, useEffect } from 'react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: { name: string; business: string; photo: string; role: string; }) => void;
  currentProfile: { name: string; business: string; photo: string; role: string; };
}

const DefaultAvatar = () => (
    <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
        <span className="material-icons text-5xl text-gray-400">person</span>
    </div>
);

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSave, currentProfile }) => {
  const [name, setName] = useState(currentProfile.name);
  const [business, setBusiness] = useState(currentProfile.business);
  const [photo, setPhoto] = useState(currentProfile.photo);
  const [role, setRole] = useState(currentProfile.role);

  useEffect(() => {
    setName(currentProfile.name);
    setBusiness(currentProfile.business);
    setPhoto(currentProfile.photo);
    setRole(currentProfile.role || '');
  }, [currentProfile, isOpen]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name: name.trim(), business: business.trim(), photo, role: (role || '').trim() });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Close profile modal">
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">Personalize your experience by telling the AI a little about yourself and your business. This context will help it provide more relevant advice.</p>

        <form onSubmit={handleSave}>
            <div className="space-y-6">
                <div className="flex items-center space-x-6">
                    {photo ? (
                        <img src={photo} alt="Profile preview" className="h-24 w-24 rounded-full object-cover" />
                    ) : (
                        <DefaultAvatar />
                    )}
                    <label htmlFor="photo-upload" className="cursor-pointer px-4 py-2 text-sm font-medium text-fuchsia-600 border border-fuchsia-600 rounded-md hover:bg-fuchsia-50 transition-colors">
                        <span>Upload Photo</span>
                        <input id="photo-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handlePhotoChange} />
                    </label>
                </div>
                <div>
                    <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                    <input
                        id="profile-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Jane Doe"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                    />
                </div>
                <div>
                    <label htmlFor="profile-role" className="block text-sm font-medium text-gray-700 mb-1">Your Role</label>
                    <input
                        id="profile-role"
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g., Founder, CEO, Marketing Lead"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                    />
                </div>
                <div>
                    <label htmlFor="profile-business" className="block text-sm font-medium text-gray-700 mb-1">Your Business Summary</label>
                    <textarea
                        id="profile-business"
                        value={business}
                        onChange={(e) => setBusiness(e.target.value)}
                        placeholder="e.g., A faith-based coaching service for new female entrepreneurs."
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 min-h-[100px]"
                        rows={3}
                    />
                </div>
            </div>
            <div className="mt-8 flex justify-end">
                <button
                    type="submit"
                    className="px-6 py-2 text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700 disabled:bg-gray-400 transition-colors"
                >
                    Save Profile
                </button>
            </div>
        </form>

      </div>
    </div>
  );
};

export default ProfileModal;