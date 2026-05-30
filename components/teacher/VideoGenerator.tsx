import React, { useState, useRef } from 'react';
import Button from '../common/Button.tsx';
import Select from '../common/Select.tsx';
import { VideoIcon } from '../icons/SettingsIcon.tsx';
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

const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setGeneratedVideoUrl(null);
            setError(null);
        }
    };

    const handleGenerate = async () => {
        if (!imageFile) {
            setError('Please upload an image first.');
            return;
        }
        
        setIsLoading(true);
        setGeneratedVideoUrl(null);
        setError(null);
        
        try {
            const imageBytes = await blobToBase64(imageFile);
            const videoUrl = await geminiService.generateVideoFromImage(
                prompt,
                { imageBytes, mimeType: imageFile.type },
                aspectRatio
            );
            setGeneratedVideoUrl(videoUrl);
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred during video generation.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const loadingMessages = [
        "Warming up the digital director's chair...",
        "Compositing pixels into a moving picture...",
        "Teaching the AI about cinematic flair...",
        "This can take a few minutes, time for a quick stretch!",
        "Rendering the final cut, almost there...",
    ];
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

    React.useEffect(() => {
        let interval: number;
        if (isLoading) {
            interval = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    return loadingMessages[(currentIndex + 1) % loadingMessages.length];
                });
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    return (
        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <VideoIcon /> AI Video Generator (from Image)
            </h2>
            <div className="space-y-4">
                <div 
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-indigo-500"
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    aria-label="Upload an image"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                >
                    <div className="space-y-1 text-center">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Uploaded preview" className="mx-auto h-32 w-auto rounded-md object-contain" />
                        ) : (
                            <>
                                <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-500" />
                                <div className="flex text-sm text-gray-400">
                                    <span className="font-medium text-indigo-400">Upload an image</span>
                                    <p className="pl-1">to use as the starting frame</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                            </>
                        )}
                    </div>
                </div>
                <input ref={fileInputRef} id="image-upload" name="image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg" />

                <div>
                    <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-300 mb-1">Video Prompt (Optional)</label>
                    <textarea
                        id="video-prompt"
                        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., The cat starts driving a neon car at top speed"
                        rows={2}
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                    />
                </div>

                <Select label="Aspect Ratio" value={aspectRatio} onChange={e => setAspectRatio(e.target.value as '16:9' | '9:16')}>
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                </Select>
                
                <div className="bg-yellow-900/50 p-3 rounded-lg text-xs text-gray-300 border border-yellow-700">
                    <p className="font-bold text-yellow-300 mb-1">Important:</p>
                    <p>This feature uses Veo, which requires a project with billing enabled. You may be prompted to select an API key. For more info, see <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">Google's billing documentation</a>.</p>
                </div>
                
                <Button onClick={handleGenerate} disabled={isLoading || !imageFile} className="w-full !mt-6">
                    {isLoading ? 'Generating Video...' : 'Generate Video'}
                </Button>

                {isLoading && (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
                        <p className="text-gray-400">{loadingMessage}</p>
                    </div>
                )}
                {error && <p className="text-red-400 text-center py-2" role="alert">{error}</p>}
                
                {generatedVideoUrl && (
                    <div className="mt-4">
                        <h3 className="text-lg font-bold mb-2">Generated Video:</h3>
                        <video controls src={generatedVideoUrl} className="w-full rounded-lg bg-black"></video>
                        <a href={generatedVideoUrl} download="generated_video.mp4">
                            <Button variant="secondary" className="w-full mt-2">Download Video</Button>
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoGenerator;