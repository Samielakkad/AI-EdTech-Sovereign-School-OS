import React, { useState, useEffect } from 'react';
import * as geminiService from '../../services/geminiService.ts';
import { Flashcard } from '../../services/geminiService.ts';
import * as courseSummaryService from '../../services/courseSummaryService.ts';
import { CourseSummary } from '../../services/courseSummaryService.ts';
import Button from '../common/Button.tsx';
import Input from '../common/Input.tsx';
import { MicIcon, LayersIcon } from '../icons/SettingsIcon.tsx';
import { useRecorder } from '../../hooks/useRecorder.ts';
import FlashcardModal from './FlashcardModal.tsx';


type Status = 'idle' | 'recording' | 'transcribing' | 'summarizing' | 'success' | 'error';

const StatusIndicator: React.FC<{ status: Status; error: string | null }> = ({ status, error }) => {
    const statusConfig: Record<Status, { text: string; className: string }> = {
        idle: { text: 'Ready to record', className: 'text-gray-400' },
        recording: { text: 'Recording...', className: 'text-yellow-400 animate-pulse' },
        transcribing: { text: 'Transcribing audio...', className: 'text-blue-400' },
        summarizing: { text: 'Generating summary...', className: 'text-blue-400' },
        success: { text: 'Summary generated successfully!', className: 'text-green-400' },
        error: { text: 'Error', className: 'text-red-400' },
    };

    if (status === 'error' && error) {
        return <p className={`text-sm text-center font-semibold ${statusConfig[status].className}`}>{error}</p>;
    }

    if (status === 'idle' || status === 'success') {
        return <p className={`text-sm text-center font-semibold ${statusConfig[status].className}`}>{statusConfig[status].text}</p>;
    }

    return (
        <div className="flex justify-center items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <p className={`text-sm font-semibold ${statusConfig[status].className}`}>{statusConfig[status].text}</p>
        </div>
    );
};


