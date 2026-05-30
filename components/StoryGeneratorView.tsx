

import React, { useState, useEffect } from 'react';
import Button from './common/Button.tsx';
import Select from './common/Select.tsx';
import Input from './common/Input.tsx';
import { generateAdventureModuleConfig } from '../services/geminiService.ts';
import * as studentDataService from '../services/studentDataService.ts';
import { BookOpenIcon, DownloadIcon } from './icons/SettingsIcon.tsx';
import { AdventureModule } from '../types.ts';
import VideoGenerator from './teacher/VideoGenerator.tsx';

interface GeneratedConfig {
    learningObjectives: string[];
    finalAssessmentQuestion: {
        question: string;
        answer: string;
    };
}

const AdventureArchitectView: React.FC = () => {
    // Form State
    const [prompt, setPrompt] = useState('');
    const [topic, setTopic] = useState('');
    const [sourceText, setSourceText] = useState('');
    const [ageGroup, setAgeGroup] = useState('8-10');
    const [stages, setStages] = useState(3);

    // Generation State
    const [generatedConfig, setGeneratedConfig] = useState<GeneratedConfig | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAssigned, setIsAssigned] = useState(false);
    const [modules, setModules] = useState<AdventureModule[]>([]);

    const fetchModules = () => {
        setModules(studentDataService.getAdventureModules());
    };

    useEffect(() => {
        fetchModules();
    }, []);

    const handleGenerateConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setGeneratedConfig(null);
        setIsAssigned(false);
        const config = await generateAdventureModuleConfig(topic, prompt, ageGroup);
        setGeneratedConfig(config);
        setIsLoading(false);
    };
    
    const handleAssign = () => {
        if (generatedConfig) {
            const moduleData = {
                topic,
                prompt,
                sourceText,
                ageGroup,
                stages,
                learningObjectives: generatedConfig.learningObjectives,
                finalAssessmentQuestion: generatedConfig.finalAssessmentQuestion,
            };
            const savedModule = studentDataService.saveAdventureModule(moduleData);
            studentDataService.assignAdventureModuleToAllStudents(savedModule.id);
            setIsAssigned(true);
            fetchModules(); // Refresh the list of modules
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <header className="mb-6 flex-shrink-0">
                <h1 className="text-2xl font-bold">Adventure Architect</h1>
                <p className="text-gray-400">Create interactive, choice-based learning adventures for your class.</p>
            </header>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-1 bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col space-y-4 overflow-y-auto">
                    <h2 className="text-xl font-bold">Adventure Setup</h2>
                    <form onSubmit={handleGenerateConfig} className="space-y-4">
                        <Input
                            label="Academic Topic"
                            placeholder="e.g., Photosynthesis, The Water Cycle"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Adventure Prompt / Mission</label>
                            <textarea
                                className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                                placeholder="e.g., A mission to save a dying alien forest using photosynthesis."
                                rows={2}
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                required
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Source Text (Optional Context)</label>
                            <textarea
                                className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                                placeholder="Paste a key paragraph from a textbook or PDF..."
                                rows={4}
                                value={sourceText}
                                onChange={e => setSourceText(e.target.value)}
                            />
                        </div>
                        
                        <h3 className="text-lg font-semibold !mt-6 pt-4 border-t border-gray-700">Adventure Configuration</h3>
                        
                        <Select label="Target Age Group" value={ageGroup} onChange={e => setAgeGroup(e.target.value)}>
                            <option value="5-7">5-7 years</option>
                            <option value="8-10">8-10 years</option>
                            <option value="11-13">11-13 years</option>
                        </Select>

                        <Input
                            label="Number of Stages (2-25)"
                            type="number"
                            min="2"
                            max="25"
                            value={stages}
                            onChange={e => setStages(parseInt(e.target.value))}
                        />
                        
                         <div className="bg-gray-900/50 p-3 rounded-lg text-xs text-gray-400">
                           <p className="font-bold text-indigo-300 mb-1">Future Vision: AR/VR Integration</p>
                           This interactive format is designed to be easily adapted for immersive AR glasses, turning your classroom into a virtual learning environment.
                        </div>

                        <Button type="submit" disabled={isLoading || !prompt || !topic} className="w-full !mt-8">
                            {isLoading ? 'Generating...' : 'Generate Learning Objectives'}
                        </Button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-lg p-6 overflow-y-auto relative flex flex-col">
                    {isLoading && (
                        <div className="absolute inset-0 bg-gray-800/80 flex justify-center items-center z-10">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400"></div>
                        </div>
                    )}
                    {!isLoading && !generatedConfig && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <BookOpenIcon className="w-24 h-24 text-gray-600 mb-4" />
                            <h2 className="text-xl font-bold text-gray-400">Review Objectives Here</h2>
                            <p className="text-gray-500 max-w-sm">After generation, the core learning goals for this adventure will appear here for your review before assigning to the class.</p>
                        </div>
                    )}
                    {generatedConfig && (
                        <div className="flex-1 flex flex-col">
                            <div className="flex-1 overflow-y-auto pr-2">
                                <h1 className="text-2xl font-bold text-indigo-400 mb-6">Review Adventure Blueprint</h1>
                                
                                <h2 className="text-lg font-bold mb-2">Learning Objectives</h2>
                                <ul className="space-y-2 list-disc list-inside bg-gray-700/50 p-4 rounded-lg mb-6">
                                    {generatedConfig.learningObjectives.map((obj, i) => (
                                        <li key={i}>{obj}</li>
                                    ))}
                                </ul>

                                <h2 className="text-lg font-bold mb-2">Final Assessment</h2>
                                 <div className="bg-gray-700/50 p-4 rounded-lg">
                                    <p className="font-semibold">{generatedConfig.finalAssessmentQuestion.question}</p>
                                    <p className="text-sm text-green-400/80 mt-2">
                                        <span className="font-bold">Expected Answer:</span> {generatedConfig.finalAssessmentQuestion.answer}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 flex-shrink-0">
                                <Button onClick={handleAssign} disabled={isAssigned} className="w-full">
                                    {isAssigned ? 'Assigned to Class!' : 'Looks Good! Assign to Class'}
                                </Button>
                            </div>
                        </div>
                    )}
                     <div className="mt-8 pt-6 border-t border-gray-700">
                        <h2 className="text-xl font-bold mb-4">My Content Library</h2>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            <div className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-white">The Journey of a Water Droplet (Video)</h3>
                                    <p className="text-sm text-indigo-300">Topic: The Water Cycle</p>
                                </div>
                                <Button onClick={() => window.open('https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', '_blank')} className="flex items-center gap-2">
                                    <DownloadIcon className="w-4 h-4" /> Download MP4
                                </Button>
                            </div>
                            {modules.map(module => (
                                <div key={module.id} className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-white">{module.prompt}</h3>
                                        <p className="text-sm text-indigo-300">Topic: {module.topic}</p>
                                    </div>
                                    <div className="relative group">
                                        <Button variant="secondary" disabled>Export Comic</Button>
                                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 bg-gray-900 text-white text-xs rounded-lg p-2 z-10 shadow-lg">
                                            Students can export their completed comic as a PDF or ZIP file from their portal.
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {modules.length === 0 && (
                                <p className="text-gray-500 text-center py-4">You haven't created any adventures yet.</p>
                            )}
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-700">
                        <VideoGenerator />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdventureArchitectView;