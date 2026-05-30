import React, { useState } from 'react';
import Button from '../common/Button.tsx';
import Select from '../common/Select.tsx';
import { SparklesIcon, DownloadIcon } from '../icons/SettingsIcon.tsx';
import * as geminiService from '../../services/geminiService.ts';

const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt) {
            setError('Please enter a prompt.');
            return;
        }
        
        setIsLoading(true);
        setGeneratedImageUrl(null);
        setError(null);
        
        try {
            // FIX: Property 'generateImageWithRatio' does not exist on type 'typeof import("services/geminiService")'. Changed to 'generateImage'.
            const imageUrl = await geminiService.generateImage(prompt, aspectRatio);
            setGeneratedImageUrl(imageUrl);
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred during image generation.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <SparklesIcon /> AI Image Generator
            </h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="image-prompt" className="block text-sm font-medium text-gray-300 mb-1">Image Prompt</label>
                    <textarea
                        id="image-prompt"
                        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., A friendly robot teaching a class of curious aliens"
                        rows={2}
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                    />
                </div>

                <Select label="Aspect Ratio" value={aspectRatio} onChange={e => setAspectRatio(e.target.value as any)}>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="16:9">16:9 (Widescreen)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                    <option value="4:3">4:3 (Standard)</option>
                    <option value="3:4">3:4 (Vertical)</option>
                </Select>
                
                <Button onClick={handleGenerate} disabled={isLoading || !prompt} className="w-full !mt-6">
                    {isLoading ? 'Generating Image...' : 'Generate Image'}
                </Button>

                {isLoading && (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
                    </div>
                )}
                {error && <p className="text-red-400 text-center py-2" role="alert">{error}</p>}
                
                {generatedImageUrl && (
                    <div className="mt-4">
                        <h3 className="text-lg font-bold mb-2">Generated Image:</h3>
                        <img src={generatedImageUrl} alt={prompt} className="w-full rounded-lg bg-black object-contain max-h-96" />
                        <a href={generatedImageUrl} download="generated_image.png">
                            <Button variant="secondary" className="w-full mt-2 flex items-center justify-center">
                                <DownloadIcon className="w-5 h-5 mr-2" /> Download Image
                            </Button>
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageGenerator;
