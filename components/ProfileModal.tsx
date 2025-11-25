
import React, { useState, useEffect } from 'react';
import { UserProfile, updatePassword, deleteAccount } from '../services/firebase';
import { getPlanDetails } from '../plans';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Partial<UserProfile>) => void;
  currentProfile: UserProfile;
  onBuyCredits: () => void;
  onLogout?: () => void;
  onManageSubscription?: () => void;
}

const DefaultAvatar = () => (
    <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
        <span className="material-icons text-5xl text-gray-400">person</span>
    </div>
);

const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        } else {
          if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSave, currentProfile, onBuyCredits, onLogout, onManageSubscription }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');
  const [profileData, setProfileData] = useState<UserProfile>(currentProfile);
  
  // Account Management States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) setProfileData(currentProfile);
  }, [currentProfile, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { id, value } = e.target;
      const key = id.replace('profile-', '');
      setProfileData(prev => ({ ...prev, [key]: value }));
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const resizedPhoto = await resizeImage(e.target.files[0], 300, 300);
        setProfileData(prev => ({ ...prev, photo: resizedPhoto }));
      } catch (error) { console.error(error); }
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const { credits, plan, ...saveable } = profileData; 
    onSave(saveable);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) {
          setPasswordMsg({ type: 'error', text: "Passwords do not match."});
          return;
      }
      if (newPassword.length < 6) {
          setPasswordMsg({ type: 'error', text: "Password must be at least 6 characters."});
          return;
      }
      try {
          await updatePassword(newPassword);
          setPasswordMsg({ type: 'success', text: "Password updated successfully."});
          setNewPassword('');
          setConfirmPassword('');
      } catch (e) {
          setPasswordMsg({ type: 'error', text: "Failed to update password."});
      }
  };

  const handleDeleteAccount = async () => {
      if (window.confirm("Are you absolutely sure? This action cannot be undone. All your chats and data will be permanently deleted.")) {
          setIsDeleting(true);
          try {
            await deleteAccount(currentProfile.uid);
            // App will reload via service
          } catch (e) {
              alert("Failed to delete account.");
              setIsDeleting(false);
          }
      }
  }

  const planInfo = currentProfile.plan ? getPlanDetails(currentProfile.plan.id) : null;
  const isFreePlan = currentProfile.plan?.id === 'free';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-0 modal-content flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header with Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 p-6 pb-0 rounded-t-2xl">
            <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><span className="material-icons">close</span></button>
            </div>
            
            <div className="flex space-x-8">
                <button 
                    onClick={() => setActiveTab('profile')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'border-fuchsia-600 text-fuchsia-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Profile & Strategy
                </button>
                <button 
                    onClick={() => setActiveTab('account')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'account' ? 'border-fuchsia-600 text-fuchsia-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Account & Billing
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
            {activeTab === 'profile' ? (
                 <form onSubmit={handleSaveProfile}>
                     {/* Credits Banner */}
                    <div className={`mb-8 p-4 border rounded-xl flex items-center justify-between ${isFreePlan ? 'bg-amber-50 border-amber-200' : 'bg-fuchsia-50 border-fuchsia-100'}`}>
                        <div>
                            <p className={`text-sm font-medium ${isFreePlan ? 'text-amber-800' : 'text-fuchsia-800'}`}>
                                {isFreePlan ? 'Trial Credits Remaining' : 'Available Credits'}
                            </p>
                            <p className={`text-3xl font-bold ${isFreePlan ? 'text-amber-900' : 'text-fuchsia-900'}`}>{profileData.credits?.toLocaleString()}</p>
                        </div>
                        <button type="button" onClick={onBuyCredits} className="px-4 py-2 text-sm font-medium text-white bg-fuchsia-600 rounded-lg hover:bg-fuchsia-700 shadow-sm">
                            Buy Credits
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Public Profile */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                Public Profile
                                {profileData.role === 'admin' ? (
                                    <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full font-bold border border-purple-200 uppercase tracking-wider">
                                        Admin
                                    </span>
                                ) : (
                                    <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold border border-gray-200 uppercase tracking-wider">
                                        User
                                    </span>
                                )}
                            </h3>
                            <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
                                <div className="flex-shrink-0 mx-auto sm:mx-0">
                                    {profileData.photo ? <img src={profileData.photo} alt="Profile" className="h-24 w-24 rounded-full object-cover shadow-sm" /> : <DefaultAvatar />}
                                    <label className="block mt-2 text-center cursor-pointer">
                                        <span className="text-xs text-fuchsia-600 hover:text-fuchsia-800 font-medium">Change Photo</span>
                                        <input type="file" className="hidden" accept="image/jpeg,image/png" onChange={handlePhotoChange} />
                                    </label>
                                </div>
                                <div className="flex-1 space-y-4 w-full">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                        <input 
                                            id="profile-name" 
                                            type="text" 
                                            value={profileData.name} 
                                            onChange={handleInputChange} 
                                            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500 bg-white text-gray-900" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Business Name / Summary</label>
                                        <textarea 
                                            id="profile-business" 
                                            value={profileData.business} 
                                            onChange={handleInputChange} 
                                            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500 bg-white text-gray-900" 
                                            rows={2} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Strategy Context */}
                        <div className="border-t pt-6">
                            <div className="flex items-center mb-4">
                                <span className="material-icons text-fuchsia-500 mr-2">psychology</span>
                                <h3 className="text-lg font-medium text-gray-900">AI Strategy Context</h3>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">Social Butterfly-AI uses this information to personalize every response to your specific business.</p>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-600 uppercase">Ideal Customer</label>
                                    <textarea 
                                        id="profile-audience" 
                                        value={profileData.audience || ''} 
                                        onChange={handleInputChange} 
                                        className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 bg-white text-gray-900" 
                                        rows={2} 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 uppercase">Problem Solved</label>
                                    <textarea 
                                        id="profile-problem" 
                                        value={profileData.problem || ''} 
                                        onChange={handleInputChange} 
                                        className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 bg-white text-gray-900" 
                                        rows={2} 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 uppercase">Motivation (Why)</label>
                                    <textarea 
                                        id="profile-motivation" 
                                        value={profileData.motivation || ''} 
                                        onChange={handleInputChange} 
                                        className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 bg-white text-gray-900" 
                                        rows={2} 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 uppercase">Current Fear/Uncertainty</label>
                                    <textarea 
                                        id="profile-fear" 
                                        value={profileData.fear || ''} 
                                        onChange={handleInputChange} 
                                        className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 bg-white text-gray-900" 
                                        rows={2} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-fuchsia-600 text-white font-medium rounded-md hover:bg-fuchsia-700 shadow-sm">Save Changes</button>
                    </div>
                 </form>
            ) : (
                <div className="space-y-8 bg-white">
                    {/* Subscription Info */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription</h3>
                        <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                {planInfo && !isFreePlan ? (
                                    <>
                                        <div className="flex items-center space-x-2">
                                            <h4 className="font-bold text-gray-900 text-xl">{planInfo.name} Plan</h4>
                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">Active</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{currentProfile.plan?.billing === 'annual' ? 'Billed Annually' : 'Billed Monthly'}</p>
                                    </>
                                ) : (
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <h4 className="font-bold text-gray-900 text-xl">Trial Plan</h4>
                                            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-medium">One-Time Grant</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">Upgrade to unlock monthly credits and premium features.</p>
                                    </div>
                                )}
                            </div>
                            <button 
                                type="button"
                                onClick={(e) => { 
                                    e.stopPropagation();
                                    onClose(); 
                                    if (onManageSubscription) onManageSubscription(); 
                                }}
                                className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 font-medium shadow-sm transition-colors w-full sm:w-auto text-center transform active:scale-95"
                            >
                                Upgrade or Change Plan
                            </button>
                        </div>
                    </div>

                    {/* Account Security */}
                    <div>
                         <h3 className="text-lg font-medium text-gray-900 mb-4">Login & Security</h3>
                         <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                <input type="email" value={currentProfile.email} disabled className="mt-1 w-full p-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed" />
                                <p className="text-xs text-gray-400 mt-1">Contact support to change email.</p>
                            </div>
                            
                            <form onSubmit={handlePasswordUpdate} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h4 className="text-sm font-bold text-gray-800 mb-3">Change Password</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">New Password</label>
                                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-white text-gray-900" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">Confirm Password</label>
                                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-white text-gray-900" />
                                    </div>
                                </div>
                                {passwordMsg && (
                                    <p className={`text-xs mt-2 ${passwordMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{passwordMsg.text}</p>
                                )}
                                <div className="mt-3 flex justify-end">
                                    <button type="submit" disabled={!newPassword} className="px-3 py-1.5 text-xs bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50">Update Password</button>
                                </div>
                            </form>
                         </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-medium text-red-600 mb-2">Danger Zone</h3>
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center">
                            <div className="mb-4 md:mb-0">
                                <h4 className="font-bold text-red-800">Delete Account</h4>
                                <p className="text-sm text-red-600">Permanently remove your account, chat history, and all data.</p>
                            </div>
                            <button 
                                onClick={handleDeleteAccount} 
                                disabled={isDeleting}
                                className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition-colors text-sm font-medium"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Account'}
                            </button>
                        </div>
                    </div>
                    
                    <div className="mt-4 flex justify-center">
                        {onLogout && (
                            <button 
                                type="button" 
                                onClick={() => { if(window.confirm('Are you sure you want to log out?')) onLogout(); }} 
                                className="text-gray-500 hover:text-gray-800 text-sm flex items-center"
                            >
                                <span className="material-icons text-sm mr-1">logout</span>
                                Log Out
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
