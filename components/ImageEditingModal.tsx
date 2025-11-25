
import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ImageEditingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, image: { base64: string, mimeType: string }) => void;
  isLoading: boolean;
  generatedImage: string | null;
}

const blobToBase64 = (blob: Blob): Promise<{ base64: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({ base64: base64String, mimeType: blob.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const ImageEditingModal: React.FC<ImageEditingModalProps> = ({ isOpen, onClose, onGenerate, isLoading, generatedImage }) => {
  const [prompt, setPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<{ file: File, url: string, data: { base64: string, mimeType: string } } | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const data = await blobToBase64(file);
      setSourceImage({ file, url, data });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && sourceImage) {
      onGenerate(prompt, sourceImage.data);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 modal-content flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
             <h2 className="text-2xl font-bold text-gray-900">Edit Image with AI</h2>
             <button onClick={onClose} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-full flex items-center transition-colors">
                 <span className="material-icons text-sm mr-1">arrow_back</span>
                 Dashboard
             </button>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Close modal">
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Left side: Upload and Prompt */}
                <div>
                    {!sourceImage ? (
                        <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
                            <span className="material-icons text-5xl text-gray-400">upload_file</span>
                            <p className="mt-2 text-gray-600">Upload an image to start</p>
                            <label htmlFor="image-upload" className="mt-4 cursor-pointer px-4 py-2 text-sm font-medium text-fuchsia-600 border border-fuchsia-600 rounded-md hover:bg-fuchsia-50 transition-colors">
                                <span>Choose File</span>
                                <input id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleImageUpload} />
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Original Image:</h3>
                                <img src={sourceImage.url} alt="Source" className="rounded-lg shadow-md w-full" />
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="edit-prompt" className="block text-sm font-medium text-gray-700 mb-1">Editing Prompt</label>
                                    <textarea
                                        id="edit-prompt"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="e.g., Add a retro filter"
                                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-fuchsia-500 outline-none"
                                        rows={3}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full px-6 py-2 text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                                    disabled={!prompt.trim() || !sourceImage || isLoading}
                                >
                                    {isLoading ? <LoadingSpinner/> : 'Generate Edit'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Right side: Result */}
                <div className="w-full h-full min-h-[300px] bg-gray-50 rounded-lg flex items-center justify-center p-4">
                    {isLoading ? (
                        <div className="text-center">
                            <LoadingSpinner />
                            <p className="mt-4 text-gray-600">AI is editing your image...</p>
                        </div>
                    ) : generatedImage ? (
                        <div className="text-center space-y-4">
                            <h3 className="text-sm font-medium text-gray-700">Edited Image:</h3>
                            <img src={generatedImage} alt="Generated" className="rounded-lg shadow-md mx-auto" />
                            <a href={generatedImage} download="edited-image.png" className="inline-flex items-center px-4 py-2 text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700">
                                <span className="material-icons mr-2">download</span>
                                Download
                            </a>
                        </div>
                    ) : (
                        <p className="text-gray-500">Your edited image will appear here.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditingModal;
