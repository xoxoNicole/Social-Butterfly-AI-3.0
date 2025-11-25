
import React, { useState, useEffect } from 'react';
import { subscribeToSupportTickets, updateTicketStatus, SupportTicket, subscribeToAllUsers, updateUserProfile, UserProfile, provisionUserProfile } from '../services/firebase';
import { getPlanDetails, individualPlans, teamPlans, PlanID, freePlan } from '../plans';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile?: UserProfile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose, currentUserProfile }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'emailer' | 'inbox' | 'users'>('overview');
  
  // Email State
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  
  // Support Inbox State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  
  // User Manager State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userPermissionError, setUserPermissionError] = useState<boolean>(false);
  
  // Editing States
  const [editCreditId, setEditCreditId] = useState<string | null>(null);
  const [tempCredits, setTempCredits] = useState<number>(0);
  
  const [editPlanId, setEditPlanId] = useState<string | null>(null);
  const [tempPlanId, setTempPlanId] = useState<PlanID>('plus');

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Provisioning (Add User) State
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [newUserUid, setNewUserUid] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserCredits, setNewUserCredits] = useState(300);
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  const [provisionMsg, setProvisionMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
      if (isOpen) {
          const unsubscribe = subscribeToSupportTickets((data) => {
              setTickets(data);
          });
          return () => unsubscribe();
      }
  }, [isOpen]);

  // Real-time User Subscription
  useEffect(() => {
      if (activeTab === 'users') {
          setLoadingUsers(true);
          setUserPermissionError(false);
          
          const unsubscribe = subscribeToAllUsers((data) => {
              // Client-side sort by email for better readability
              const sortedData = [...data].sort((a, b) => (a.email || '').localeCompare(b.email || ''));
              setUsers(sortedData);
              setLoadingUsers(false);
              setUserPermissionError(false);
          }, (error) => {
              setLoadingUsers(false);
              console.error("Admin User List Error:", error);
              // Determine if it's a permission error
              const msg = error.message || error.toString();
              if (msg.includes("permission-denied") || msg.includes("Missing or insufficient permissions")) {
                  setUserPermissionError(true);
              }
          });
          return () => unsubscribe();
      }
  }, [activeTab, refreshTrigger]); 

  if (!isOpen) return null;

  const handleOpenMailClient = (e: React.FormEvent) => {
      e.preventDefault();
      const body = emailBody.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''); 
      const mailtoLink = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink, '_blank');
  };

  const handleOpenGmail = () => {
      const body = emailBody.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''); 
      const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailTo)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(body)}`;
      window.open(gmailLink, '_blank');
  };

  const handleReplyToTicket = (ticket: SupportTicket) => {
      setEmailTo(ticket.userEmail);
      setEmailSubject(`Re: ${ticket.subject}`);
      setEmailBody(`Hi there,\n\nRegarding your message:\n"${ticket.message}"\n\n`);
      setActiveTab('emailer');
  };

  const handleResolveTicket = async (id: string) => {
      await updateTicketStatus(id, 'resolved');
      if (selectedTicket?.id === id) {
          setSelectedTicket(prev => prev ? { ...prev, status: 'resolved' } : null);
      }
  };

  // --- Credit Editing ---
  const startEditingCredits = (user: UserProfile) => {
      setEditCreditId(user.uid);
      setTempCredits(user.credits);
      setEditPlanId(null); // Close other edits
  };

  const saveCredits = async (uid: string) => {
      await updateUserProfile(uid, { credits: tempCredits });
      setEditCreditId(null);
      setRefreshTrigger(prev => prev + 1);
  };

  // --- Plan Editing ---
  const startEditingPlan = (user: UserProfile) => {
      setEditPlanId(user.uid);
      setTempPlanId(user.plan?.id || 'plus');
      setEditCreditId(null); // Close other edits
  };

  const savePlan = async (uid: string) => {
      const planDetails = getPlanDetails(tempPlanId);
      if (planDetails) {
          if (window.confirm(`Switching to ${planDetails.name} will reset credits to ${planDetails.credits}. Proceed?`)) {
              await updateUserProfile(uid, { 
                  plan: { id: tempPlanId, billing: 'monthly' }, // Defaulting to monthly for admin overrides
                  credits: planDetails.credits 
              });
              setEditPlanId(null);
              setRefreshTrigger(prev => prev + 1);
          }
      }
  };

  const handleProvisionUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setProvisionMsg(null);

      if(!newUserUid || !newUserEmail) {
          setProvisionMsg({ type: 'error', text: "UID and Email are required." });
          return;
      }
      
      const uid = newUserUid.trim();
      const email = newUserEmail.trim();

      try {
          await provisionUserProfile(uid, {
              email: email,
              name: newUserName || email.split('@')[0],
              credits: newUserCredits,
              role: newUserRole,
              business: '',
              photo: '',
              plan: { id: 'free', billing: 'monthly' }
          });
          setProvisionMsg({ type: 'success', text: "Success! User profile updated." });
          setRefreshTrigger(prev => prev + 1);
          
          setTimeout(() => {
             setIsProvisioning(false);
             setProvisionMsg(null);
             setNewUserUid('');
             setNewUserEmail('');
             setNewUserCredits(300);
             setNewUserRole('user');
             setNewUserName('');
          }, 1500);
      } catch (e: any) {
          console.error(e);
          let errorMsg = e.message || "Error creating user profile.";
          if (errorMsg.toLowerCase().includes("permission")) {
              errorMsg += " (Check Firestore Rules or your Admin role)";
          }
          setProvisionMsg({ type: 'error', text: errorMsg });
      }
  };

  const isActuallyAdmin = currentUserProfile?.role === 'admin';

  // Security Rules Snippet
  const RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check for admin role
    function isAdmin() {
      return request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow admins to read/write all user documents
    match /users/{userId} {
      allow read, write: if request.auth != null && (request.auth.uid == userId || isAdmin());
    }
    
    // Tickets: Users can create, Admins can read/update
    match /tickets/{ticketId} {
      allow create: if request.auth != null;
      allow read, update: if isAdmin();
    }
    
    // Assets: Users can read/write their own
    match /users/{userId}/assets/{assetId} {
      allow read, write: if request.auth != null && (request.auth.uid == userId || isAdmin());
    }
    
    // Chats: Users can read/write their own
    match /users/{userId}/chats/{chatId} {
      allow read, write: if request.auth != null && (request.auth.uid == userId || isAdmin());
    }

    // User Data Subcollections (Tasks, etc)
    match /users/{userId}/data/{docId} {
      allow read, write: if request.auth != null && (request.auth.uid == userId || isAdmin());
    }
    
    // Default to secure
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

  const allPlansList = [freePlan, ...individualPlans, ...teamPlans];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50 p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl p-0 modal-content flex flex-col overflow-hidden max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* Diagnostics Header */}
        <div className={`text-xs px-6 py-1 flex justify-between items-center ${isActuallyAdmin ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
             <div className="flex items-center space-x-4">
                 <span className="font-mono">Diagnostics:</span>
                 <span>UID: {currentUserProfile?.uid || 'Unknown'}</span>
                 <span>Current Role: <strong className="uppercase">{currentUserProfile?.role || 'None'}</strong></span>
             </div>
             {!isActuallyAdmin && (
                 <span className="font-bold animate-pulse">WARNING: You are not detected as Admin. Reads/Writes will fail.</span>
             )}
        </div>

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="material-icons text-fuchsia-600 mr-2">admin_panel_settings</span>
                Admin Console
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Close dashboard">
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Sidebar + Content Layout */}
        <div className="flex flex-1 overflow-hidden">
            
            {/* Sidebar */}
            <div className="w-64 bg-gray-100 border-r border-gray-200 p-4 space-y-2 flex-shrink-0">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-white text-fuchsia-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                    <span className="material-icons">dashboard</span>
                    <span>Overview</span>
                </button>
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-white text-fuchsia-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                    <span className="material-icons">people</span>
                    <span>User Manager</span>
                </button>
                <button 
                    onClick={() => setActiveTab('inbox')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'inbox' ? 'bg-white text-fuchsia-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                    <span className="material-icons">inbox</span>
                    <span>Support Inbox</span>
                    {tickets.filter(t => t.status === 'open').length > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {tickets.filter(t => t.status === 'open').length}
                        </span>
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('emailer')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'emailer' ? 'bg-white text-fuchsia-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                    <span className="material-icons">send</span>
                    <span>System Emailer</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-white relative">
                
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="text-center py-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-left">
                            <div className="flex items-start space-x-4">
                                <span className="material-icons text-4xl text-green-500">cloud_done</span>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">Live Firebase Mode</h3>
                                    <p className="text-gray-600 text-sm">
                                        You are connected to Google Cloud Firestore. Data is securely synced across all devices in real-time.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
                                <h4 className="font-bold text-gray-800 flex items-center mb-2">
                                    <span className="material-icons text-sm mr-2 text-gray-500">people</span>
                                    User Management
                                </h4>
                                <p className="text-sm text-gray-500">View Plans, Edit Credits, and track user activity.</p>
                            </div>
                            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
                                <h4 className="font-bold text-gray-800 flex items-center mb-2">
                                    <span className="material-icons text-sm mr-2 text-gray-500">storage</span>
                                    Data Management
                                </h4>
                                <p className="text-sm text-gray-500">Chat history, tasks, and credits are stored in Firestore collections.</p>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">User Management</h3>
                            <div className="flex items-center space-x-3">
                                <button 
                                    onClick={() => setIsProvisioning(true)}
                                    className="px-3 py-1 bg-fuchsia-600 text-white rounded-full text-sm font-medium hover:bg-fuchsia-700 flex items-center shadow-sm"
                                >
                                    <span className="material-icons text-sm mr-1">add</span>
                                    Provision User
                                </button>
                                <button 
                                    onClick={() => setRefreshTrigger(t => t + 1)}
                                    className="p-2 text-gray-500 hover:text-fuchsia-600 transition-colors rounded-full hover:bg-gray-100"
                                    title="Force Refresh"
                                >
                                    <span className="material-icons">refresh</span>
                                </button>
                                <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <span className="text-xs font-medium text-green-700">Live Sync</span>
                                </div>
                            </div>
                        </div>
                        {loadingUsers && users.length === 0 ? (
                            <div className="text-center p-8 text-gray-500">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-fuchsia-500 border-t-transparent mb-2"></div>
                                <p>Loading users...</p>
                            </div>
                        ) : userPermissionError ? (
                            <div className="p-8 text-center bg-white">
                                <div className="inline-flex items-center justify-center p-4 bg-indigo-100 rounded-full mb-6">
                                    <span className="material-icons text-4xl text-indigo-600">security_update_warning</span>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">One Final Step!</h2>
                                <p className="text-gray-600 max-w-2xl mx-auto mb-8">
                                    You have successfully enabled Admin access, but we need to update the <strong>Database Security Rules</strong> to let you view the user list.
                                </p>
                                
                                <div className="bg-white text-left border border-gray-200 rounded-xl shadow-sm max-w-3xl mx-auto overflow-hidden">
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                        <h3 className="font-semibold text-gray-700">Security Rules Update</h3>
                                        <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded">Required</span>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900 mb-2">Instructions:</h4>
                                            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1 ml-2">
                                                <li>Open your <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-medium">Firebase Console</a>.</li>
                                                <li>Go to <strong>Firestore Database</strong> &rarr; <strong>Rules</strong> tab.</li>
                                                <li>Replace the existing code with the code below.</li>
                                                <li>Click <strong>Publish</strong>.</li>
                                            </ol>
                                        </div>
                                        
                                        <div className="relative">
                                            <div className="absolute top-2 right-2">
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(RULES_SNIPPET);
                                                        alert('Copied to clipboard!');
                                                    }}
                                                    className="bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold py-1.5 px-3 rounded shadow-sm border border-gray-200 flex items-center transition-colors"
                                                >
                                                    <span className="material-icons text-sm mr-1">content_copy</span>
                                                    Copy
                                                </button>
                                            </div>
                                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto pt-10 leading-relaxed">
                                                {RULES_SNIPPET}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => window.location.reload()}
                                    className="mt-8 px-8 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-full shadow-lg transition-transform hover:scale-105"
                                >
                                    I've Updated the Rules, Reload Page
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white border rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.map(user => {
                                            const planDetails = user.plan?.id ? getPlanDetails(user.plan.id) : null;
                                            return (
                                            <tr key={user.uid}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {user.photo ? <img className="h-8 w-8 rounded-full mr-2" src={user.photo} alt="" /> : <div className="h-8 w-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center"><span className="material-icons text-gray-400 text-sm">person</span></div>}
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{user.name || 'No Name'}</div>
                                                            <div className="text-xs text-gray-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                
                                                {/* PLAN COLUMN */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {editPlanId === user.uid ? (
                                                        <div className="flex items-center space-x-2">
                                                            <select 
                                                                value={tempPlanId}
                                                                onChange={(e) => setTempPlanId(e.target.value as PlanID)}
                                                                className="text-sm border rounded p-1"
                                                            >
                                                                {allPlansList.map(p => (
                                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                                ))}
                                                            </select>
                                                            <button onClick={() => savePlan(user.uid)} className="text-green-600 hover:text-green-800"><span className="material-icons text-sm">check</span></button>
                                                            <button onClick={() => setEditPlanId(null)} className="text-gray-400 hover:text-gray-600"><span className="material-icons text-sm">close</span></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center space-x-2 group cursor-pointer" onClick={() => startEditingPlan(user)}>
                                                            <div className="flex flex-col">
                                                                <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase w-fit ${
                                                                    user.plan?.id === 'business' ? 'bg-amber-100 text-amber-700' :
                                                                    user.plan?.id === 'ultra' ? 'bg-pink-100 text-pink-700' :
                                                                    user.plan?.id === 'pro' ? 'bg-purple-100 text-purple-700' :
                                                                    user.plan?.id === 'plus' ? 'bg-blue-100 text-blue-700' :
                                                                    user.plan?.id === 'free' ? 'bg-gray-200 text-gray-800' :
                                                                    'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                    {planDetails ? planDetails.name : (user.plan?.id || 'Free')}
                                                                </span>
                                                                {user.plan?.billing && user.plan.id !== 'free' && (
                                                                    <span className="text-[10px] text-gray-400 mt-0.5 ml-1">
                                                                        {user.plan.billing === 'annual' ? 'Billed Annually' : 'Monthly'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="material-icons text-xs text-gray-300 group-hover:text-fuchsia-400 opacity-0 group-hover:opacity-100 transition-all">edit</span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* CREDITS COLUMN */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {editCreditId === user.uid ? (
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="number" 
                                                                value={tempCredits} 
                                                                onChange={(e) => setTempCredits(parseInt(e.target.value) || 0)}
                                                                className="w-20 p-1 border rounded bg-white text-gray-900"
                                                            />
                                                            <button onClick={() => saveCredits(user.uid)} className="text-green-600 hover:text-green-800"><span className="material-icons text-sm">check</span></button>
                                                            <button onClick={() => setEditCreditId(null)} className="text-gray-400 hover:text-gray-600"><span className="material-icons text-sm">close</span></button>
                                                        </div>
                                                    ) : (
                                                        <span className="cursor-pointer group flex items-center space-x-1" onClick={() => startEditingCredits(user)}>
                                                            <span>{user.credits?.toLocaleString()}</span>
                                                            <span className="material-icons text-xs text-gray-300 group-hover:text-fuchsia-400 opacity-0 group-hover:opacity-100 transition-all">edit</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* ROLE / ACTIONS */}
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <span className={`text-xs px-2 py-1 rounded border ${user.role === 'admin' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                                {users.length === 0 && (
                                    <div className="p-8 text-center text-gray-500">
                                        <span className="material-icons text-gray-300 text-4xl mb-2">people_outline</span>
                                        <p className="font-medium">No users found.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* INBOX TAB */}
                {activeTab === 'inbox' && (
                    <div className="flex h-full -m-8">
                        {/* Ticket List */}
                        <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-gray-50">
                             {tickets.length === 0 ? (
                                 <div className="p-6 text-center text-gray-500 text-sm">No tickets yet.</div>
                             ) : (
                                 <ul>
                                     {tickets.map(ticket => (
                                         <li 
                                            key={ticket.id} 
                                            onClick={() => setSelectedTicket(ticket)}
                                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors ${selectedTicket?.id === ticket.id ? 'bg-white border-l-4 border-l-fuchsia-600' : ''}`}
                                         >
                                             <div className="flex justify-between items-start mb-1">
                                                 <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ticket.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                                     {ticket.status.toUpperCase()}
                                                 </span>
                                                 <span className="text-xs text-gray-400">
                                                     {new Date(ticket.createdAt).toLocaleDateString()}
                                                 </span>
                                             </div>
                                             <h4 className="font-bold text-gray-800 text-sm truncate">{ticket.subject}</h4>
                                             <p className="text-xs text-gray-500 truncate">{ticket.userEmail}</p>
                                         </li>
                                     ))}
                                 </ul>
                             )}
                        </div>
                        
                        {/* Ticket Detail */}
                        <div className="w-2/3 p-8 overflow-y-auto bg-white">
                            {selectedTicket ? (
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">{selectedTicket.subject}</h3>
                                            <p className="text-sm text-gray-500 mt-1">From: <span className="text-gray-800 font-medium">{selectedTicket.userEmail}</span></p>
                                        </div>
                                        <div className="space-x-2">
                                            {selectedTicket.status === 'open' && (
                                                <button 
                                                    onClick={() => handleResolveTicket(selectedTicket.id)}
                                                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                                                >
                                                    Mark Resolved
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleReplyToTicket(selectedTicket)}
                                                className="px-4 py-2 text-sm font-medium text-white bg-fuchsia-600 rounded hover:bg-fuchsia-700 flex items-center"
                                            >
                                                <span className="material-icons text-sm mr-2">reply</span>
                                                Reply
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                                        {selectedTicket.message}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <span className="material-icons text-6xl mb-4 text-gray-200">inbox</span>
                                    <p>Select a ticket to view details</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* EMAILER TAB */}
                {activeTab === 'emailer' && (
                    <div className="max-w-2xl mx-auto">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">System Emailer</h3>
                        <p className="text-sm text-gray-500 mb-6">
                             Compose emails to users. Choose your preferred mail client below.
                        </p>

                        <form onSubmit={handleOpenMailClient} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                                <input 
                                    type="text" 
                                    value={emailTo}
                                    onChange={(e) => setEmailTo(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-fuchsia-500 outline-none bg-white text-gray-900 placeholder-gray-400"
                                    required 
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input 
                                    type="text" 
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-fuchsia-500 outline-none bg-white text-gray-900 placeholder-gray-400"
                                    required 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea 
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-fuchsia-500 outline-none font-mono text-sm bg-white text-gray-900 placeholder-gray-400"
                                    rows={8}
                                    placeholder="Type your message here..."
                                    required 
                                />
                            </div>

                            <div className="flex justify-end pt-2 space-x-3">
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center shadow-sm"
                                >
                                    Default App
                                    <span className="material-icons ml-2 text-sm">open_in_new</span>
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleOpenGmail}
                                    className="px-6 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors flex items-center shadow-md hover:shadow-lg"
                                >
                                    Draft in Gmail
                                    <span className="material-icons ml-2 text-sm">mail</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </div>
        </div>

        {/* Provision User Modal Overlay */}
        {isProvisioning && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={() => setIsProvisioning(false)}>
                <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Provision User</h3>
                    <p className="text-xs text-gray-500 mb-4">
                        Manually create or update a user profile in Firestore.<br/>
                        <strong>Tip:</strong> You can find the <strong>UID</strong> in the <a href="https://console.firebase.google.com/u/0/project/_/authentication/users" target="_blank" className="text-fuchsia-600 hover:underline">Firebase Console &rarr; Authentication</a> tab.
                    </p>
                    <form onSubmit={handleProvisionUser} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Firebase UID <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={newUserUid}
                                onChange={(e) => setNewUserUid(e.target.value)}
                                placeholder="e.g. 28E6oH2SV..."
                                className="w-full p-2 border border-gray-300 rounded text-sm font-mono focus:ring-2 focus:ring-fuchsia-500 outline-none bg-white text-gray-900 placeholder-gray-400"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email <span className="text-red-500">*</span></label>
                            <input 
                                type="email" 
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                placeholder="user@example.com"
                                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none bg-white text-gray-900 placeholder-gray-400"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Name (Optional)</label>
                            <input 
                                type="text" 
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none bg-white text-gray-900 placeholder-gray-400"
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Initial Credits</label>
                            <input 
                                type="number" 
                                value={newUserCredits}
                                onChange={(e) => setNewUserCredits(parseInt(e.target.value) || 0)}
                                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none bg-white text-gray-900 placeholder-gray-400"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Role</label>
                            <select
                                value={newUserRole}
                                onChange={(e) => setNewUserRole(e.target.value as 'user' | 'admin')}
                                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none bg-white text-gray-900"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        
                        {provisionMsg && (
                            <div className={`p-2 rounded text-xs font-medium ${provisionMsg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {provisionMsg.text}
                            </div>
                        )}

                        <div className="flex justify-end space-x-2 pt-2">
                            <button type="button" onClick={() => setIsProvisioning(false)} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm bg-fuchsia-600 text-white rounded hover:bg-fuchsia-700 shadow-sm">Save Profile</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
