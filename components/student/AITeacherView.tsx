import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StudentProfile, ChatMessage, ChatConversation, ParsedContent } from '../../types.ts';
import Button from '../common/Button.tsx';
import * as geminiService from '../../services/geminiService.ts';
import * as chatHistoryService from '../../services/chatHistoryService.ts';
import { HEROES, Hero } from '../../services/heroData.ts';
import { TrashIcon, SendIcon, ExpandIcon, ShrinkIcon } from '../icons/SettingsIcon.tsx';
import { parseInteractiveContent } from '../../utils/interactiveParser.ts';
import { FillInTheBlank, MultipleChoice, MatchingExercise, OrderingExercise, FindTheMistake, CategorizationExercise } from './interactive/InteractiveWidgets.tsx';

interface DisplayMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    imageUrl?: string;
    imageIsLoading?: boolean;
    content: ParsedContent[];
}

interface AITeacherViewProps {
    student: StudentProfile;
}

const AITeacherView: React.FC<AITeacherViewProps> = ({ student }) => {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [widgetStates, setWidgetStates] = useState<Record<string, { userAnswer?: any; isCorrect?: boolean; submitted: boolean }>>({});
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const contextId = `student-${student.id}-astra`;

    const hero: Hero = useMemo(() => HEROES.find(h => h.name === student.selectedHero) || HEROES[0], [student.selectedHero]);

    const handleFullScreenChange = () => {
        setIsFullScreen(!!document.fullscreenElement);
    };

    useEffect(() => {
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, []);

    const toggleFullScreen = () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const loadConversations = () => {
        const convos = chatHistoryService.getConversations(contextId);
        setConversations(convos);
    };

    useEffect(() => {
        loadConversations();
        handleNewChat();
    }, [student.id, hero.name]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleNewChat = () => {
        setCurrentConversationId(null);
        setMessages([
            {
                id: 'welcome-new',
                sender: 'ai',
                text: `Hi ${student.name.split(' ')[0]}! I'm ${hero.name}. What are you curious about today?`,
                content: [{ type: 'text', value: `Hi ${student.name.split(' ')[0]}! I'm ${hero.name}. What are you curious about today?` }]
            }
        ]);
        setWidgetStates({});
    };

    const handleSelectConversation = (conversation: ChatConversation) => {
        setCurrentConversationId(conversation.id);
        const newMessages: DisplayMessage[] = conversation.messages.map((msg, index) => {
            const id = `${conversation.id}-${index}`;
            return {
                id: id,
                sender: msg.role === 'user' ? 'user' : 'ai',
                text: msg.parts[0].text,
                content: parseInteractiveContent(msg.parts[0].text, id)
            }
        });
        setMessages(newMessages);
        setWidgetStates({}); // Reset widget states for new convo
    };

    const handleDeleteConversation = (e: React.MouseEvent, conversationId: string) => {
        e.stopPropagation();
        chatHistoryService.deleteConversation(conversationId);
        if (currentConversationId === conversationId) handleNewChat();
        loadConversations();
    };
    
    const handleSend = async (e?: React.FormEvent, prompt?: string) => {
        e?.preventDefault();
        const textToSend = prompt || userInput.trim();
        if (!textToSend || isLoading) return;

        const newUserMessage: DisplayMessage = { id: `user-${Date.now()}`, sender: 'user', text: textToSend, content: [{ type: 'text', value: textToSend }] };
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setUserInput('');
        setIsLoading(true);
        
        const history: ChatMessage[] = updatedMessages
            .filter(msg => msg.id.startsWith('welcome') === false)
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

        try {
            const stream = await geminiService.askAITeacher(student, newUserMessage.text, history.slice(0, -1));

            const aiMessageId = `ai-${Date.now()}`;
            let fullText = '';
            
            setMessages(prev => [...prev, { id: aiMessageId, sender: 'ai', text: '', content: [] }]);

            for await (const chunk of stream) {
                fullText += chunk.text;
                setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: fullText, content: [{type: 'text', value: fullText}] } : m));
            }

            // Final parse after stream completes
            setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: fullText, content: parseInteractiveContent(fullText, aiMessageId) } : m));
            
            const finalAiMessage = { role: 'model', parts: [{ text: fullText }] } as ChatMessage;
            const finalHistory = [...history, finalAiMessage];
            const savedConvo = chatHistoryService.saveConversation(contextId, finalHistory, currentConversationId);
            
            if(!currentConversationId) {
                loadConversations();
            }
            setCurrentConversationId(savedConvo.id);
            
        } catch (error) {
            const errorAiMessage: DisplayMessage = { id: `ai-err-${Date.now()}`, sender: 'ai', text: "I'm sorry, I had a little trouble connecting. Please try again in a moment.", content: [{type: 'text', value: "I'm sorry, I had a little trouble connecting. Please try again in a moment." }] };
            setMessages(prev => [...prev, errorAiMessage]);
            console.error("Failed to get AI response:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleWidgetAnswer = async (widgetId: string, isCorrect: boolean, userAnswer: any) => {
        setWidgetStates(prev => ({ ...prev, [widgetId]: { submitted: true, isCorrect, userAnswer } }));
        if (!isCorrect) {
            // Automatically send a follow-up prompt for an explanation
            await handleSend(undefined, "I got that wrong, can you please explain it to me?");
        }
    };
    
    const handleComplexWidgetAnswer = async (widgetId: string, result: any) => {
        const isCorrect = result.correctCount === result.total;
        setWidgetStates(prev => ({
            ...prev,
            [widgetId]: {
                submitted: true,
                isCorrect,
                userAnswer: result
            }
        }));
        if (!isCorrect) {
            await handleSend(undefined, "I didn't get all of those right, can you explain the ones I missed?");
        }
    };
    
    const handleOrderingAnswer = async (widgetId: string, isCorrect: boolean, userOrder: string[]) => {
        setWidgetStates(prev => ({ ...prev, [widgetId]: { submitted: true, isCorrect, userAnswer: userOrder } }));
         if (!isCorrect) {
            await handleSend(undefined, "My order was incorrect, can you explain the right sequence?");
        }
    };

    return (
        <div ref={containerRef} className={`rounded-lg shadow-lg ${isFullScreen ? 'h-screen' : 'h-[80vh]'} flex ${hero.theme.secondary} border border-gray-700 relative fullscreen:bg-gray-800`}>
             <button
                onClick={toggleFullScreen}
                className="absolute top-4 right-4 z-20 p-3 text-white bg-indigo-600/70 hover:bg-indigo-500 rounded-full shadow-lg border-2 border-indigo-500/50 transition-colors"
                title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
            >
                {isFullScreen ? <ShrinkIcon className="w-6 h-6" /> : <ExpandIcon className="w-6 h-6" />}
            </button>
             <aside className="w-56 bg-gray-900/50 rounded-l-lg p-3 flex flex-col border-r border-gray-700">
                <Button onClick={handleNewChat} className="w-full mb-4">New Chat</Button>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {conversations.map(convo => (
                        <div key={convo.id} className="relative group">
                            <button
                                onClick={() => handleSelectConversation(convo)}
                                className={`w-full text-left p-2 rounded-md text-sm truncate ${currentConversationId === convo.id ? `${hero.theme.primary} text-white` : 'hover:bg-gray-700'}`}
                            >
                                {convo.title}
                            </button>
                             <button
                                onClick={(e) => handleDeleteConversation(e, convo.id)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100"
                                aria-label="Delete conversation"
                            > <TrashIcon className="w-4 h-4" /> </button>
                        </div>
                    ))}
                </div>
            </aside>
            <div className="flex-1 flex flex-col p-4">
                 <header className={`flex items-center gap-4 pb-4 border-b border-gray-700/50 flex-shrink-0 ${hero.theme.accent}`}>
                    <div className={`w-12 h-12 rounded-full ${hero.theme.primary} flex items-center justify-center flex-shrink-0 text-3xl border-2 border-current text-white`}>
                        {hero.avatar}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{hero.name}</h2>
                        <p className="text-sm">{hero.description}</p>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto pr-4 space-y-6 pt-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && (
                                <div className={`w-8 h-8 rounded-full ${hero.theme.primary} flex items-center justify-center flex-shrink-0 text-xl text-white`}>
                                    {hero.avatar}
                                </div>
                            )}
                            <div className={`max-w-xl p-4 rounded-2xl ${msg.sender === 'user' ? `${hero.theme.userBubble} text-white rounded-br-none` : `${hero.theme.primary} text-white rounded-bl-none`}`}>
                                 {msg.content.map((part, index) => {
                                    switch (part.type) {
                                        case 'text':
                                            return <span key={index}>{part.value}</span>;
                                        case 'fill_in_blank':
                                            return <FillInTheBlank key={index} {...part} widgetState={widgetStates[part.id] || {}} onAnswer={(isCorrect, ua) => handleWidgetAnswer(part.id, isCorrect, ua)} hero={hero} />;
                                        case 'mcq':
                                            return <MultipleChoice key={index} {...part} widgetState={widgetStates[part.id] || {}} onAnswer={(isCorrect, ua) => handleWidgetAnswer(part.id, isCorrect, ua)} hero={hero} />;
                                        case 'matching':
                                            return <MatchingExercise key={index} {...part} widgetState={widgetStates[part.id] || {}} onAnswer={(result) => handleComplexWidgetAnswer(part.id, result)} hero={hero} />;
                                        case 'ordering':
                                            return <OrderingExercise key={index} {...part} widgetState={widgetStates[part.id] || {}} onAnswer={(isCorrect, ua) => handleOrderingAnswer(part.id, isCorrect, ua)} hero={hero} />;
                                        case 'find_the_mistake':
                                            return <FindTheMistake key={index} {...part} widgetState={widgetStates[part.id] || {}} onAnswer={(isCorrect) => handleWidgetAnswer(part.id, isCorrect, null)} hero={hero} />;
                                        case 'categorization':
                                            return <CategorizationExercise key={index} {...part} widgetState={widgetStates[part.id] || {}} onAnswer={(result) => handleComplexWidgetAnswer(part.id, result)} hero={hero} />;
                                        default:
                                            return null;
                                    }
                                 })}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-end gap-3">
                            <div className={`w-8 h-8 rounded-full ${hero.theme.primary} flex items-center justify-center flex-shrink-0 text-xl text-white`}>
                                {hero.avatar}
                            </div>
                            <div className={`max-w-xl p-4 rounded-2xl ${hero.theme.primary} rounded-bl-none`}>
                               <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 ${hero.theme.userBubble} rounded-full animate-pulse delay-0`}></span>
                                    <span className={`w-2 h-2 ${hero.theme.userBubble} rounded-full animate-pulse delay-150`}></span>
                                    <span className={`w-2 h-2 ${hero.theme.userBubble} rounded-full animate-pulse delay-300`}></span>
                               </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="mt-6 flex-shrink-0">
                    <form onSubmit={handleSend} className="flex gap-4">
                        <input
                            type="text"
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            placeholder={`Ask ${hero.name} a question...`}
                            className="flex-1 bg-gray-900/50 border border-gray-600 rounded-lg shadow-sm py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isLoading}
                            aria-label="Ask the AI Teacher a question"
                        />
                        <button type="submit" disabled={isLoading || !userInput.trim()} className={`p-3 ${hero.theme.primary} hover:opacity-80 rounded-lg text-white disabled:opacity-50`}>
                            <SendIcon className="w-6 h-6"/>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AITeacherView;