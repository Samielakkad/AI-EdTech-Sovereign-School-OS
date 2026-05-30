import React, { useState, useRef, useEffect, useMemo } from 'react';
import Button from '../common/Button.tsx';
import { ScienceIcon, BeakerIcon } from '../icons/StudentIcons.tsx';
import { StudentProfile, ChatMessage as ApiChatMessage, ParsedContent } from '../../types.ts';
import * as geminiService from '../../services/geminiService.ts';
import { HEROES, Hero } from '../../services/heroData.ts';
import { parseInteractiveContent } from '../../utils/interactiveParser.ts';
import { FillInTheBlank, MultipleChoice, MatchingExercise, OrderingExercise, FindTheMistake } from './interactive/InteractiveWidgets.tsx';
import MarkdownRenderer from '../common/MarkdownRenderer.tsx';


interface DisplayMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    content: ParsedContent[];
}

interface ScienceLabViewProps {
    onBack: () => void;
    student: StudentProfile;
}

const ScienceLabView: React.FC<ScienceLabViewProps> = ({ onBack, student }) => {
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [widgetStates, setWidgetStates] = useState<Record<string, { userAnswer?: any; isCorrect?: boolean; submitted: boolean }>>({});

    const hero: Hero = useMemo(() => HEROES.find(h => h.name === student.selectedHero) || HEROES[0], [student.selectedHero]);

    useEffect(() => {
        setMessages([
            {
                id: 'welcome-lab',
                sender: 'ai',
                text: `Welcome to my Science Lab, ${student.name.split(' ')[0]}! I'm ${hero.name}. What scientific mystery shall we unravel today?`,
                content: [{ type: 'text', value: `Welcome to my Science Lab, ${student.name.split(' ')[0]}! I'm ${hero.name}. What scientific mystery shall we unravel today?` }]
            }
        ]);
    }, [hero.name, student.name]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleWidgetAnswer = (widgetId: string, isCorrect: boolean, userAnswer: any) => {
        setWidgetStates(prev => ({ ...prev, [widgetId]: { submitted: true, isCorrect, userAnswer } }));
    };

    const handleMatchingAnswer = (widgetId: string, result: { matches: Record<string, string>; correctCount: number; total: number }) => {
        setWidgetStates(prev => ({
            ...prev,
            [widgetId]: {
                submitted: true,
                isCorrect: result.correctCount === result.total,
                userAnswer: result
            }
        }));
    };
    
    const handleOrderingAnswer = (widgetId: string, isCorrect: boolean, userOrder: string[]) => {
        setWidgetStates(prev => ({ ...prev, [widgetId]: { submitted: true, isCorrect, userAnswer: userOrder } }));
    };

    const handleSend = async (e: React.FormEvent, question?: string) => {
        e.preventDefault();
        const textToSend = question || userInput;
        if (!textToSend.trim() || isLoading) return;

        const userMessage: DisplayMessage = { id: `user-${Date.now()}`, sender: 'user', text: textToSend.trim(), content: [{type: 'text', value: textToSend.trim()}] };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        const history: ApiChatMessage[] = newMessages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{text: m.text}]
        }));
        
        const systemInstruction = `You are an educational AI assistant who embodies a specific character to make learning fun for a ${student.gradeLevel}th grade student in a virtual science lab.

YOUR CURRENT PERSONA:
- Character: ${hero.name}
- Description: ${hero.description}
- You MUST speak, act, and respond in the voice and personality of this character. Stay in character at all times.

YOUR SCIENCE LAB MENTOR STYLE:
- Your persona is a science mentor IN A VIRTUAL LAB. Frame every response as if you are in a lab together.
- Your primary teaching method is through IMAGINARY EXPERIMENTS. Instead of just explaining a concept, you should say "Let's try a virtual experiment!" and describe the steps.
- For example, if asked about chemistry, say: "Welcome to my lab! Let's imagine we have a virtual cabbage. We can make a potion from it that changes color when we add lemon juice!"
- After your explanation and experiment description, you MUST check for understanding using an interactive widget. Use one of the following formats EXACTLY:

1.  **Fill-in-the-Blank:** [FILL_IN_BLANK:The answer is {correct_answer} here].
2.  **Multiple Choice:** [MULTIPLE_CHOICE:Question?|Correct Answer|Wrong Answer|Wrong Answer]
3.  **Matching Exercise:** [MATCHING:Match the term to its definition.|Term A=Definition A|Term B=Definition B|Term C=Definition C]
4.  **Ordering Exercise:** [ORDERING:Put these in order.|First Item|Second Item|Third Item]
5.  **Find the Mistake:** [FIND_THE_MISTAKE:The sun revolves around the {Earth}.|The Earth revolves around the Sun.]

- Use a variety of these widgets to make the conversation interactive.
- Keep responses concise. If a visual is helpful, describe it like this: [IMAGE: A simple diagram of a virtual volcano erupting].
`;

        try {
            const stream = await geminiService.askSpecializedTutor(textToSend, history.slice(0, -1), systemInstruction);

            const aiMessageId = `ai-${Date.now()}`;
            let fullText = '';
            setMessages(prev => [...prev, { id: aiMessageId, sender: 'ai', text: '', content: [] }]);
            
            for await (const chunk of stream) {
                fullText += chunk.text;
                setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: fullText, content: [{type: 'text', value: fullText}] } : m));
            }

            setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: fullText, content: parseInteractiveContent(fullText, aiMessageId) } : m));

        } catch (error) {
            console.error("Science Lab Error:", error);
            const errorMessage: DisplayMessage = { id: `err-${Date.now()}`, sender: 'ai', text: "Sorry, I had an error in the lab. Please try again.", content: [{ type: 'text', value: "Sorry, I had an error in the lab. Please try again." }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const starterQuestions = [
        "What happens when you mix baking soda and vinegar?",
        "Explain photosynthesis",
        "How do volcanoes erupt?"
    ];

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className={`text-3xl font-bold flex items-center gap-3 ${hero.theme.accent}`}>
                    <ScienceIcon className="w-8 h-8"/>
                    {hero.name}'s Science Lab
                </h2>
                <Button onClick={onBack} variant="secondary">&larr; Back to Learning Hub</Button>
            </div>
            
            <div className={`flex-1 ${hero.theme.secondary} rounded-lg p-6 border border-gray-700 min-h-[400px] flex flex-col`}>
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                     {messages.length <= 1 && (
                        <div className="text-center text-gray-400 h-full flex flex-col justify-center">
                            <BeakerIcon className="w-24 h-24 mx-auto text-gray-600"/>
                            <p className="mt-4 font-semibold text-lg">Welcome to my lab! I'm {hero.name}.</p>
                            <p>What scientific mystery shall we unravel today?</p>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                             {msg.sender === 'ai' && (
                                <div className={`w-10 h-10 rounded-full ${hero.theme.primary} flex items-center justify-center flex-shrink-0 text-2xl text-white`}>
                                    {hero.avatar}
                                </div>
                            )}
                            <div className={`max-w-2xl p-4 rounded-xl ${msg.sender === 'user' ? `${hero.theme.userBubble} text-white` : `${hero.theme.primary} text-white`}`}>
                                {msg.content.map((part, index) => {
                                    switch (part.type) {
                                        case 'text':
                                            return <MarkdownRenderer key={index} text={part.value} />;
                                        case 'fill_in_blank':
                                            // FIX: Pass the hero prop to the FillInTheBlank component.
                                            return <FillInTheBlank key={index} {...part} widgetState={widgetStates[part.id] || {}} onAnswer={(isCorrect, ua) => handleWidgetAnswer(part.id, isCorrect, ua)} hero={hero} />;
                                        case 'mcq':
                                            // FIX: Pass the hero prop to the MultipleChoice component.
                                            return <MultipleChoice key={index} {...part} widgetState={widgetStates[part.id] || {}} onAnswer={(isCorrect, ua) => handleWidgetAnswer(part.id, isCorrect, ua)} hero={hero} />;
                                        case 'matching':
                                            return <MatchingExercise key={index} {...part} widgetState={widgetStates[part.id] || {}} onAnswer={(result) => handleMatchingAnswer(part.id, result)} hero={hero} />;
                                        case 'ordering':
                                            return <OrderingExercise key={index} {...part} widgetState={widgetStates[part.id] || {}} onAnswer={(isCorrect, ua) => handleOrderingAnswer(part.id, isCorrect, ua)} hero={hero} />;
                                        case 'find_the_mistake':
                                            return <FindTheMistake key={index} {...part} widgetState={widgetStates[part.id] || {}} onAnswer={(isCorrect) => handleWidgetAnswer(part.id, isCorrect, null)} hero={hero} />;
                                        default:
                                            return null;
                                    }
                                })}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-full ${hero.theme.primary} flex items-center justify-center flex-shrink-0 text-2xl text-white`}>
                                {hero.avatar}
                            </div>
                            <div className={`p-4 rounded-xl ${hero.theme.primary}`}>
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef}></div>
                </div>

                 <div className="mt-6 pt-4 border-t border-gray-700">
                     {messages.length <= 1 && (
                        <div className="flex flex-wrap gap-2 mb-4 justify-center">
                            {starterQuestions.map((q, i) => (
                                <button key={i} onClick={(e) => handleSend(e as any, q)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 py-1.5 px-3 rounded-full transition-colors">
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}
                    <form onSubmit={handleSend} className="flex gap-4">
                        <input
                            type="text"
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            placeholder={`Ask ${hero.name} a science question...`}
                            className="flex-1 bg-gray-900/50 border border-gray-600 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading || !userInput.trim()} className={hero.theme.primary}>Ask</Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ScienceLabView;
