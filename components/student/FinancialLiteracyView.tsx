import React, { useState, useRef, useEffect } from 'react';
import Button from '../common/Button.tsx';
import { PiggyBankIcon } from '../icons/StudentIcons.tsx';
import { StudentProfile, ChatMessage } from '../../types.ts';
import * as geminiService from '../../services/geminiService.ts';
import MarkdownRenderer from '../common/MarkdownRenderer.tsx';

interface FinancialLiteracyViewProps {
    onBack: () => void;
    student: StudentProfile;
}

const TOPICS = {
    Budgeting: {
        description: "Learn how to plan where your money goes.",
        starters: ["What is a budget?", "Why should I make a budget?", "How do I start a budget?"]
    },
    Saving: {
        description: "Discover the importance of saving money for the future.",
        starters: ["Why is saving money important?", "What's a good way to save?", "What's the difference between saving and investing?"]
    },
    "Smart Spending": {
        description: "Understand needs vs. wants and how to make good choices.",
        starters: ["What's the difference between a need and a want?", "How can I avoid impulse buying?", "How do sales work?"]
    },
    Earning: {
        description: "Explore different ways people can earn money.",
        starters: ["What are some ways kids can earn money?", "What is a salary?", "What is an entrepreneur?"]
    }
};

type Topic = keyof typeof TOPICS;

const FinancialLiteracyView: React.FC<FinancialLiteracyViewProps> = ({ onBack, student }) => {
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const systemInstruction = `You are a friendly and clear financial advisor for a ${student.gradeLevel}th grader.
- You are discussing the topic of: "${selectedTopic}".
- Explain concepts using simple, relatable examples for a child. For example, compare a budget to a plan for spending allowance.
- Keep answers encouraging and positive.
- Use markdown for formatting.`;

    useEffect(() => {
        setMessages([]);
        setUserInput('');
    }, [selectedTopic]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async (e: React.FormEvent, question?: string) => {
        e.preventDefault();
        const textToSend = question || userInput;
        if (!textToSend.trim() || isLoading || !selectedTopic) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: textToSend.trim() }] };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            const stream = await geminiService.askSpecializedTutor(textToSend, newMessages, systemInstruction);
            let fullText = '';
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);
            for await (const chunk of stream) {
                fullText += chunk.text;
                 setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'model', parts: [{ text: fullText }] };
                    return updated;
                });
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                    <PiggyBankIcon className="w-8 h-8 text-teal-400" />
                    Financial Literacy
                </h2>
                <Button onClick={onBack} variant="secondary">&larr; Back to Learning Hub</Button>
            </div>
            
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-1 flex flex-col gap-4">
                    {Object.entries(TOPICS).map(([title, data]) => (
                        <button key={title} onClick={() => setSelectedTopic(title as Topic)} className={`p-4 rounded-lg text-left transition-colors w-full border-2 ${selectedTopic === title ? 'bg-indigo-600 border-indigo-400' : 'bg-gray-700 border-transparent hover:bg-gray-600'}`}>
                            <h4 className="font-bold text-lg">{title}</h4>
                            <p className="text-sm text-gray-300">{data.description}</p>
                        </button>
                    ))}
                </div>
                <div className="lg:col-span-2 bg-gray-900/50 rounded-lg p-4 border border-gray-700 flex flex-col">
                    {!selectedTopic ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <PiggyBankIcon className="w-20 h-20 mb-4"/>
                            <p className="font-semibold">Select a topic to get started!</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                        <div className={`max-w-full p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                                            <MarkdownRenderer text={msg.parts[0].text} />
                                        </div>
                                    </div>
                                ))}
                                {isLoading && <div className="text-center text-gray-400">Thinking...</div>}
                                <div ref={messagesEndRef}></div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                                    {TOPICS[selectedTopic].starters.map(q => ( <button key={q} onClick={(e) => handleSend(e as any, q)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 py-1.5 px-3 rounded-full">{q}</button>))}
                                </div>
                                <form onSubmit={handleSend} className="flex gap-2">
                                    <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} placeholder={`Ask about ${selectedTopic}...`} className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white" disabled={isLoading} />
                                    <Button type="submit" disabled={isLoading || !userInput.trim()}>Ask</Button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinancialLiteracyView;
