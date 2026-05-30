import React, { useState, useEffect, useRef } from 'react';
import Button from '../common/Button.tsx';
import Input from '../common/Input.tsx';
import Select from '../common/Select.tsx';
import { ClipboardListIcon } from '../icons/SettingsIcon.tsx';
import * as geminiService from '../../services/geminiService.ts';
import * as studentDataService from '../../services/studentDataService.ts';
import { Quiz } from '../../types.ts';
import { parsePdfText } from '../../utils/pdfParser.ts';

interface QuizGeneratorProps {
    initialSourceText?: string;
}

const QuizGenerator: React.FC<QuizGeneratorProps> = ({ initialSourceText = '' }) => {
    const [topic, setTopic] = useState('');
    const [sourceText, setSourceText] = useState(initialSourceText);
    const [numQuestions, setNumQuestions] = useState(5);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [fileName, setFileName] = useState('');

    // File Parsing State
    const [isParsingFile, setIsParsingFile] = useState(false);
    const [parsingProgress, setParsingProgress] = useState(0);
    const [parsingError, setParsingError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

     useEffect(() => {
        if (initialSourceText) {
            setSourceText(initialSourceText);
        }
    }, [initialSourceText]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            setSourceText('');
            setIsParsingFile(true);
            setParsingProgress(0);
            setParsingError(null);
            setError(null);
            setGeneratedQuiz(null);

            try {
                if (file.type === 'application/pdf') {
                    const text = await parsePdfText(file, (progress) => {
                        setParsingProgress(progress);
                    });
                    setSourceText(text);
                } else {
                    setParsingProgress(50);
                    const text = await file.text();
                    setSourceText(text);
                    setParsingProgress(100);
                }
            } catch (err) {
                console.error("Error parsing file for quiz:", err);
                setParsingError('Could not read file. It may be corrupted.');
                setFileName('');
            } finally {
                setIsParsingFile(false);
            }
        }
    };


    const handleGenerate = async () => {
        if (!topic || !sourceText) {
            setError('Please provide a topic and some source text.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedQuiz(null);
        setIsSaved(false);
        try {
            const quiz = await geminiService.generateQuiz(topic, sourceText, numQuestions, difficulty);
            if (quiz) {
                setGeneratedQuiz({ ...quiz, sourceText });
            } else {
                throw new Error("Quiz generation failed. The AI returned no content.");
            }
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        if (generatedQuiz) {
            studentDataService.saveQuiz(generatedQuiz);
            setIsSaved(true);
        }
    };

    return (
        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ClipboardListIcon /> AI Quiz Generator
            </h2>
            <div className="space-y-4">
                <Input
                    label="Quiz Topic"
                    placeholder="e.g., The Water Cycle"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                />
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Source Text</label>
                    
                    {isParsingFile ? (
                        <div className="text-center w-full bg-gray-700 p-4 rounded-lg">
                            <p className="text-sm font-semibold text-indigo-300">Parsing "{fileName}"...</p>
                            <div className="w-full bg-gray-800 rounded-full h-2.5 mt-2">
                                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${parsingProgress}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{parsingProgress}% complete</p>
                        </div>
                    ) : parsingError ? (
                        <div className="text-center text-red-400 bg-red-900/30 p-4 rounded-lg">
                            <p className="font-bold">Parsing Failed</p>
                            <p className="text-sm">{parsingError}</p>
                            <Button variant="secondary" className="!text-xs !py-1 mt-2" onClick={() => {
                                setParsingError(null);
                                fileInputRef.current?.click();
                            }}>Try another file</Button>
                        </div>
                    ) : (
                        <>
                            <div className="flex text-sm text-gray-400 mb-2">
                                <label htmlFor="quiz-file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-indigo-400 hover:text-indigo-300">
                                    <span>Upload a file</span>
                                    <input ref={fileInputRef} id="quiz-file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.txt,.md" />
                                </label>
                                <p className="pl-1">or paste text below. {fileName && <span className="text-gray-500">({fileName})</span>}</p>
                            </div>
                            <textarea
                                className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Paste a paragraph or two from your lesson material..."
                                rows={5}
                                value={sourceText}
                                onChange={e => setSourceText(e.target.value)}
                            />
                        </>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Number of Questions"
                        type="number"
                        min="1"
                        max="10"
                        value={numQuestions}
                        onChange={e => setNumQuestions(parseInt(e.target.value))}
                    />
                     <Select
                        label="Difficulty"
                        value={difficulty}
                        onChange={e => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                    >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </Select>
                </div>
                
                <Button onClick={handleGenerate} disabled={isLoading || !topic || !sourceText} className="w-full !mt-6">
                    {isLoading ? 'Generating Quiz...' : 'Generate Quiz'}
                </Button>

                {isLoading && (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
                    </div>
                )}
                {error && <p className="text-red-400 text-center py-2" role="alert">{error}</p>}
                
                {generatedQuiz && (
                    <div className="mt-4 space-y-4">
                        <h3 className="text-lg font-bold text-center">{generatedQuiz.title}</h3>
                        <div className="max-h-80 overflow-y-auto pr-2 space-y-3 bg-gray-800 p-4 rounded-lg">
                            {generatedQuiz.questions.map((q, index) => (
                                <div key={q.id} className="bg-gray-900/50 p-3 rounded-md">
                                    <p className="font-semibold">{index + 1}. {q.question}</p>
                                    <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                                        {q.options.map(opt => (
                                            <li key={opt} className={opt === q.correctAnswer ? 'text-green-400 font-bold' : 'text-gray-300'}>
                                                {opt}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <Button onClick={handleSave} disabled={isSaved} className="w-full">
                            {isSaved ? 'Quiz Saved & Assigned!' : 'Save & Assign to Class'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizGenerator;