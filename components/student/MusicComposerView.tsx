import React, { useState, useRef, useEffect } from 'react';
import Button from '../common/Button.tsx';
import Select from '../common/Select.tsx';
import { MusicIcon } from '../icons/StudentIcons.tsx';
import { StudentProfile, ChatMessage } from '../../types.ts';
import * as geminiService from '../../services/geminiService.ts';
import MarkdownRenderer from '../common/MarkdownRenderer.tsx';

interface MusicComposerViewProps {
    onBack: () => void;
    student: StudentProfile;
}

const TheoryQA: React.FC<{ student: StudentProfile }> = ({ student }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const systemInstruction = `You are a friendly and knowledgeable music theory professor explaining concepts to a ${student.gradeLevel}th grader.
- Explain concepts clearly with simple analogies.
- Use markdown for formatting, like bolding key terms.
- Keep responses concise and focused.`;
    
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
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Sorry, I'm a bit off-key right now. Please try again." }] }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const starterQuestions = ["What is a major scale?", "Explain chord progressions", "What's the difference between tempo and rhythm?"];

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        <div className={`max-w-2xl p-4 rounded-xl ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                            <MarkdownRenderer text={msg.parts[0].text}/>
                        </div>
                    </div>
                ))}
                {isLoading && <div className="text-center text-gray-400">Composing an answer...</div>}
                <div ref={messagesEndRef}></div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
                {messages.length === 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 justify-center">
                        {starterQuestions.map(q => ( <button key={q} onClick={(e) => handleSend(e as any, q)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 py-1.5 px-3 rounded-full">{q}</button>))}
                    </div>
                )}
                <form onSubmit={handleSend} className="flex gap-4">
                    <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="Ask a music theory question..." className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white" disabled={isLoading} />
                    <Button type="submit" disabled={isLoading || !userInput.trim()}>Ask</Button>
                </form>
            </div>
        </div>
    );
};

const MelodyMaker: React.FC<{ student: StudentProfile }> = ({ student }) => {
    const [mood, setMood] = useState('Happy');
    const [tempo, setTempo] = useState('Medium');
    const [instrument, setInstrument] = useState('Piano');
    const [melody, setMelody] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const systemInstruction = `You are a helpful and creative music AI. Your task is to generate a short, simple musical idea for a ${student.gradeLevel}th grader based on their input.
- Describe the melody in simple terms.
- Provide a simple text-based notation (e.g., C4 D4 E4 G4).
- Keep it short and inspiring.
- Use markdown for formatting.`;

    const handleGenerate = async () => {
        setIsLoading(true);
        setMelody('');
        const prompt = `Generate a short musical idea for a ${instrument} with a ${mood} mood and a ${tempo} tempo.`;
        try {
            const stream = await geminiService.askSpecializedTutor(prompt, [], systemInstruction);
            let fullText = '';
            for await (const chunk of stream) {
                fullText += chunk.text;
                setMelody(fullText);
            }
        } catch (error) {
            setMelody("Could not generate a melody. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="h-full flex flex-col items-center">
            <div className="w-full max-w-lg space-y-4">
                <Select label="Mood" value={mood} onChange={e => setMood(e.target.value)}>
                    <option>Happy</option><option>Sad</option><option>Energetic</option><option>Calm</option><option>Mysterious</option>
                </Select>
                <Select label="Tempo" value={tempo} onChange={e => setTempo(e.target.value)}>
                    <option>Slow</option><option>Medium</option><option>Fast</option>
                </Select>
                 <Select label="Instrument" value={instrument} onChange={e => setInstrument(e.target.value)}>
                    <option>Piano</option><option>Guitar</option><option>Violin</option><option>Flute</option><option>Drum Beat</option>
                </Select>
                <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                    {isLoading ? 'Composing...' : 'Generate Melody Idea'}
                </Button>
            </div>
            {(isLoading || melody) && (
                <div className="mt-6 w-full max-w-2xl bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                    {isLoading && !melody && <div className="text-center text-gray-400">Composing...</div>}
                    {melody && <MarkdownRenderer text={melody} />}
                </div>
            )}
        </div>
    );
};

const MusicComposerView: React.FC<MusicComposerViewProps> = ({ onBack, student }) => {
    const [activeTab, setActiveTab] = useState<'theory' | 'melody'>('theory');

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                    <MusicIcon className="w-8 h-8 text-rose-400" />
                    Music Composer
                </h2>
                <Button onClick={onBack} variant="secondary">&larr; Back to Learning Hub</Button>
            </div>
            
            <div className="border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setActiveTab('theory')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'theory' ? 'border-indigo-400 text-indigo-300' : 'border-transparent text-gray-400 hover:text-white'}`}>Theory Q&A</button>
                    <button onClick={() => setActiveTab('melody')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'melody' ? 'border-indigo-400 text-indigo-300' : 'border-transparent text-gray-400 hover:text-white'}`}>Melody Maker</button>
                </nav>
            </div>

            <div className="flex-1 bg-gray-800 rounded-lg shadow-lg p-6">
                {activeTab === 'theory' ? <TheoryQA student={student} /> : <MelodyMaker student={student} />}
            </div>
        </div>
    );
};

export default MusicComposerView;