const CourseSummaryView: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [transcription, setTranscription] = useState('');
    const [summary, setSummary] = useState('');
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isShared, setIsShared] = useState(false);
    const [savedSummaries, setSavedSummaries] = useState<CourseSummary[]>([]);
    
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
    const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
    
    const { recordingState, startRecording, stopRecording } = useRecorder();

    useEffect(() => {
        setSavedSummaries(courseSummaryService.getSummaries());
    }, []);

    useEffect(() => {
        if (recordingState === 'recording') {
            setStatus('recording');
        } else if (recordingState === 'denied') {
            setStatus('error');
            setError('Microphone access denied. Please enable it in your browser settings.');
        }
    }, [recordingState]);

    const handleToggleRecording = async () => {
        if (status === 'recording') {
            try {
                setStatus('transcribing');
                const audioBlob = await stopRecording();

                if (audioBlob.size < 2000) { 
                    setError('Recording was too short. Please record for at least a few seconds.');
                    setStatus('error');
                    return;
                }

                const transcribedText = await geminiService.transcribeAudio(audioBlob);
                setTranscription(transcribedText);
                
                setStatus('summarizing');
                const summaryResult = await geminiService.summarizeTranscription(transcribedText, topic);
                setSummary(summaryResult);
                setStatus('success');
            } catch (err) {
                console.error("Audio processing failed:", err);
                setError('An error occurred while processing your audio. Please try again.');
                setStatus('error');
            }
        } else {
            setIsShared(false);
            setTranscription('');
            setSummary('');
            setError(null);
            setStatus('idle');
            await startRecording();
        }
    };
    
    const handleGenerateFlashcards = async () => {
        if (!transcription) return;
        setIsGeneratingFlashcards(true);
        try {
            const cards = await geminiService.generateFlashcardsFromText(transcription, topic, "8-10");
            setFlashcards(cards);
            if (cards.length > 0) {
                setIsFlashcardModalOpen(true);
            } else {
                alert("Could not generate flashcards from the text.");
            }
        } catch (err) {
            console.error("Flashcard generation failed:", err);
            alert("An error occurred while generating flashcards.");
        } finally {
            setIsGeneratingFlashcards(false);
        }
    };

    const handleShare = () => {
        if (summary && transcription && topic) {
            courseSummaryService.addSummary({ topic, transcription, summary });
            setSavedSummaries(courseSummaryService.getSummaries());
            setIsShared(true);
        }
    };

    const getButtonContent = () => {
        switch (status) {
            case 'recording':
                return "Stop Recording";
            case 'transcribing':
            case 'summarizing':
                return "Processing...";
            default:
                return <><MicIcon className="w-5 h-5 mr-2" /> Start Recording</>;
        }
    };
    
    const isButtonDisabled = (status !== 'idle' && status !== 'recording' && status !== 'success' && status !== 'error') || (!topic && status !== 'recording');

    return (
        <>
            <div className="p-6 h-full flex flex-col">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold">Course Summary Generator</h1>
                    <p className="text-gray-400">Record a lecture, get an AI summary, and share it with your class.</p>
                </header>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                    <div className="flex flex-col gap-6 min-h-0">
                        <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col space-y-4">
                            <h2 className="text-xl font-bold">New Summary</h2>
                            <Input 
                                label="Lesson Topic"
                                placeholder="e.g., The Water Cycle"
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                disabled={status === 'recording' || status === 'transcribing' || status === 'summarizing'}
                            />
                            <Button 
                                onClick={handleToggleRecording} 
                                disabled={isButtonDisabled}
                                className="w-full flex justify-center items-center"
                                variant={status === 'recording' ? 'danger' : 'primary'}
                            >
                                {getButtonContent()}
                            </Button>
                            <div className="h-8 flex items-center justify-center">
                                <StatusIndicator status={status} error={error} />
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex-1 flex flex-col min-h-0">
                            <h3 className="text-lg font-bold mb-2 flex-shrink-0">Transcription</h3>
                            <div className="bg-gray-700/50 rounded-md p-4 flex-1 overflow-y-auto">
                                {(transcription && status !== 'error') ? (
                                    <p className="text-gray-300 whitespace-pre-wrap font-mono text-sm">{transcription}</p>
                                ) : (
                                    <p className="text-gray-500 text-center my-auto">Transcription will appear here.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 min-h-0">
                        <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex-1 flex flex-col min-h-0">
                            <h2 className="text-xl font-bold mb-4 flex-shrink-0">Generated Summary</h2>
                            <div className="bg-gray-700/50 rounded-md p-4 mb-4 flex-grow overflow-y-auto">
                            {(summary && status !== 'error') ? (
                                <p className="text-gray-200 whitespace-pre-wrap">{summary}</p>
                            ) : (
                                <p className="text-gray-500 text-center my-auto">AI-generated summary will appear here.</p>
                            )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <Button onClick={handleGenerateFlashcards} variant="secondary" disabled={status !== 'success' || isGeneratingFlashcards} className="w-full flex items-center justify-center">
                                    <LayersIcon className="w-5 h-5 mr-2"/>
                                    {isGeneratingFlashcards ? 'Generating...' : 'Generate Flashcards'}
                                </Button>
                                <Button onClick={handleShare} disabled={status !== 'success' || isShared} className="w-full">
                                    {isShared ? 'Shared with Class!' : 'Share with Class'}
                                </Button>
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex-1 flex flex-col min-h-0">
                            <h2 className="text-xl font-bold mb-4 flex-shrink-0">Shared Summaries</h2>
                            <div className="overflow-y-auto pr-2 space-y-3 flex-grow">
                                {savedSummaries.length > 0 ? savedSummaries.map(s => (
                                    <div key={s.id} className="bg-gray-700/50 p-3 rounded-lg">
                                        <p className="font-bold text-indigo-300">{s.topic}</p>
                                        <p className="text-xs text-gray-400">{new Date(s.timestamp).toLocaleDateString()}</p>
                                    </div>
                                )) : <p className="text-gray-500 text-center my-auto">No summaries have been shared yet.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FlashcardModal
                isOpen={isFlashcardModalOpen}
                onClose={() => setIsFlashcardModalOpen(false)}
                flashcards={flashcards}
            />
        </>
    );
};

export default CourseSummaryView;
