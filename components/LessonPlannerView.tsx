// FIX: Populating empty file to resolve an import error. Content is adapted from the equivalent component in the /teacher directory with corrected relative import paths.
import React, { useState, useEffect, useRef } from 'react';
import { LessonPlan, LessonPlanActivity } from '../types.ts';
import * as geminiService from '../services/geminiService.ts';
import { Flashcard } from '../services/geminiService.ts';
import Button from './common/Button.tsx';
import Select from './common/Select.tsx';
import { ClipboardListIcon, DownloadIcon, SparklesIcon, MicIcon, LayersIcon } from './icons/SettingsIcon.tsx';
import AstraForTeachers from './teacher/AstraForTeachers.tsx';
import FlashcardModal from './teacher/FlashcardModal.tsx';
// FIX: Import and use the 'useRecorder' hook for consistent audio handling.
import { useRecorder } from '../hooks/useRecorder.ts';
import * as lessonVersionService from '../services/lessonVersionService.ts';
import { LessonVersion } from '../services/lessonVersionService.ts';
// FIX: Import `mockTeacher` to construct a context ID for the AI chat.
import { mockTeacher } from '../hooks/useUserProfile.ts';


declare const jspdf: any;
declare const JSZip: any;

const ActivityCard: React.FC<{ activity: LessonPlanActivity, imageUrl?: string }> = ({ activity, imageUrl }) => {
    return (
        <div className="bg-gray-700/50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-indigo-300">{activity.activity}</h4>
                <span className="text-xs font-semibold bg-gray-600 px-2 py-1 rounded-full">{activity.duration} mins</span>
            </div>
            <p className="text-sm text-gray-300 mb-4 whitespace-pre-wrap">{activity.description}</p>
            {imageUrl && (
                <div className="mt-4 text-center">
                    <img src={imageUrl} alt={`Illustration for ${activity.activity}`} className="rounded-lg max-w-sm mx-auto shadow-lg" />
                </div>
            )}
            {activity.imagePrompt && !imageUrl && (
                 <div className="text-center py-4 text-gray-500 text-sm">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400 mx-auto mb-2"></div>
                    Generating image...
                </div>
            )}
        </div>
    );
};

