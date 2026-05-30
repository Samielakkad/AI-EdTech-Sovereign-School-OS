import React, { useState, useRef, useEffect } from 'react';
import { MessageCircleIcon } from '../icons/StudentIcons.tsx';
import { CloseIcon, SendIcon } from '../icons/SettingsIcon.tsx';
import { askSimpleChat } from '../../services/geminiService.ts';
// FIX: Import ChatMessage from types.ts with an alias to fix type error on history.
import { ChatMessage as ApiChatMessage } from '../../types.ts';

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{ sender: 'ai', text: "Hello! I'm your AI assistant. How can I help you today?" }]);
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { sender: 'user', text: userInput.trim() };
        const currentMessages = [...messages, newUserMessage];
        setMessages(currentMessages);
        setUserInput('');
        setIsLoading(true);
        
        try {
            const history: ApiChatMessage[] = currentMessages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }]
            }));

            const stream = await askSimpleChat(userInput.trim(), history);
            
            let aiResponseText = '';
            setMessages(prev => [...prev, { sender: 'ai', text: '' }]);

            for await (const chunk of stream) {
                aiResponseText += chunk;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = aiResponseText;
                    return newMessages;
                });
            }

        } catch (error) {
            console.error("Chatbot error:", error);
            setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-2xl z-[9998] transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
                aria-label={isOpen ? 'Close Chat' : 'Open Chat'}
            >
                {isOpen ? <CloseIcon className="w-8 h-8"/> : <MessageCircleIcon className="w-8 h-8" />}
            </button>
            
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-[90vw] max-w-md h-[70vh] bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl z-[9999] flex flex-col p-4">
                    <h2 className="text-xl font-bold text-white mb-4 flex-shrink-0">AI Assistant</h2>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                <div className={`max-w-xs p-3 rounded-xl whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                   {msg.text}
                                </div>
                            </div>
                        ))}
                         {isLoading && messages[messages.length - 1]?.sender === 'user' && (
                            <div className="flex items-start gap-3">
                                <div className="p-3 rounded-xl bg-gray-700">
                                   <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse delay-0"></span>
                                        <span className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse delay-150"></span>
                                        <span className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse delay-300"></span>
                                   </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef}></div>
                    </div>
                    <form onSubmit={handleSend} className="mt-4 flex gap-2 flex-shrink-0">
                        <input
                            type="text"
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            placeholder="Ask anything..."
                            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !userInput.trim()} className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white disabled:opacity-50">
                            <SendIcon className="w-5 h-5"/>
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default Chatbot;
