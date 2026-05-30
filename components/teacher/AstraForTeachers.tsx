import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, LessonPlan, ChatConversation } from '../../types.ts';
import Button from '../common/Button.tsx';
import * as geminiService from '../../services/geminiService.ts';
import * as chatHistoryService from '../../services/chatHistoryService.ts';
import { SparklesIcon, TrashIcon } from '../icons/SettingsIcon.tsx';
import MarkdownRenderer from '../common/MarkdownRenderer.tsx';

interface AstraForTeachersProps {
    lessonPlanContext: LessonPlan | null;
    useThinkingMode?: boolean;
    contextId: string;
}

interface DisplayMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    sources?: { uri: string; title: string }[];
}

const AstraForTeachers: React.FC<AstraForTeachersProps> = ({ lessonPlanContext, useThinkingMode = false, contextId }) => {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const loadConversations = () => {
        const convos = chatHistoryService.getConversations(contextId);
        setConversations(convos);
    };

    const getWelcomeMessage = () => {
       return useThinkingMode 
            ? "I'm in Thinking Mode, ready to tackle your most complex questions about pedagogy, curriculum design, or teaching strategies. What's on your mind?"
            : "Hello! I'm Professor Astra, your AI instructional coach. How can I help you refine this lesson plan or brainstorm new ideas?";
    }

    useEffect(() => {
        loadConversations();
        handleNewChat();
    }, [contextId, useThinkingMode]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleNewChat = () => {
        setCurrentConversationId(null);
        setMessages([{ id: 'welcome-1', sender: 'ai', text: getWelcomeMessage() }]);
    };

    const handleSelectConversation = (conversation: ChatConversation) => {
        setCurrentConversationId(conversation.id);
        setMessages(conversation.messages.map((msg, index) => ({
            id: `${conversation.id}-${index}`,
            sender: msg.role === 'user' ? 'user' : 'ai',
            text: msg.parts[0].text,
        })));
    };
    
    const handleDeleteConversation = (e: React.MouseEvent, conversationId: string) => {
        e.stopPropagation();
        chatHistoryService.deleteConversation(conversationId);
        if (currentConversationId === conversationId) {
            handleNewChat();
        }
        loadConversations();
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const newUserMessage: DisplayMessage = { id: `user-${Date.now()}`, sender: 'user', text: userInput.trim() };
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setUserInput('');
        setIsLoading(true);
        
        const history: ChatMessage[] = updatedMessages
            .filter(msg => msg.id.startsWith('welcome-') === false)
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

        try {
            const stream = useThinkingMode 
                ? await geminiService.askAstraWithThinking(newUserMessage.text, history.slice(0, -1), lessonPlanContext)
                : await geminiService.askAstraForTeachers(newUserMessage.text, history.slice(0, -1), lessonPlanContext);
            
            const aiMessageId = `ai-${Date.now()}`;
            let fullText = '';
            let finalSources: { uri: string; title: string }[] = [];
    
            setMessages(prev => [...prev, { id: aiMessageId, sender: 'ai', text: '', sources: [] }]);
    
            for await (const chunk of stream) {
                fullText += chunk.text;
    
                if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                    finalSources = chunk.candidates[0].groundingMetadata.groundingChunks
                        .map((c: any) => ({
                            uri: c.maps?.uri || c.web?.uri,
                            title: c.maps?.title || c.web?.title || c.maps?.uri || c.web?.uri,
                        }))
                        .filter((s: any) => s.uri && s.title);
                }
                
                setMessages(prev => prev.map(m => 
                    m.id === aiMessageId 
                        ? { ...m, text: fullText, sources: finalSources } 
                        : m
                ));
            }
            
            const finalAiMessage = { role: 'model', parts: [{ text: fullText }] } as ChatMessage;
            const finalHistory = [...history, finalAiMessage];
            const savedConvo = chatHistoryService.saveConversation(contextId, finalHistory, currentConversationId);
            setCurrentConversationId(savedConvo.id);
            loadConversations();

        } catch (error) {
             const errorAiMessage: DisplayMessage = { id: `ai-err-${Date.now()}`, sender: 'ai', text: "I'm sorry, I had a little trouble connecting. Please try again in a moment." };
            setMessages(prev => [...prev, errorAiMessage]);
            console.error("Failed to get AI response:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex h-full">
            <aside className="w-56 bg-gray-900/50 rounded-l-lg p-3 flex flex-col border-r border-gray-700">
                <Button onClick={handleNewChat} className="w-full mb-4">New Chat</Button>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {conversations.map(convo => (
                        <div key={convo.id} className="relative group">
                            <button
                                onClick={() => handleSelectConversation(convo)}
                                className={`w-full text-left p-2 rounded-md text-sm truncate ${currentConversationId === convo.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'}`}
                            >
                                {convo.title}
                            </button>
                            <button
                                onClick={(e) => handleDeleteConversation(e, convo.id)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Delete conversation"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </aside>
            <div className="flex-1 flex flex-col h-full pl-4">
                <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 font-bold text-sm">A</div>}
                            <div className={`max-w-xl p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                <MarkdownRenderer text={msg.text} />
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-4 pt-2 border-t border-gray-600">
                                        <h4 className="text-xs font-bold text-gray-400 mb-2">Sources:</h4>
                                        <ul className="space-y-1">
                                            {msg.sources.map((source, index) => (
                                                <li key={index}>
                                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-300 hover:underline break-all">
                                                        {index + 1}. {source.title || source.uri}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                             {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">You</div>}
                        </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.sender === 'user' && (
                         <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 font-bold text-sm">A</div>
                            <div className="max-w-xl p-4 rounded-2xl bg-gray-700 text-gray-200 rounded-bl-none">
                               <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse delay-0"></span>
                                    <span className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse delay-150"></span>
                                    <span className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse delay-300"></span>
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
                            placeholder="Ask for activity ideas, differentiation strategies..."
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg shadow-sm py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isLoading}
                            aria-label="Ask Professor Astra a question"
                        />
                        <Button type="submit" disabled={isLoading || !userInput.trim()} className="!px-6 !py-3">
                            Send
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AstraForTeachers;