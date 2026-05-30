import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatConversation } from '../../types.ts';
import * as chatHistoryService from '../../services/chatHistoryService.ts';
import * as geminiService from '../../services/geminiService.ts';
import Button from '../common/Button.tsx';
import { SparklesIcon, TrashIcon } from '../icons/SettingsIcon.tsx';
import MarkdownRenderer from '../common/MarkdownRenderer.tsx';

interface DisplayMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
}

const AICopilotView: React.FC = () => {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const contextId = 'admin-copilot';

    const loadConversations = () => {
        setConversations(chatHistoryService.getConversations(contextId));
    };

    useEffect(() => {
        loadConversations();
        handleNewChat();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleNewChat = () => {
        setCurrentConversationId(null);
        setMessages([{ id: 'welcome-1', sender: 'ai', text: "Hello! As the Admin AI Copilot, I can help you analyze school data, draft communications, and gain insights. How can I assist you today?" }]);
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

    const handleSend = async (e: React.FormEvent, prompt?: string) => {
        e.preventDefault();
        const textToSend = prompt || userInput.trim();
        if (!textToSend || isLoading) return;

        const newUserMessage: DisplayMessage = { id: `user-${Date.now()}`, sender: 'user', text: textToSend };
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
            const stream = await geminiService.askAdminCopilot(textToSend, history.slice(0, -1));
            
            const aiMessageId = `ai-${Date.now()}`;
            let fullText = '';
            setMessages(prev => [...prev, { id: aiMessageId, sender: 'ai', text: '' }]);

            for await (const chunk of stream) {
                fullText += chunk.text;
                setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: fullText } : m));
            }

            const finalAiMessage = { role: 'model', parts: [{ text: fullText }] } as ChatMessage;
            const finalHistory = [...history, finalAiMessage];
            const savedConvo = chatHistoryService.saveConversation(contextId, finalHistory, currentConversationId);
            setCurrentConversationId(savedConvo.id);
            loadConversations();

        } catch (error) {
            console.error("AI Copilot Error:", error);
            setMessages(prev => [...prev, { id: `err-${Date.now()}`, sender: 'ai', text: "Sorry, I encountered an error processing your request." }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const suggestionChips = [
        "Generate a fairness and equity report based on recent incident data",
        "Identify students who might need additional support",
        "Draft a school-wide announcement about upcoming parent-teacher conferences",
    ];

    return (
        <div className="p-6 h-full flex flex-col">
            <header className="mb-6">
                <h1 className="text-3xl font-bold">Admin AI Copilot</h1>
                <p className="text-gray-400">Your conversational partner for administrative insights and efficiency.</p>
            </header>

            <div className="flex-1 bg-gray-800 rounded-lg shadow-lg flex min-h-0">
                <aside className="w-64 bg-gray-900/50 rounded-l-lg p-3 flex flex-col border-r border-gray-700">
                    <Button onClick={handleNewChat} className="w-full mb-4">New Conversation</Button>
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
                <main className="flex-1 flex flex-col p-4">
                    <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 font-bold text-sm"><SparklesIcon className="w-5 h-5"/></div>}
                                <div className={`max-w-2xl p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                    <MarkdownRenderer text={msg.text} />
                                </div>
                                {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">You</div>}
                            </div>
                        ))}
                        {isLoading && <div className="text-center text-gray-400">Thinking...</div>}
                        <div ref={messagesEndRef}></div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700">
                         {messages.length <= 1 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {suggestionChips.map((chip, i) => (
                                    <button key={i} onClick={(e) => handleSend(e, chip)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 py-1.5 px-3 rounded-full transition-colors">
                                        {chip}
                                    </button>
                                ))}
                            </div>
                        )}
                        <form onSubmit={handleSend} className="flex gap-4">
                            <input
                                type="text"
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                placeholder="Ask about school data, draft an email, or get insights..."
                                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white"
                                disabled={isLoading}
                            />
                            <Button type="submit" disabled={isLoading || !userInput.trim()}>Send</Button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AICopilotView;