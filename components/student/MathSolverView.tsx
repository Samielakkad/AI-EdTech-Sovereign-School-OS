import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StudentProfile, ParsedContent } from '../../types.ts';
import Button from '../common/Button.tsx';
import * as geminiService from '../../services/geminiService.ts';
import { CalculatorIcon, GraphIcon } from '../icons/StudentIcons.tsx';
import MarkdownRenderer from '../common/MarkdownRenderer.tsx';
import GraphingCalculator from './GraphingCalculator.tsx';
import { parseInteractiveContent } from '../../utils/interactiveParser.ts';
import { MultipleChoice } from './interactive/InteractiveWidgets.tsx';
// FIX: Import HEROES and Hero to determine the current hero theme.
import { HEROES, Hero } from '../../services/heroData.ts';

interface MathSolverViewProps {
    student: StudentProfile;
    onBack: () => void;
}

const MathSolverView: React.FC<MathSolverViewProps> = ({ student, onBack }) => {
    const [problem, setProblem] = useState('');
    const [solutionContent, setSolutionContent] = useState<ParsedContent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const solutionEndRef = useRef<HTMLDivElement>(null);
    
    const [activeTab, setActiveTab] = useState<'solution' | 'graph'>('solution');
    const [functionToGraph, setFunctionToGraph] = useState<string | null>(null);
    const [widgetStates, setWidgetStates] = useState<Record<string, any>>({});
    
    // FIX: Add hero object for theming interactive widgets.
    const hero: Hero = useMemo(() => HEROES.find(h => h.name === student.selectedHero) || HEROES[0], [student.selectedHero]);

    useEffect(() => {
        solutionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [solutionContent, isLoading]);

    const handleWidgetAnswer = (widgetId: string, isCorrect: boolean, userAnswer: any) => {
        setWidgetStates(prev => ({ ...prev, [widgetId]: { submitted: true, isCorrect, userAnswer } }));
    };

    const detectFunction = (problemStr: string): string | null => {
        const cleaned = problemStr.toLowerCase().replace(/\s+/g, '');
        const match = cleaned.match(/^(y=|f\(x\)=)(.*)/);
        if (match && match[2]) {
            return match[2];
        }
        return null;
    }

    const handleSubmit = async (e: React.FormEvent, problemToSolve?: string) => {
        e.preventDefault();
        const currentProblem = problemToSolve || problem;
        if (!currentProblem.trim()) return;

        setIsLoading(true);
        setSolutionContent([]);
        setError(null);
        setFunctionToGraph(null);
        setActiveTab('solution');
        setWidgetStates({});

        const detectedFunc = detectFunction(currentProblem);
        setFunctionToGraph(detectedFunc);

        try {
            const stream = await geminiService.solveMathProblem(currentProblem, student.gradeLevel);
            let fullText = '';
            for await (const chunk of stream) {
                fullText += chunk.text;
                // Temporarily render as plain text while streaming
                setSolutionContent([{ type: 'text', value: fullText }]);
            }
            // Parse for widgets at the end
            setSolutionContent(parseInteractiveContent(fullText, `math-${Date.now()}`));

        } catch (err: any) {
            setError('An error occurred while solving the problem. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const exampleProblems = [
        "y = x^2 - 4",
        "2x + 10 = 20",
        "y = sin(x)",
        "f(x) = 2x + 1",
    ];

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 h-full flex flex-col">
            <Button onClick={onBack} variant="secondary" className="mb-6 self-start">&larr; Back to Learning Hub</Button>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <CalculatorIcon className="w-7 h-7 text-indigo-400" />
                Math Solver
            </h2>
            <p className="text-gray-400 mb-6">Enter a math problem or function to get a step-by-step solution and an interactive graph.</p>
            
            <form onSubmit={handleSubmit} className="flex gap-4 mb-4">
                <input
                    type="text"
                    value={problem}
                    onChange={e => setProblem(e.target.value)}
                    placeholder="e.g., y = x^2 + 2x - 3 or 3x - 7 = 11"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg shadow-sm py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                    aria-label="Math problem input"
                />
                <Button type="submit" disabled={isLoading || !problem.trim()} className="!px-6 !py-3">
                    {isLoading ? 'Solving...' : 'Solve'}
                </Button>
            </form>
            
             <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-sm text-gray-400 my-auto">Try an example:</span>
                {exampleProblems.map(ex => (
                    <button 
                        key={ex}
                        onClick={(e) => {
                            setProblem(ex);
                            handleSubmit(e, ex);
                        }}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 py-1.5 px-3 rounded-full transition-colors disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {ex}
                    </button>
                ))}
            </div>
            
            {(solutionContent.length > 0 || isLoading) && (
                <div className="border-b border-gray-700 mb-4">
                    <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                        <button onClick={() => setActiveTab('solution')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'solution' ? 'border-indigo-400 text-indigo-300' : 'border-transparent text-gray-400 hover:text-white'}`}>
                            <CalculatorIcon className="w-5 h-5"/> Step-by-step Solution
                        </button>
                        {functionToGraph && (
                            <button onClick={() => setActiveTab('graph')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'graph' ? 'border-indigo-400 text-indigo-300' : 'border-transparent text-gray-400 hover:text-white'}`}>
                                <GraphIcon className="w-5 h-5"/> Graph
                            </button>
                        )}
                    </nav>
                </div>
            )}

            <div className="flex-1 overflow-y-auto bg-gray-900/50 rounded-lg p-6 border border-gray-700 min-h-[400px]">
                {isLoading && solutionContent.length === 0 && (
                    <div className="flex justify-center items-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
                            <p className="text-gray-400">Calculating solution...</p>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="text-center text-red-400">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}

                {activeTab === 'solution' && solutionContent.length > 0 && (
                    <div className="prose prose-invert max-w-none text-gray-300">
                        {solutionContent.map((part, index) => {
                            switch (part.type) {
                                case 'text':
                                    return <MarkdownRenderer key={index} text={part.value} />;
                                case 'mcq':
                                    // FIX: Pass the hero prop to the MultipleChoice component.
                                    return <MultipleChoice key={index} {...part} widgetState={widgetStates[part.id] || {}} onAnswer={(isCorrect, ua) => handleWidgetAnswer(part.id, isCorrect, ua)} hero={hero} />;
                                default:
                                    return null;
                            }
                        })}
                    </div>
                )}
                
                {activeTab === 'graph' && functionToGraph && (
                    <GraphingCalculator functionStr={functionToGraph} />
                )}
                
                {!isLoading && solutionContent.length === 0 && !error && (
                    <div className="flex justify-center items-center h-full text-center text-gray-500">
                        Your step-by-step solution and graph will appear here.
                    </div>
                )}
                <div ref={solutionEndRef}></div>
            </div>
        </div>
    );
};

export default MathSolverView;
