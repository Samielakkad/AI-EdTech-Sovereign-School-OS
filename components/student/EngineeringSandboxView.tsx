import React, { useState, useRef, useEffect } from 'react';
import Button from '../common/Button.tsx';
// FIX: Corrected import path for `LightbulbIcon` and removed unused `EngineeringIcon`.
import { GearsIcon } from '../icons/StudentIcons.tsx';
import { LightbulbIcon } from '../icons/SettingsIcon.tsx';
import { StudentProfile, ChatMessage } from '../../types.ts';
import * as geminiService from '../../services/geminiService.ts';
import MarkdownRenderer from '../common/MarkdownRenderer.tsx';

interface EngineeringSandboxViewProps {
    onBack: () => void;
    student: StudentProfile;
}

const CHALLENGES = [
    "Design a device to safely drop an egg from a height of 10 feet without it breaking.",
    "Create a simple machine using household items to lift a book off the floor.",
    "Brainstorm a new type of renewable energy source that could power a small house.",
    "Design a small, personal water filtration system for camping.",
];

const EngineeringSandboxView: React.FC<EngineeringSandboxViewProps> = ({ onBack, student }) => {
    const [challenge] = useState(() => CHALLENGES[new Date().getDate() % CHALLENGES.length]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const systemInstruction = `You are an encouraging and creative AI engineering mentor for a ${student.gradeLevel}th-grade student.
- The student is working on the challenge: "${challenge}".
- Your goal is NOT to give the student the answer. Instead, you should guide their thinking process.
- Ask probing questions like "What materials could you use for that?", "How would you handle the impact?", "Have you considered the effect of wind?".
- If the student is stuck, offer a small hint or suggest a real-world concept to research (e.g., "Maybe look up how parachutes work.").
- Praise creative ideas and encourage experimentation in their thinking.`;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async (e: React.FormEvent, question?: string) => {
        e.preventDefault();
        const textToSend = question || userInput;
        if (!textToSend.trim() || isLoading) return;

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
    
    const hintPrompts = ["Give me a hint", "What materials could I use?", "What's the main scientific principle here?"];

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                    <GearsIcon className="w-8 h-8 text-indigo-400" />
                    Engineering Sandbox
                </h2>
                <Button onClick={onBack} variant="secondary">&larr; Back to Learning Hub</Button>
            </div>

            <div className="bg-gray-900/50 p-6 rounded-lg border border-indigo-700 mb-6">
                <h3 className="text-xl font-bold text-center text-indigo-300 mb-2">Challenge of the Day</h3>
                <p className="text-center text-gray-200 text-lg">{challenge}</p>
            </div>
            
            <div className="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col min-h-[400px]">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {messages.length === 0 && (
                         <div className="text-center text-gray-500 h-full flex flex-col justify-center">
                            <LightbulbIcon className="w-16 h-16 mx-auto"/>
                            <p className="mt-4 font-semibold">Start brainstorming your solution below!</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            <div className={`max-w-2xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                                <MarkdownRenderer text={msg.parts[0].text} />
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="text-center text-gray-400">Thinking...</div>}
                    <div ref={messagesEndRef}></div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                     {messages.length === 0 && (
                        <div className="flex flex-wrap gap-2 mb-4 justify-center">
                            {hintPrompts.map(q => ( <button key={q} onClick={(e) => handleSend(e as any, q)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 py-1.5 px-3 rounded-full">{q}</button>))}
                        </div>
                    )}
                    <form onSubmit={handleSend} className="flex gap-2">
                        <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="Brainstorm your ideas here..." className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white" disabled={isLoading} />
                        <Button type="submit" disabled={isLoading || !userInput.trim()}>Send</Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EngineeringSandboxView;