import React, { useState, useEffect } from 'react';
import Button from '../common/Button.tsx';
import Select from '../common/Select.tsx';
import { VideoIcon } from '../icons/SettingsIcon.tsx';
import * as geminiService from '../../services/geminiService.ts';

const LessonVideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [complexity, setComplexity] = useState<'simple' | 'detailed'>('simple');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const loadingMessages = [
        "Scripting an educational masterpiece...",
        "Animating key concepts...",
        "Consulting with digital curriculum experts...",
        "This can take a few minutes. Great lesson videos take time!",
        "Adding the final polish...",
    ];
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

    useEffect(() => {
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
            setError('Please enter a topic or prompt for the video.');
            return;
        }
        
        setIsLoading(true);
        setGeneratedVideoUrl(null);
        setError(null);
        
        try {
            const finalPrompt = complexity === 'simple' 
                ? `Create a simple, clear, educational video for K-12 students about: ${prompt}. Use a friendly 2D animation style with vibrant colors and clear labels.`
                : `Create a detailed, informative educational video about: ${prompt}. Use cinematic, high-quality visuals and on-screen text for key information.`;

            const videoUrl = await geminiService.generateVideoFromPrompt(finalPrompt, aspectRatio);
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
                <VideoIcon /> AI Lesson Video Generator
            </h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="lesson-video-prompt" className="block text-sm font-medium text-gray-300 mb-1">Video Topic/Prompt</label>
                    <textarea
                        id="lesson-video-prompt"
                        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., The process of photosynthesis explained simply"
                        rows={2}
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select label="Complexity" value={complexity} onChange={e => setComplexity(e.target.value as any)}>
                        <option value="simple">Simple (for younger students)</option>
                        <option value="detailed">Detailed (for older students)</option>
                    </Select>
                    <Select label="Aspect Ratio" value={aspectRatio} onChange={e => setAspectRatio(e.target.value as any)}>
                        <option value="16:9">16:9 (Landscape)</option>
                        <option value="9:16">9:16 (Portrait)</option>
                    </Select>
                </div>
                
                <div className="bg-yellow-900/50 p-3 rounded-lg text-xs text-gray-300 border border-yellow-700">
                    <p className="font-bold text-yellow-300 mb-1">Important:</p>
                    <p>This feature uses Veo, which requires a project with billing enabled. You may be prompted to select an API key. For more info, see <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">Google's billing documentation</a>.</p>
                </div>
                
                <Button onClick={handleGenerate} disabled={isLoading || !prompt} className="w-full !mt-6">
                    {isLoading ? 'Generating Video...' : 'Generate Class Video'}
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
                        <a href={generatedVideoUrl} download="lesson_video.mp4">
                            <Button variant="secondary" className="w-full mt-2">Download Video</Button>
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonVideoGenerator;