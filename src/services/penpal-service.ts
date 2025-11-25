import { processImage, initializeModel as initModel, getModelInfo } from '../../lib/process';

/**
 * Penpal Service - Exposes background removal functionality to parent applications via iframe
 */

export interface PenpalMethods {
    removeBackground: (imageData: string | Blob) => Promise<string>;
    removeBackgroundAsBlob: (imageData: string | Blob) => Promise<Blob>;
    initializeModel: (modelId?: 'briaai/RMBG-1.4' | 'Xenova/modnet') => Promise<boolean>;
    getModelInfo: () => ReturnType<typeof getModelInfo>;
    [key: string]: (...args: any[]) => any;
}

/**
 * Convert various image formats to File object
 */
async function convertToFile(imageData: string | Blob): Promise<File> {
    if (typeof imageData === 'string') {
        // Handle base64 string
        const base64Data = imageData.includes('base64,')
            ? imageData.split('base64,')[1]
            : imageData;

        const byteString = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);

        for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
        }

        const blob = new Blob([uint8Array], { type: 'image/png' });
        return new File([blob], 'input-image.png', { type: 'image/png' });
    } else {
        // Handle Blob
        return new File([imageData], 'input-image.png', { type: imageData.type || 'image/png' });
    }
}

/**
 * Convert File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Remove background from image and return as base64 string
 * @param imageData - Base64 string or Blob
 * @returns Base64 string of processed image
 */
export async function removeBackground(imageData: string | Blob): Promise<string> {
    try {
        // Auto-initialize model if not ready
        await initModel();

        const inputFile = await convertToFile(imageData);
        const processedFile = await processImage(inputFile);
        const base64Result = await fileToBase64(processedFile);
        return base64Result;
    } catch (error) {
        console.error('Error in removeBackground:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to remove background');
    }
}

/**
 * Remove background from image and return as Blob
 * @param imageData - Base64 string or Blob
 * @returns Blob of processed image
 */
export async function removeBackgroundAsBlob(imageData: string | Blob): Promise<Blob> {
    try {
        // Auto-initialize model if not ready
        await initModel();

        const inputFile = await convertToFile(imageData);
        const processedFile = await processImage(inputFile);
        return processedFile;
    } catch (error) {
        console.error('Error in removeBackgroundAsBlob:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to remove background');
    }
}

/**
 * Initialize the background removal model
 * @param modelId - Optional model ID to use
 * @returns Promise that resolves to true if successful
 */
export async function initializeModel(modelId?: 'briaai/RMBG-1.4' | 'Xenova/modnet'): Promise<boolean> {
    try {
        return await initModel(modelId);
    } catch (error) {
        console.error('Error initializing model:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to initialize model');
    }
}

/**
 * Get current model information
 */
export { getModelInfo };

/**
 * Export all methods as a single object for Penpal
 */
export const penpalMethods: PenpalMethods = {
    removeBackground,
    removeBackgroundAsBlob,
    initializeModel,
    getModelInfo,
};
