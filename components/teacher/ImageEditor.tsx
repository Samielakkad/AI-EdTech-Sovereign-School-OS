import React, { useState, useRef } from 'react';
import Button from '../common/Button.tsx';
import { PencilIcon, DownloadIcon } from '../icons/SettingsIcon.tsx';
import { UploadCloudIcon } from '../icons/StudentIcons.tsx';
import * as geminiService from '../../services/geminiService.ts';

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const ImageEditor: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setEditedImageUrl(null);
            setError(null);
        }
    };

    const handleGenerate = async () => {
        if (!imageFile || !prompt) {
            setError('Please upload an image and provide an editing prompt.');
            return;
        }
        
        setIsLoading(true);
        setEditedImageUrl(null);
        setError(null);
        
        try {
            const imageBytes = await blobToBase64(imageFile);
            const imageUrl = await geminiService.editImage(
                prompt,
                { imageBytes, mimeType: imageFile.type }
            );
            setEditedImageUrl(imageUrl);
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred during image editing.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <PencilIcon /> AI Image Editor
            </h2>
            <div className="space-y-4">
                <div 
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-indigo-500"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="space-y-1 text-center">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Uploaded preview" className="mx-auto h-32 w-auto rounded-md object-contain" />
                        ) : (
                            <>
                                <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-500" />
                                <div className="flex text-sm text-gray-400">
                                    <span className="font-medium text-indigo-400">Upload an image</span>
                                    <p className="pl-1">to edit</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <input ref={fileInputRef} type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg" />

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Edit Prompt</label>
                    <input
                        type="text"
                        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., Add a birthday hat, make it black and white"
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                    />
                </div>
                
                <Button onClick={handleGenerate} disabled={isLoading || !imageFile || !prompt} className="w-full !mt-6">
                    {isLoading ? 'Editing Image...' : 'Edit Image'}
                </Button>

                {isLoading && (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
                    </div>
                )}
                {error && <p className="text-red-400 text-center py-2" role="alert">{error}</p>}
                
                {editedImageUrl && (
                    <div className="mt-4">
                        <h3 className="text-lg font-bold mb-2">Edited Image:</h3>
                        <img src={editedImageUrl} alt={prompt} className="w-full rounded-lg bg-black object-contain max-h-96" />
                        <a href={editedImageUrl} download="edited_image.png">
                            <Button variant="secondary" className="w-full mt-2 flex items-center justify-center">
                                <DownloadIcon className="w-5 h-5 mr-2" /> Download Edited Image
                            </Button>
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageEditor;
