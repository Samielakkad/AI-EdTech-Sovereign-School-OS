import React, { useState, useRef, useEffect, useMemo } from 'react';
import Button from '../common/Button.tsx';
import Select from '../common/Select.tsx';
import * as geminiService from '../../services/geminiService.ts';
import { CodeIcon } from '../icons/StudentIcons.tsx';
import MarkdownRenderer from '../common/MarkdownRenderer.tsx';
// FIX: Import StudentProfile to add it to the component's props.
import { ParsedContent, StudentProfile } from '../../types.ts';
import { parseInteractiveContent } from '../../utils/interactiveParser.ts';
import { FillInTheBlank, MultipleChoice } from './interactive/InteractiveWidgets.tsx';
// FIX: Import HEROES and Hero to determine the current hero theme.
import { HEROES, Hero } from '../../services/heroData.ts';

interface AICoderViewProps {
    // FIX: Add student prop to pass down hero theme information.
    student: StudentProfile;
    onBack: () => void;
}

const AICoderView: React.FC<AICoderViewProps> = ({ student, onBack }) => {
    const [problem, setProblem] = useState('');
    const [language, setLanguage] = useState('JavaScript');
    const [solutionContent, setSolutionContent] = useState<ParsedContent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [widgetStates, setWidgetStates] = useState<Record<string, any>>({});
    const solutionEndRef = useRef<HTMLDivElement>(null);

    // FIX: Add hero object for theming interactive widgets.
    const hero: Hero = useMemo(() => HEROES.find(h => h.name === student.selectedHero) || HEROES[0], [student.selectedHero]);

    useEffect(() => {
        solutionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [solutionContent, isLoading]);

    const handleWidgetAnswer = (widgetId: string, isCorrect: boolean, userAnswer: any) => {
        setWidgetStates(prev => ({ ...prev, [widgetId]: { submitted: true, isCorrect, userAnswer } }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!problem.trim()) return;

        setIsLoading(true);
        setSolutionContent([]);
        setError(null);
        setWidgetStates({});

        try {
            const stream = await geminiService.solveCodeProblem(problem, language);
            let fullText = '';
            for await (const chunk of stream) {
                fullText += chunk.text;
                setSolutionContent([{ type: 'text', value: fullText }]);
            }
            setSolutionContent(parseInteractiveContent(fullText, `code-${Date.now()}`));

        } catch (err: any) {
            setError('An error occurred while generating the code. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 h-full flex flex-col">
            <Button onClick={onBack} variant="secondary" className="mb-6 self-start">&larr; Back to Learning Hub</Button>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <CodeIcon className="w-7 h-7 text-indigo-400" />
                AI Coder
            </h2>
            <p className="text-gray-400 mb-6">Enter a coding problem to get a complete solution and a simple, step-by-step explanation.</p>
            
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 mb-6">
                <input
                    type="text"
                    value={problem}
                    onChange={e => setProblem(e.target.value)}
                    placeholder="e.g., how to sort a list in Python"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg shadow-sm py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                    aria-label="Coding problem input"
                />
                 <Select 
                    label=""
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="!w-full md:!w-48"
                >
                    <option value="JavaScript">JavaScript</option>
                    <option value="Python">Python</option>
                    <option value="HTML">HTML</option>
                    <option value="CSS">CSS</option>
                </Select>
                <Button type="submit" disabled={isLoading || !problem.trim()} className="!px-6 !py-3">
                    {isLoading ? 'Generating...' : 'Get Solution'}
                </Button>
            </form>

            <div className="flex-1 overflow-y-auto bg-gray-900/50 rounded-lg p-6 border border-gray-700 min-h-[400px]">
                {isLoading && solutionContent.length === 0 && (
                    <div className="flex justify-center items-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
                            <p className="text-gray-400">Generating code and explanation...</p>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="text-center text-red-400">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}

                {solutionContent.length > 0 && (
                    <div className="prose prose-invert max-w-none text-gray-300">
                         {solutionContent.map((part, index) => {
                            switch (part.type) {
                                case 'text':
                                    return <MarkdownRenderer key={index} text={part.value} />;
                                case 'mcq':
                                    // FIX: Pass the hero prop to the MultipleChoice component.
                                    return <MultipleChoice key={index} {...part} widgetState={widgetStates[part.id] || {}} onAnswer={(isCorrect, ua) => handleWidgetAnswer(part.id, isCorrect, ua)} hero={hero} />;
                                case 'fill_in_blank':
                                    // FIX: Pass the hero prop to the FillInTheBlank component.
                                    return <FillInTheBlank key={index} {...part} widgetState={widgetStates[part.id] || {}} onAnswer={(isCorrect, ua) => handleWidgetAnswer(part.id, isCorrect, ua)} hero={hero} />;
                                default:
                                    return null;
                            }
                        })}
                    </div>
                )}
                
                {!isLoading && solutionContent.length === 0 && !error && (
                    <div className="flex justify-center items-center h-full text-center text-gray-500">
                        Your code solution and explanation will appear here.
                    </div>
                )}
                <div ref={solutionEndRef}></div>
            </div>
        </div>
    );
};

export default AICoderView;
