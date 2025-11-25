
import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface DocumentAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (file: File, prompt: string) => void;
  isLoading: boolean;
}

const DocumentAnalysisModal: React.FC<DocumentAnalysisModalProps> = ({ isOpen, onClose, onAnalyze, isLoading }) => {
  const [prompt, setPrompt] = useState('Summarize this document and provide the top 5 key takeaways.');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
            setError('File is too large. Please select a file under 10MB.');
            setFile(null);
        } else {
            setFile(selectedFile);
            setError(null);
        }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file && prompt.trim()) {
      onAnalyze(file, prompt);
    } else {
        setError('Please select a file and enter a prompt.');
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 modal-content flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Analyze Document</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Close modal">
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Document</label>
                    <div 
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-center p-4 bg-gray-50"
                    >
                        {file ? (
                            <div>
                                <span className="material-icons text-4xl text-green-500">check_circle</span>
                                <p className="mt-2 font-semibold text-gray-800">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                        ) : (
                            <div>
                                <span className="material-icons text-5xl text-gray-400">upload_file</span>
                                <p className="mt-2 text-gray-600">Drag & drop a file here or</p>
                                <label htmlFor="doc-upload" className="mt-2 cursor-pointer text-sm font-medium text-fuchsia-600 hover:underline">
                                    <span>click to upload</span>
                                    <input id="doc-upload" type="file" className="hidden" accept=".pdf,.txt,.md" onChange={handleFileChange} />
                                </label>
                                <p className="text-xs text-gray-400 mt-1">PDF, TXT, MD up to 10MB</p>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                  <label htmlFor="doc-prompt" className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
                  <textarea
                    id="doc-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md min-h-[100px] bg-white text-gray-900 placeholder-gray-400"
                    rows={4}
                    required
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                  disabled={!file || !prompt.trim() || isLoading}
                >
                  {isLoading ? <LoadingSpinner/> : 'Analyze Document'}
                </button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalysisModal;