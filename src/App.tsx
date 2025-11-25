import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Images } from "./components/Images";
import { processImages, initializeModel, getModelInfo } from "../lib/process";
import { WindowMessenger, connect } from "penpal";
import { penpalMethods } from "./services/penpal-service";

interface AppError {
  message: string;
}

export interface ImageFile {
  id: number;
  file: File;
  processedFile?: File;
}

// Sample images from Unsplash
const sampleImages = [
  "https://cdn.midjourney.com/818eb2e0-ae25-4472-890f-6eb92a7aca72/0_1_384_N.webp",
  "https://cdn.midjourney.com/f81363a3-a91d-49a4-ab88-b6feb2c31e8f/0_0.jpeg",
  "https://cdn.midjourney.com/5b6828cf-7707-41fe-bafc-34e4a38f356e/0_0.jpeg",
  "https://cdn.midjourney.com/67b5d4ba-e5a1-4ac8-a4aa-4507cebec187/0_0.jpeg"
];

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [isWebGPU, setIsWebGPU] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [currentModel, setCurrentModel] = useState<'briaai/RMBG-1.4' | 'Xenova/modnet'>('briaai/RMBG-1.4');
  const [isModelSwitching, setIsModelSwitching] = useState(false);
  const [images, setImages] = useState<ImageFile[]>([]);

  useEffect(() => {
    // Removed legacy redirect logic specifically for Mobile Safari.
    // Our lib/process.ts handles iOS optimization internally now.

    // Only check iOS on load since that won't change
    const { isIOS: isIOSDevice } = getModelInfo();
    setIsIOS(isIOSDevice);
    setIsLoading(false);

    // Setup Penpal connection if running in iframe
    if (window.parent !== window) {
      const messenger = new WindowMessenger({
        remoteWindow: window.parent,
        // Allow any origin - you may want to restrict this in production
        allowedOrigins: ['*'],
      });

      const connection = connect({
        messenger,
        methods: penpalMethods,
      });

      console.log('Penpal connection established for iframe communication');

      // Cleanup on unmount
      return () => {
        connection.destroy();
      };
    }
  }, []);

  const handleModelChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = event.target.value as typeof currentModel;
    setIsModelSwitching(true);
    setError(null);
    try {
      const initialized = await initializeModel(newModel);
      if (!initialized) {
        throw new Error("Failed to initialize new model");
      }
      setCurrentModel(newModel);
    } catch (err) {
      if (err instanceof Error && err.message.includes("Falling back")) {
        setCurrentModel('briaai/RMBG-1.4');
      } else {
        setError({
          message: err instanceof Error ? err.message : "Failed to switch models"
        });
      }
    } finally {
      setIsModelSwitching(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      processedFile: undefined
    }));
    setImages(prev => [...prev, ...newImages]);

    // Initialize model if this is the first image
    if (images.length === 0) {
      setIsLoading(true);
      setError(null);
      try {
        const initialized = await initializeModel();
        if (!initialized) {
          throw new Error("Failed to initialize background removal model");
        }
        // Update WebGPU support status after model initialization
        const { isWebGPUSupported } = getModelInfo();
        setIsWebGPU(isWebGPUSupported);
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : "An unknown error occurred"
        });
        setImages([]); // Clear the newly added images if model fails to load
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }

    for (const image of newImages) {
      try {
        const result = await processImages([image.file]);
        if (result && result.length > 0) {
          setImages(prev => prev.map(img =>
            img.id === image.id
              ? { ...img, processedFile: result[0] }
              : img
          ));
        }
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }
  }, [images.length]);


  const handlePaste = async (event: React.ClipboardEvent) => {
    const clipboardItems = event.clipboardData.items;
    const imageFiles: File[] = [];
    for (const item of clipboardItems) {
      if (item.type.startsWith("image")) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }
    if (imageFiles.length > 0) {
      onDrop(imageFiles);
    }
  };

  const handlePasteClick = async () => {
    try {
      // Check for permissions query if needed, but read() usually triggers prompt
      const clipboardItems = await navigator.clipboard.read();
      const imageFiles: File[] = [];
      
      for (const item of clipboardItems) {
        // Look for image types in the clipboard item
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: imageType });
          imageFiles.push(file);
        }
      }
      
      if (imageFiles.length > 0) {
        onDrop(imageFiles);
      } else {
        alert("No image found in clipboard!");
      }
    } catch (err) {
      console.error('Failed to paste from clipboard:', err);
      alert("Could not access clipboard. Please allow permission or use Ctrl+V.");
    }
  };

  const handleSampleImageClick = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], 'sample-image.jpg', { type: 'image/jpeg' });
      onDrop([file]);
    } catch (error) {
      console.error('Error loading sample image:', error);
    }
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".mp4"],
    },
  });

  return (
    <div className="min-h-screen bg-gray-50" onPaste={handlePaste}>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {!isIOS && (
              <div className="flex items-center gap-4">
                <span className="text-gray-600">Model:</span>
                <select
                  value={currentModel}
                  onChange={handleModelChange}
                  className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!isWebGPU}
                >
                  <option value="briaai/RMBG-1.4">RMBG-1.4 (Cross-browser)</option>
                  {isWebGPU && (
                    <option value="Xenova/modnet">MODNet (WebGPU)</option>
                  )}
                </select>
              </div>
            )}
          </div>
          {isIOS && (
            <p className="text-sm text-gray-500 mt-2">
              Using optimized iOS background removal
            </p>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`grid ${images.length === 0 ? 'grid-cols-1 gap-8' : 'grid-cols-1'}`}>
          <div className={images.length === 0 ? '' : 'w-full'}>
            <div
              {...getRootProps()}
              className={`p-8 mb-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors duration-300 ease-in-out bg-white relative
                ${isDragAccept ? "border-green-500 bg-green-50" : ""}
                ${isDragReject ? "border-red-500 bg-red-50" : ""}
                ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"}
                ${isLoading || isModelSwitching ? "cursor-not-allowed" : ""}
              `}
            >
              <input {...getInputProps()} className="hidden" disabled={isLoading || isModelSwitching} />
              <div className="flex flex-col items-center gap-2">
                {isLoading || isModelSwitching ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-2"></div>
                    <p className="text-lg text-gray-600">
                      {isModelSwitching ? 'Switching models...' : 'Loading background removal model...'}
                    </p>
                  </>
                ) : error ? (
                  <>
                    <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-lg text-red-600 font-medium mb-2">{error.message}</p>
                    {currentModel === 'Xenova/modnet' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModelChange({ target: { value: 'briaai/RMBG-1.4' } } as any);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Switch to Cross-browser Version
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-lg text-gray-600">
                      {isDragActive
                        ? "Drop the images here..."
                        : "Drag and drop images here"}
                    </p>
                    <p className="text-sm text-gray-500">or click to select files</p>
                    
                    <div className="flex items-center gap-3 mt-4 w-full justify-center">
                      <div className="h-px bg-gray-200 w-16"></div>
                      <span className="text-gray-400 text-sm">OR</span>
                      <div className="h-px bg-gray-200 w-16"></div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePasteClick();
                      }}
                      className="mt-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all duration-200 font-medium flex items-center gap-2 group border border-indigo-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Paste from Clipboard
                    </button>
                    <span className="text-xs text-gray-400 mt-1">(or press Ctrl + V)</span>
                  </>
                )}
              </div>
            </div>

            {images.length === 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl text-gray-700 font-semibold mb-4">No image? Try one of these:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sampleImages.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleImageClick(url)}
                      className="relative aspect-square overflow-hidden rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <img
                        src={url}
                        alt={`Sample ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Images images={images} onDelete={(id) => setImages(prev => prev.filter(img => img.id !== id))} />
          </div>
        </div>
      </main>
    </div>
  );
}