const LessonPlanDisplay: React.FC<{ plan: LessonPlan; images: Record<number, string> }> = ({ plan, images }) => (
    <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        <header className="pb-4 border-b border-gray-700">
            <h1 className="text-3xl font-bold text-indigo-400">{plan.title}</h1>
            <p className="text-md text-gray-400">Topic: {plan.topic}</p>
        </header>

        <section>
            <h2 className="text-xl font-bold mb-3">Learning Objectives</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
                {plan.learningObjectives.map((obj, i) => <li key={i}>{obj}</li>)}
            </ul>
        </section>

        <section>
            <h2 className="text-xl font-bold mb-3">Key Vocabulary</h2>
            <div className="flex flex-wrap gap-2">
                {plan.keyVocabulary.map((word, i) => <span key={i} className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-sm">{word}</span>)}
            </div>
        </section>

        <section>
            <h2 className="text-xl font-bold mb-3">Lesson Activities</h2>
            <div className="space-y-4">
                {plan.lessonActivities.map((activity, index) => (
                    <ActivityCard key={index} activity={activity} imageUrl={images[index]} />
                ))}
            </div>
        </section>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-700">
            <section>
                <h2 className="text-xl font-bold mb-3">Assessment</h2>
                 <div className="bg-gray-700/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-indigo-300">{plan.assessment.method}</h4>
                    <p className="text-sm text-gray-300 mt-1">{plan.assessment.description}</p>
                 </div>
            </section>
            <section>
                <h2 className="text-xl font-bold mb-3">Differentiation</h2>
                 <div className="bg-gray-700/50 p-4 rounded-lg space-y-3">
                    <div>
                        <h4 className="font-semibold text-green-400">Support</h4>
                        <p className="text-sm text-gray-300 mt-1">{plan.differentiation.support}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-yellow-400">Challenge</h4>
                        <p className="text-sm text-gray-300 mt-1">{plan.differentiation.challenge}</p>
                    </div>
                 </div>
            </section>
        </div>
    </div>
);


const LessonPlannerView: React.FC = () => {
    // Form state
    const [sourceText, setSourceText] = useState('');
    const [topic, setTopic] = useState('');
    const [ageGroup, setAgeGroup] = useState('8-10');
    const [skillLevel, setSkillLevel] = useState('intermediate');
    const [culturalNotes, setCulturalNotes] = useState('');
    const [fileName, setFileName] = useState('');

    // Generation state
    const [isLoading, setIsLoading] = useState(false);
    const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
    const [activityImages, setActivityImages] = useState<Record<number, string>>({});
    const [isKitLoading, setIsKitLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'plan' | 'chat'>('plan');
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
    const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    
    // Versioning State
    const [sessionId, setSessionId] = useState(() => `session-${Date.now()}`);
    const [versions, setVersions] = useState<LessonVersion[]>([]);

    const { recordingState, startRecording, stopRecording } = useRecorder();
    type RecordableField = 'sourceText' | 'topic' | 'culturalNotes';
    const [recordingField, setRecordingField] = useState<RecordableField | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);

    // Text analysis state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisSuggestions, setAnalysisSuggestions] = useState<{ suggestedTopic: string; suggestedObjectives: string[] } | null>(null);


    const loadingMessages = [
        "Drafting learning objectives...",
        "Brainstorming engaging activities...",
        "Consulting pedagogical models...",
        "Aligning with curriculum standards...",
        "This can take a moment for complex topics...",
    ];

    useEffect(() => {
        let interval: number;
        if (isLoading) {
            setLoadingMessage(loadingMessages[0]);
            interval = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    return loadingMessages[(currentIndex + 1) % loadingMessages.length];
                });
            }, 4000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);


    useEffect(() => {
        setVersions(lessonVersionService.getVersions(sessionId));
    }, [sessionId]);

    useEffect(() => {
        if (lessonPlan?.lessonActivities) {
            const generateImages = async () => {
                const imagePromises = lessonPlan.lessonActivities.map(async (activity, index) => {
                    if (activity.imagePrompt) {
                        try {
                            const imageUrl = await geminiService.generateImage(activity.imagePrompt);
                            return { index, imageUrl };
                        } catch (error) {
                            console.error(`Failed to generate image for activity ${index}:`, error);
                            return null;
                        }
                    }
                    return null;
                });
                
                const results = await Promise.all(imagePromises);
                
                setActivityImages(prevImages => {
                    const newImages = { ...prevImages };
                    results.forEach(result => {
                        if (result && result.imageUrl) {
                            newImages[result.index] = result.imageUrl;
                        }
                    });
                    return newImages;
                });
            };
            generateImages();
        }
    }, [lessonPlan]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            setSourceText(`(Simulated text from ${file.name}) You can now paste the content from your file into this text area.`);
        }
    };
    
    const handleStartNewLesson = () => {
        // Reset form and generated content
        setSourceText('');
        setTopic('');
        setCulturalNotes('');
        setFileName('');
        setLessonPlan(null);
        setActivityImages({});
        setAnalysisSuggestions(null);
        setError(null);
        
        // Generate new session ID, which will trigger a re-fetch of versions (to an empty array)
        setSessionId(`session-${Date.now()}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setLessonPlan(null);
        setActivityImages({});
        setActiveTab('plan');
        setAnalysisSuggestions(null);
        setError(null);

        try {
            const result = await geminiService.generateLessonPlan({
                sourceText,
                topic,
                ageGroup,
                skillLevel,
                culturalNotes,
            });
            
            if (result) {
                const newPlan = { ...result, sourceText }; // Add source text for context
                setLessonPlan(newPlan);
                lessonVersionService.addVersion(sessionId, newPlan);
                setVersions(lessonVersionService.getVersions(sessionId));
            } else {
                setError("The AI returned an empty lesson plan. Please try refining your topic or source text.");
                setLessonPlan(null);
            }
        } catch (err: any) {
            console.error("Failed to generate lesson plan:", err);
            setError(`Sorry, an error occurred while generating the lesson plan. The AI may have been unable to process the request. (Details: ${err.message})`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRestoreVersion = (versionToRestore: LessonVersion) => {
        // Update main state to show the restored plan
        setLessonPlan(versionToRestore.plan);
        
        // Also update form fields for consistency
        setSourceText(versionToRestore.plan.sourceText || '');
        setTopic(versionToRestore.plan.topic);
        
        // Add the restored version as the *newest* version to maintain a linear history
        lessonVersionService.addVersion(sessionId, versionToRestore.plan);
        setVersions(lessonVersionService.getVersions(sessionId));

        // Reset images to allow them to be regenerated by the useEffect hook
        setActivityImages({});
    };

    const handleAnalyzeText = async () => {
        if (!sourceText.trim()) return;
        setIsAnalyzing(true);
        setAnalysisSuggestions(null);
        try {
            const result = await geminiService.analyzeSourceText(sourceText);
            setAnalysisSuggestions(result);
        } catch (error) {
            console.error("Failed to analyze text:", error);
            alert("Sorry, I couldn't analyze the text. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDictate = async (field: RecordableField) => {
        if (recordingState === 'recording' && recordingField === field) {
            setIsTranscribing(true);
            try {
                const audioBlob = await stopRecording();
                const transcribedText = await geminiService.transcribeAudio(audioBlob);

                switch (field) {
                    case 'sourceText':
                        setSourceText(prev => prev ? `${prev}\n${transcribedText}` : transcribedText);
                        break;
                    case 'topic':
                        setTopic(transcribedText);
                        break;
                    case 'culturalNotes':
                        setCulturalNotes(prev => prev ? `${prev}\n${transcribedText}` : transcribedText);
                        break;
                }
            } catch (error) {
                console.error("Dictation failed:", error);
            } finally {
                setIsTranscribing(false);
                setRecordingField(null);
            }
        } else if (recordingState === 'idle') {
            setRecordingField(field);
            await startRecording();
        }
    };

    const DictateButton: React.FC<{ field: RecordableField; className?: string }> = ({ field, className }) => {
        const isRecordingThisField = recordingState === 'recording' && recordingField === field;
        const isTranscribingThisField = isTranscribing && recordingField === field;
        const isDisabled = (recordingState !== 'idle' && !isRecordingThisField) || isTranscribing;

        let title = `Dictate for ${field}`;
        if (recordingState === 'denied') {
            title = 'Microphone access denied';
        } else if (isRecordingThisField) {
            title = 'Stop recording';
        } else if (isTranscribingThisField) {
            title = 'Transcribing...';
        }

        return (
            <Button
                type="button"
                variant="secondary"
                onClick={() => handleDictate(field)}
                disabled={isDisabled}
                title={title}
                className={`!p-2 z-10 ${className}`}
                aria-label={title}
            >
                {isRecordingThisField ? (
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                ) : isTranscribingThisField ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-400 border-t-white" />
                ) : (
                    <MicIcon className="w-4 h-4" />
                )}
            </Button>
        );
    };

    const handleGenerateFlashcards = async () => {
        if (!lessonPlan || lessonPlan.keyVocabulary.length === 0) return;
        setIsGeneratingFlashcards(true);
        const cards = await geminiService.generateFlashcards(
            lessonPlan.keyVocabulary,
            lessonPlan.topic,
            ageGroup
        );
        setFlashcards(cards);
        setIsGeneratingFlashcards(false);
        if (cards.length > 0) {
            setIsFlashcardModalOpen(true);
        } else {
            alert("Sorry, I couldn't generate flashcards for this lesson.");
        }
    };

    const handleGenerateAndDownloadKit = async () => {
        if (!lessonPlan) return;
        setIsKitLoading(true);

        const kitData = await geminiService.generateLessonKit(lessonPlan);

        if (kitData) {
            try {
                const { jsPDF } = jspdf;
                const zip = new JSZip();

                // 1. Create Slideshow PDF programmatically
                const slideshowDoc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1280, 720] });
                const addSlide = (title: string, points?: string[], image?: string) => {
                    if (slideshowDoc.internal.pages.length > 1) slideshowDoc.addPage();
                    slideshowDoc.setFillColor(31, 41, 55); // bg-gray-800
                    slideshowDoc.rect(0, 0, 1280, 720, 'F');
                    
                    if (image) {
                        slideshowDoc.addImage(image, 'PNG', 40, 150, 640, 360);
                        slideshowDoc.setTextColor(229, 231, 235);
                        slideshowDoc.setFontSize(48);
                        slideshowDoc.text(title, 720, 150, { maxWidth: 520 });
                        if (points && points.length > 0) {
                             slideshowDoc.setTextColor(209, 213, 219);
                             slideshowDoc.setFontSize(28);
                             const splitPoints = slideshowDoc.splitTextToSize(points.join('\n\n'), 520);
                             slideshowDoc.text(splitPoints, 720, 240);
                        }
                    } else {
                        slideshowDoc.setTextColor(229, 231, 235);
                        slideshowDoc.setFontSize(60);
                        slideshowDoc.text(title, 60, 120, { maxWidth: 1160 });
                        if (points) {
                            slideshowDoc.setTextColor(209, 213, 219);
                            slideshowDoc.setFontSize(32);
                            points.forEach((point, pointIndex) => {
                                const splitPoint = slideshowDoc.splitTextToSize(`• ${point}`, 1100);
                                slideshowDoc.text(splitPoint, 80, 220 + (pointIndex * 80));
                            });
                        }
                    }
                };

                addSlide(lessonPlan.title, [`Topic: ${lessonPlan.topic}`]);
                addSlide('Learning Objectives', lessonPlan.learningObjectives);
                addSlide('Key Vocabulary', lessonPlan.keyVocabulary);
                lessonPlan.lessonActivities.forEach((activity, index) => {
                    addSlide(activity.activity, [activity.description], activityImages[index]);
                });
                addSlide('Assessment', [lessonPlan.assessment.method, lessonPlan.assessment.description]);
                
                zip.file("Slideshow.pdf", slideshowDoc.output('blob'));

                // 2. Create Exercises PDF with new question types
                const exercisesDoc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
                exercisesDoc.setFontSize(22);
                exercisesDoc.text(lessonPlan.title + " - Exercises", 40, 60);
                let yPos = 100;
                const maxWidth = exercisesDoc.internal.pageSize.getWidth() - 80;

                exercisesDoc.setFontSize(16);
                exercisesDoc.text("Multiple Choice", 40, yPos);
                yPos += 25;
                kitData.exercises.multipleChoice?.forEach((mc: any, index: number) => {
                    exercisesDoc.setFontSize(12);
                    const qText = exercisesDoc.splitTextToSize(`${index + 1}. ${mc.question}`, maxWidth);
                    exercisesDoc.text(qText, 40, yPos);
                    yPos += (qText.length * 15);
                    mc.options.forEach((opt: string) => {
                        exercisesDoc.text(`  ◯  ${opt}`, 50, yPos);
                        yPos += 20;
                    });
                    yPos += 10;
                });
                
                if (kitData.exercises.trueFalse?.length > 0) {
                    yPos += 20;
                    exercisesDoc.setFontSize(16);
                    exercisesDoc.text("True or False", 40, yPos);
                    yPos += 25;
                    kitData.exercises.trueFalse.forEach((tf: any, index: number) => {
                        exercisesDoc.setFontSize(12);
                        const qText = exercisesDoc.splitTextToSize(`${index + 1}. ${tf.question}`, maxWidth);
                        exercisesDoc.text(qText, 40, yPos);
                        yPos += (qText.length * 15);
                        exercisesDoc.text('T  /  F', 50, yPos);
                        yPos += 25;
                    });
                }

                if (kitData.exercises.fillInTheBlank?.length > 0) {
                    yPos += 20;
                    exercisesDoc.setFontSize(16);
                    exercisesDoc.text("Fill in the Blank", 40, yPos);
                    yPos += 25;
                    kitData.exercises.fillInTheBlank.forEach((fitb: any, index: number) => {
                        exercisesDoc.setFontSize(12);
                        const sentence = fitb.sentence.replace('__BLANK__', '_________________');
                        const qText = exercisesDoc.splitTextToSize(`${index + 1}. ${sentence}`, maxWidth);
                        exercisesDoc.text(qText, 40, yPos);
                        yPos += (qText.length * 15) + 20;
                    });
                }

                yPos += 20;
                exercisesDoc.setFontSize(16);
                exercisesDoc.text("Short Answer", 40, yPos);
                yPos += 25;
                kitData.exercises.shortAnswer?.forEach((sa: any, index: number) => {
                    exercisesDoc.setFontSize(12);
                    const saText = exercisesDoc.splitTextToSize(`${index + 1}. ${sa.question}`, maxWidth);
                    exercisesDoc.text(saText, 40, yPos);
                    yPos += (saText.length * 15) + 80; // Leave space for writing
                });
                zip.file("Exercises.pdf", exercisesDoc.output('blob'));
                
                // 3. Create Rubric PDF
                const rubricDoc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
                rubricDoc.setFontSize(22);
                rubricDoc.text(kitData.rubric.title, 40, 60);
                const tableBody = kitData.rubric.criteria.map((c: any) => [c.criterion, c.level1, c.level2, c.level3, c.level4]);
                (rubricDoc as any).autoTable({
                    head: [['Criterion', 'Beginning', 'Developing', 'Proficient', 'Exemplary']],
                    body: tableBody,
                    startY: 80,
                    theme: 'grid',
                    headStyles: { fillColor: [79, 70, 229] }, // indigo-600
                });
                zip.file("Rubric.pdf", rubricDoc.output('blob'));

                // 4. Zip and Download
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(zipBlob);
                link.download = `${lessonPlan.title.replace(/\s+/g, '_')}_Lesson_Kit.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

            } catch (err) {
                console.error("Failed to create lesson kit files:", err);
                alert("There was an error creating the lesson kit files. Please check the console for details.");
            }
        } else {
             alert("The AI failed to generate the lesson kit. Please try again.");
        }

        setIsKitLoading(false);
    };
    
    const isFormIncomplete = !topic || !sourceText;

    return (
        <>
            <div className="p-6 h-full flex flex-col">
                <header className="mb-6 flex-shrink-0">
                    <h1 className="text-2xl font-bold">AI Lesson Planner</h1>
                    <p className="text-gray-400">Generate a comprehensive lesson plan from your source material in minutes.</p>
                </header>
                 {error && (
                    <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6" role="alert">
                        <p className="font-bold">Generation Failed</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                    <div className="lg:col-span-1 bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Lesson Details</h2>
                            <Button variant="secondary" onClick={handleStartNewLesson}>
                                Start New
                            </Button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Upload Source PDF (Optional)</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <div className="flex text-sm text-gray-400">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-indigo-500"><span className="">Upload a file</span><input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.txt,.md" /></label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">{fileName || 'PDF, TXT, MD'}</p>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="source-text" className="block text-sm font-medium text-gray-300 mb-1">Source Text</label>
                                <div className="relative">
                                    <textarea
                                        id="source-text"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                                        placeholder="Paste the key text from your lesson material here..."
                                        rows={8}
                                        value={sourceText}
                                        onChange={e => setSourceText(e.target.value)}
                                        required
                                        disabled={recordingState !== 'idle' || isTranscribing}
                                    />
                                    <DictateButton field="sourceText" className="!absolute !bottom-2 !right-2" />
                                </div>
                            </div>

                            <Button
                                type="button"
                                onClick={handleAnalyzeText}
                                disabled={!sourceText.trim() || isAnalyzing || isLoading}
                                variant="secondary"
                                className="w-full flex items-center justify-center"
                            >
                                {isAnalyzing ? 'Analyzing...' : <><SparklesIcon className="w-5 h-5 mr-2" /> Analyze Text for Suggestions</>}
                            </Button>

                            {analysisSuggestions && (
                                <div className="p-4 bg-gray-900/50 rounded-lg border border-indigo-500/30 space-y-4">
                                    <h3 className="text-lg font-bold text-indigo-300">AI Suggestions</h3>
                                    <div>
                                        <h4 className="font-semibold text-gray-200 mb-1">Suggested Topic</h4>
                                        <div className="flex items-center gap-2">
                                            <p className="flex-grow text-gray-300 bg-gray-700 p-2 rounded-md text-sm">{analysisSuggestions.suggestedTopic}</p>
                                            <Button variant="secondary" className="!py-1 !px-3 !text-xs" onClick={() => setTopic(analysisSuggestions.suggestedTopic)}>Apply</Button>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-200 mb-2">Suggested Learning Objectives</h4>
                                        <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                                            {analysisSuggestions.suggestedObjectives.map((obj, i) => (<li key={i}>{obj}</li>))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label htmlFor="lesson-topic" className="block text-sm font-medium text-gray-300 mb-1">Lesson Topic</label>
                                <div className="relative">
                                    <input
                                        id="lesson-topic"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400"
                                        placeholder="e.g., The Roman Empire"
                                        value={topic}
                                        onChange={e => setTopic(e.target.value)}
                                        required
                                        disabled={recordingState !== 'idle' || isTranscribing}
                                    />
                                    <DictateButton field="topic" className="!absolute !top-1/2 !-translate-y-1/2 !right-2" />
                                </div>
                            </div>
                            <Select label="Target Age Group" value={ageGroup} onChange={e => setAgeGroup(e.target.value)}>
                                <option value="5-7">5-7 years</option>
                                <option value="8-10">8-10 years</option>
                                <option value="11-13">11-13 years</option>
                                <option value="14-16">14-16 years</option>
                            </Select>
                            <Select label="General Skill Level" value={skillLevel} onChange={e => setSkillLevel(e.target.value)}>
                                <option value="beginner">Beginner / Below Grade Level</option>
                                <option value="intermediate">Intermediate / At Grade Level</option>
                                <option value="advanced">Advanced / Above Grade Level</option>
                            </Select>
                            <div>
                                <label htmlFor="cultural-notes" className="block text-sm font-medium text-gray-300 mb-1">Cultural or Contextual Notes</label>
                                <div className="relative">
                                    <textarea
                                        id="cultural-notes"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
                                        placeholder="e.g., Students are visual learners; avoid local slang."
                                        rows={2}
                                        value={culturalNotes}
                                        onChange={e => setCulturalNotes(e.target.value)}
                                        disabled={recordingState !== 'idle' || isTranscribing}
                                    />
                                    <DictateButton field="culturalNotes" className="!absolute !bottom-2 !right-2" />
                                </div>
                            </div>
                            <Button type="submit" disabled={isLoading || isFormIncomplete || recordingState !== 'idle'} className="w-full !mt-8">
                                {isLoading ? 'Generating Plan...' : 'Generate Lesson Plan'}
                            </Button>
                        </form>
                        
                        {versions.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-700">
                                <h3 className="text-lg font-bold mb-3">Version History</h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                    {versions.map((version, index) => (
                                        <div key={version.timestamp} className="bg-gray-700/50 p-2 rounded-md flex justify-between items-center">
                                            <span className="text-sm text-gray-400">
                                                Version from {new Date(version.timestamp).toLocaleTimeString()}
                                            </span>
                                            <Button
                                                variant="secondary"
                                                className="!py-1 !px-2 !text-xs"
                                                onClick={() => handleRestoreVersion(version)}
                                                disabled={index === 0}
                                                title={index === 0 ? "This is the current version" : "Restore this version"}
                                            >
                                                Restore
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-lg p-6 overflow-y-auto relative flex flex-col">
                        {isLoading && (
                            <div className="absolute inset-0 bg-gray-800/80 flex justify-center items-center z-10">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400 mx-auto"></div>
                                    <p className="mt-4 text-gray-300">{loadingMessage || 'Building your lesson plan...'}</p>
                                </div>
                            </div>
                        )}
                        {!isLoading && !lessonPlan && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <ClipboardListIcon className="w-24 h-24 text-gray-600 mb-4" />
                                <h2 className="text-xl font-bold text-gray-400">Your Lesson Plan Will Appear Here</h2>
                                <p className="text-gray-500 max-w-sm">Fill out the details on the left, and the AI will craft a complete, ready-to-use lesson plan for you.</p>
                            </div>
                        )}
                        {lessonPlan && (
                            <>
                                <div className="flex-shrink-0 border-b border-gray-700 mb-6">
                                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                                        <button onClick={() => setActiveTab('plan')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'plan' ? 'border-indigo-400 text-indigo-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}><ClipboardListIcon className="w-5 h-5" />Lesson Plan</button>
                                        <button onClick={() => setActiveTab('chat')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'chat' ? 'border-indigo-400 text-indigo-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}><SparklesIcon className="w-5 h-5" />Ask Astra</button>
                                    </nav>
                                </div>

                                {activeTab === 'plan' && (
                                    <>
                                        <LessonPlanDisplay plan={lessonPlan} images={activityImages} />
                                        <div className="mt-6 pt-6 border-t border-gray-700 flex-shrink-0">
                                            <h2 className="text-xl font-bold mb-3">AI-Generated Assets</h2>
                                            <p className="text-gray-400 text-sm mb-4">Create supplementary materials for this lesson.</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <Button onClick={handleGenerateFlashcards} variant="secondary" disabled={isKitLoading || isGeneratingFlashcards} className="w-full flex items-center justify-center">{isGeneratingFlashcards ? 'Generating...' : <><LayersIcon className="w-5 h-5 mr-2" />Generate Flashcards</>}</Button>
                                                <Button onClick={handleGenerateAndDownloadKit} disabled={isKitLoading || isGeneratingFlashcards} className="w-full flex items-center justify-center">{isKitLoading ? 'Generating Kit...' : <><DownloadIcon className="w-5 h-5 mr-2" />Generate & Download Lesson Kit</>}</Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                                {activeTab === 'chat' && ( <AstraForTeachers lessonPlanContext={lessonPlan} contextId={`teacher-${mockTeacher.id}-lesson-planner`} /> )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            <FlashcardModal isOpen={isFlashcardModalOpen} onClose={() => setIsFlashcardModalOpen(false)} flashcards={flashcards} />
        </>
    );
};

export default LessonPlannerView;