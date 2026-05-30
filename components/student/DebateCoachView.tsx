import React, { useState, useRef, useEffect } from 'react';
import Button from '../common/Button.tsx';
import { BalanceScaleIcon } from '../icons/StudentIcons.tsx';
import { StudentProfile, ChatMessage } from '../../types.ts';
import * as geminiService from '../../services/geminiService.ts';
import MarkdownRenderer from '../common/MarkdownRenderer.tsx';

interface DebateCoachViewProps {
    onBack: () => void;
    student: StudentProfile;
}

const DEBATE_TOPICS = [
    "Should school uniforms be mandatory?",
    "Is social media more harmful than helpful?",
    "Should homework be banned?",
    "Are video games a form of art?",
    "Should all zoos be closed?",
];

const DebateArena: React.FC<{ student: StudentProfile; topic: string; onBack: () => void }> = ({ student, topic, onBack }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const systemInstruction = `You are a competitive but fair debate coach AI. You are debating a ${student.gradeLevel}th-grade student on the topic: "${topic}".
- You must take the OPPOSING stance to the user's first argument.
- Your goal is to challenge the student's arguments, point out logical fallacies, and encourage them to provide evidence, but in a respectful and educational way.
- Start the debate by presenting a strong opening argument for one side of the topic.
- Keep your arguments concise (2-3 paragraphs max).
- After each of the user's responses, provide a counter-argument.
- Address the user as "My opponent".`;
        
    useEffect(() => {
        const startDebate = async () => {
            setIsLoading(true);
            try {
                const stream = await geminiService.askSpecializedTutor("Present your opening argument.", [], systemInstruction);
                let fullText = '';
                for await (const chunk of stream) { fullText += chunk.text; }
                setMessages([{ role: 'model', parts: [{ text: fullText }] }]);
            } finally {
                setIsLoading(false);
            }
        };
        startDebate();
    }, [topic]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: userInput.trim() }] };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            const stream = await geminiService.askSpecializedTutor(userMessage.parts[0].text, newMessages, systemInstruction);
            let fullText = '';
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);
            for await (const chunk of stream) {
                fullText += chunk.text;
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length-1] = { role: 'model', parts: [{ text: fullText }] };
                    return updated;
                });
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="h-full flex flex-col">
            <Button onClick={onBack} variant="secondary" className="mb-4 self-start">&larr; Change Topic</Button>
            <h3 className="text-center font-bold text-xl mb-4 text-indigo-300">Debate Topic: "{topic}"</h3>
            <div className="flex-1 bg-gray-900/50 rounded-lg p-4 border border-gray-700 min-h-[300px] flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 w-full ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-rose-600'}`}>
                                {msg.role === 'user' ? student.name.charAt(0) : 'AI'}
                            </div>
                            <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-rose-600'}`}>
                                <MarkdownRenderer text={msg.parts[0].text} />
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="text-center text-gray-400">The AI is preparing its argument...</div>}
                    <div ref={messagesEndRef}></div>
                </div>
                 <form onSubmit={handleSend} className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
                    <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="State your argument..." className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white" disabled={isLoading || messages.length === 0} />
                    <Button type="submit" disabled={isLoading || !userInput.trim()}>Rebut</Button>
                </form>
            </div>
        </div>
    );
};

const DebateCoachView: React.FC<DebateCoachViewProps> = ({ onBack, student }) => {
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

    if (selectedTopic) {
        return <DebateArena student={student} topic={selectedTopic} onBack={() => setSelectedTopic(null)} />;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                    <BalanceScaleIcon className="w-8 h-8 text-teal-400" />
                    Debate Coach
                </h2>
                <Button onClick={onBack} variant="secondary">&larr; Back to Learning Hub</Button>
            </div>
            <p className="text-gray-400 mb-6">Practice your arguments! Pick a topic and go head-to-head with an AI opponent to sharpen your critical thinking skills.</p>
             <div className="flex-1 bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-center mb-6">Choose Your Debate Topic</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {DEBATE_TOPICS.map(topic => (
                        <Button key={topic} onClick={() => setSelectedTopic(topic)} className="!text-base !py-6 h-full text-center justify-center">
                            {topic}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DebateCoachView;
