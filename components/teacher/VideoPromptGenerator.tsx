import React, { useState } from 'react';
import Button from '../common/Button.tsx';
import Select from '../common/Select.tsx';
import { VideoIcon } from '../icons/SettingsIcon.tsx';
import * as geminiService from '../../services/geminiService.ts';

const VideoPromptGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const loadingMessages = [
        "Scripting the first scene...",
        "Casting digital actors...",
        "Setting up virtual cameras...",
        "This can take a few minutes, please be patient!",
        "Applying final post-production effects...",
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


    const handleGenerate = async () => {
        if (!prompt) {
            setError('Please enter a prompt.');
            return;
        }
        
        setIsLoading(true);
        setGeneratedVideoUrl(null);
        setError(null);
        
        try {
            const videoUrl = await geminiService.generateVideoFromPrompt(prompt, aspectRatio);
            setGeneratedVideoUrl(videoUrl);
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred during video generation.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <VideoIcon /> AI Video Generator (from Prompt)
            </h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="video-prompt-only" className="block text-sm font-medium text-gray-300 mb-1">Video Prompt</label>
                    <textarea
                        id="video-prompt-only"
                        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., A cinematic shot of a futuristic city at night, with flying cars"
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
                    <p>This feature uses Veo, which requires a project with billing enabled. You may be prompted to select an API key.</p>
                </div>
                
                <Button onClick={handleGenerate} disabled={isLoading || !prompt} className="w-full !mt-6">
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
                        <a href={generatedVideoUrl} download="generated_video_prompt.mp4">
                            <Button variant="secondary" className="w-full mt-2">Download Video</Button>
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoPromptGenerator;
