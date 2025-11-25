
import React, { useState, useEffect } from 'react';
import { ChatSession, Task } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatSession?: ChatSession;
  tasks: Task[];
  initialContent?: string | null; // If provided, we are in "Asset Mode"
}

type ExportFormat = 'doc' | 'sheet' | 'pdf' | 'md';

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, chatSession, tasks, initialContent }) => {
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Asset Mode State
  const [filename, setFilename] = useState('');
  const [format, setFormat] = useState<ExportFormat>('doc');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Social Share State
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setFilename(initialContent ? 'New AI Asset' : `Chat Export ${new Date().toLocaleDateString()}`);
        setSaveSuccess(false);
        setIsSaving(false);
        setLinkCopied(false);
        // Auto-detect format based on content (naive check for CSV-like structure)
        if (initialContent && (initialContent.includes(',') || initialContent.includes('|')) && initialContent.includes('\n')) {
             setFormat('sheet');
        } else {
             setFormat('doc');
        }
    }
  }, [isOpen, initialContent]);

  if (!isOpen) return null;

  const handleConnectDrive = () => {
    setIsConnecting(true);
    // Simulate auth delay
    setTimeout(() => {
      setIsDriveConnected(true);
      setIsConnecting(false);
    }, 1500);
  };

  const handleExportChat = () => {
    if (!chatSession) return;
    
    let content = `# ${chatSession.title || 'Social Butterfly-AI Chat'}\n\n`;
    content += `Exported on ${new Date().toLocaleDateString()}\n\n---\n\n`;
    
    chatSession.messages.forEach(msg => {
      const role = msg.role === 'user' ? 'You' : 'Social Butterfly-AI';
      const text = msg.parts.map(p => p.text).join('\n');
      content += `### ${role}\n${text}\n\n`;
    });

    downloadFile(content, `chat-export-${Date.now()}.md`, 'text/markdown');
  };

  const handleExportTasks = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Status,Task Description\n";
    
    tasks.forEach(task => {
        const status = task.completed ? "Completed" : "Pending";
        const text = task.text.replace(/"/g, '""');
        csvContent += `"${status}","${text}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tasks-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simulate saving specific content as a file
  const handleSaveAsset = () => {
      if (!initialContent) return;
      setIsSaving(true);

      // Simulate API delay
      setTimeout(() => {
          let content = initialContent;
          let mimeType = 'text/plain';
          let extension = 'txt';

          switch(format) {
              case 'doc':
                  // Simple HTML wrapper to mimic a doc when opened
                  content = `<html><body><pre style="font-family: sans-serif; white-space: pre-wrap;">${initialContent}</pre></body></html>`;
                  mimeType = 'application/msword';
                  extension = 'doc';
                  break;
              case 'sheet':
                  mimeType = 'text/csv';
                  extension = 'csv';
                  break;
              case 'pdf':
                  // Browser print/save as PDF simulation (actual PDF gen requires heavy lib)
                  mimeType = 'text/plain'; 
                  extension = 'txt'; // Fallback for MVP
                  break;
              case 'md':
                  mimeType = 'text/markdown';
                  extension = 'md';
                  break;
          }

          downloadFile(content, `${filename}.${extension}`, mimeType);
          setIsSaving(false);
          setSaveSuccess(true);
          
          // Close after brief success msg
          setTimeout(() => {
              onClose();
          }, 1500);
      }, 1500);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleSocialShare = (platform: 'twitter' | 'facebook' | 'linkedin' | 'copy') => {
    const url = window.location.origin; // Uses current origin (e.g., socialbutterfly.ai)
    const text = "Check out Social Butterfly-AI: Your best friend in business.";
    
    switch(platform) {
        case 'twitter':
            window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
            break;
        case 'facebook':
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
            break;
        case 'linkedin':
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
            break;
        case 'copy':
            navigator.clipboard.writeText(url);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
            break;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 modal-content max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
              {initialContent ? 'Save Asset to Drive' : 'Integrations & Export'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Close export modal">
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Google Drive Connect Status */}
        <div className="border border-gray-200 rounded-xl p-4 mb-6 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                        <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg"><path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/><path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/><path d="m43.65 25 13.75 23.8 13.75-23.8h-27.5z" fill="#00832d"/><path d="m59.05 52.9-15.4-26.65-13.75 23.8 13.75 23.8z" fill="#2684fc"/><path d="m72.95 13.25-13.75 23.8 13.75 23.8h27.5c0-1.55-.4-3.1-1.2-4.5l-7.65-13.25-2.25-3.9-3.25-5.6-9.1-15.75c-.8-1.4-1.95-2.5-3.3-3.3z" fill="#ffba00"/></svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Google Drive</h3>
                        <p className="text-xs text-gray-500">{isDriveConnected ? 'Connected' : 'Connect to export files'}</p>
                    </div>
                </div>
                {!isDriveConnected ? (
                    <button 
                        onClick={handleConnectDrive}
                        disabled={isConnecting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                ) : (
                    <div className="flex items-center text-green-600 text-sm font-medium">
                        <span className="material-icons text-base mr-1">check_circle</span>
                        Active
                    </div>
                )}
            </div>
        </div>
            
        {initialContent ? (
            // ASSET MODE UI
            isDriveConnected ? (
                <div className="space-y-4 animate-fadeIn">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
                        <input 
                            type="text" 
                            value={filename} 
                            onChange={(e) => setFilename(e.target.value)} 
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setFormat('doc')}
                                className={`p-2 rounded-lg border text-sm font-medium flex items-center justify-center space-x-2 ${format === 'doc' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                                <span className="material-icons text-blue-500 text-base">description</span>
                                <span>Google Doc</span>
                            </button>
                            <button 
                                onClick={() => setFormat('sheet')}
                                className={`p-2 rounded-lg border text-sm font-medium flex items-center justify-center space-x-2 ${format === 'sheet' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                                <span className="material-icons text-green-500 text-base">table_chart</span>
                                <span>Google Sheet</span>
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveAsset}
                        disabled={isSaving || saveSuccess}
                        className={`w-full py-3 rounded-lg text-white font-medium transition-all mt-4 flex items-center justify-center ${saveSuccess ? 'bg-green-600' : 'bg-fuchsia-600 hover:bg-fuchsia-700'}`}
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Syncing...
                            </>
                        ) : saveSuccess ? (
                            <>
                                <span className="material-icons mr-2">check</span>
                                Saved to Drive
                            </>
                        ) : (
                            'Save to Drive'
                        )}
                    </button>
                </div>
            ) : (
                <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100 text-sm text-yellow-800 text-center">
                    Please connect your Google Drive account above to save this asset.
                </div>
            )
        ) : (
            // GLOBAL MODE UI (Export & Share)
            <>
                {isDriveConnected ? (
                    <div className="space-y-2 pl-13 mb-6">
                        <div className="p-3 bg-white rounded-lg border border-gray-200 flex justify-between items-center">
                             <div className="flex items-center space-x-2">
                                <span className="material-icons text-blue-500">description</span>
                                <span className="text-sm text-gray-700">Export Full Chat History</span>
                             </div>
                             <button onClick={handleExportChat} className="text-fuchsia-600 hover:text-fuchsia-800 text-sm font-medium">Export</button>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-gray-200 flex justify-between items-center">
                             <div className="flex items-center space-x-2">
                                <span className="material-icons text-green-500">table_chart</span>
                                <span className="text-sm text-gray-700">Export Task List</span>
                             </div>
                             <button onClick={handleExportTasks} className="text-fuchsia-600 hover:text-fuchsia-800 text-sm font-medium">Export</button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-2 mb-6 p-3 bg-yellow-50 rounded-lg border border-yellow-100 text-xs text-yellow-800 text-center">
                        Connect your account to enable exports to Google Docs and Sheets.
                    </div>
                )}

                {/* SOCIAL SHARE SECTION */}
                <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Share with Friends</h3>
                    
                    {/* Social Card Preview */}
                    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-4 group cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSocialShare('copy')}>
                        <div className="h-32 overflow-hidden bg-gray-100 relative">
                            <img src="https://i.ibb.co/gLbPY0ZN/SB-for-app.png" alt="Social Butterfly AI" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                        <div className="p-3 bg-gray-50">
                            <p className="font-bold text-gray-800 text-sm truncate">Social Butterfly-AI 3.0</p>
                            <p className="text-xs text-gray-500 truncate">Your best friend in business. Validate, design, and scale.</p>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                        <button onClick={() => handleSocialShare('twitter')} className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-black">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                             <span className="text-[10px] mt-1 font-medium">Post</span>
                        </button>
                         <button onClick={() => handleSocialShare('facebook')} className="flex flex-col items-center justify-center p-2 hover:bg-blue-50 rounded-lg transition-colors text-gray-600 hover:text-blue-700">
                             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                             <span className="text-[10px] mt-1 font-medium">Share</span>
                        </button>
                        <button onClick={() => handleSocialShare('linkedin')} className="flex flex-col items-center justify-center p-2 hover:bg-blue-50 rounded-lg transition-colors text-gray-600 hover:text-blue-600">
                             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
                             <span className="text-[10px] mt-1 font-medium">Post</span>
                        </button>
                        <button onClick={() => handleSocialShare('copy')} className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${linkCopied ? 'bg-green-50 text-green-600' : 'hover:bg-gray-100 text-gray-600 hover:text-fuchsia-600'}`}>
                             <span className="material-icons text-xl">{linkCopied ? 'check' : 'link'}</span>
                             <span className="text-[10px] mt-1 font-medium">{linkCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                    </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default ExportModal;
