import React, { useState, useRef, useEffect } from 'react';
import Button from '../common/Button.tsx';
import { HistoryIcon, TimelineIcon } from '../icons/StudentIcons.tsx';
import { StudentProfile, ChatMessage } from '../../types.ts';
import * as geminiService from '../../services/geminiService.ts';
import MarkdownRenderer from '../common/MarkdownRenderer.tsx';

interface HistoryExplorerViewProps {
    onBack: () => void;
    student: StudentProfile;
}

const ERAS = [
    "Ancient Egypt",
    "Ancient Greece",
    "Ancient Rome",
    "The Middle Ages",
    "The Renaissance",
    "The Age of Exploration",
    "The Industrial Revolution",
    "World War II",
];

const HistoryExplorerView: React.FC<HistoryExplorerViewProps> = ({ onBack, student }) => {
    const [selectedEra, setSelectedEra] = useState("Ancient Rome");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const systemInstruction = `You are an expert historian specializing in ${selectedEra}. You are teaching a ${student.gradeLevel}th-grade student.
- Your goal is to answer questions about this historical period accurately and engagingly.
- Use clear, age-appropriate language.
- When relevant, use markdown to format your answers with lists or bold text to improve readability.
- Keep your answers focused on the selected era of ${selectedEra}. If asked about a different era, gently guide the student back.`;

    useEffect(() => {
        setMessages([]); // Reset chat when era changes
    }, [selectedEra]);

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
            let aiMessage: ChatMessage = { role: 'model', parts: [{ text: '' }] };
            setMessages(prev => [...prev, aiMessage]);
            
            for await (const chunk of stream) {
                fullText += chunk.text;
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length-1] = { role: 'model', parts: [{ text: fullText }] };
                    return updated;
                });
            }

        } catch (error) {
            console.error("History Explorer Error:", error);
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "Sorry, I'm having trouble accessing my archives. Please try again." }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const starterQuestions: Record<string, string[]> = {
        "Ancient Rome": ["Who was Julius Caesar?", "What was the Colosseum used for?", "Tell me about Roman gods."],
        "Ancient Egypt": ["Why did they build pyramids?", "Who was Cleopatra?", "What are hieroglyphics?"],
        "The Renaissance": ["Who was Leonardo da Vinci?", "What does 'Renaissance' mean?", "Tell me about the art."],
        "World War II": ["What started the war?", "Who were the main leaders?", "What was D-Day?"],
        "default": ["Tell me a fun fact about this era.", "Who was the most important person?", "What was daily life like?"]
    };
    
    const currentStarters = starterQuestions[selectedEra] || starterQuestions.default;
    
    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                    <HistoryIcon className="w-8 h-8 text-purple-400" />
                    History Explorer
                </h2>
                <Button onClick={onBack} variant="secondary">&larr; Back to Learning Hub</Button>
            </div>
            
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Select a Historical Era</label>
                <div className="flex overflow-x-auto space-x-2 pb-2 -mx-6 px-6">
                {ERAS.map(era => (
                    <button
                        key={era}
                        onClick={() => setSelectedEra(era)}
                        className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${selectedEra === era ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                        {era}
                    </button>
                ))}
                </div>
            </div>

            <div className="flex-1 bg-gray-900/50 rounded-lg p-6 border border-gray-700 min-h-[400px] flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-400 h-full flex flex-col justify-center">
                            <TimelineIcon className="w-24 h-24 mx-auto text-gray-600"/>
                            <p className="mt-4 font-semibold text-lg">Exploring: {selectedEra}</p>
                            <p>Ask a question to begin your journey through time.</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                             {msg.role === 'model' && (
                                <div className="w-10 h-10 rounded-full bg-purple-500/80 flex items-center justify-center flex-shrink-0">
                                    <HistoryIcon className="w-6 h-6"/>
                                </div>
                            )}
                            <div className={`max-w-2xl p-4 rounded-xl ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                                <MarkdownRenderer text={msg.parts[0].text}/>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-500/80 flex items-center justify-center flex-shrink-0">
                                <HistoryIcon className="w-6 h-6"/>
                            </div>
                            <div className="p-4 rounded-xl bg-gray-700">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef}></div>
                </div>

                 <div className="mt-6 pt-4 border-t border-gray-700">
                     {messages.length === 0 && (
                        <div className="flex flex-wrap gap-2 mb-4 justify-center">
                            {currentStarters.map((q, i) => (
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
                            placeholder={`Ask a question about ${selectedEra}...`}
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white"
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading || !userInput.trim()}>Ask</Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default HistoryExplorerView;
