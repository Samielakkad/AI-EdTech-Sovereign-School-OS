import React, { useState, useRef, useEffect, useMemo } from 'react';
// FIX: Import StudentProfile to add it to the component's props.
import { ChatMessage, ParsedContent, StudentProfile } from '../../types.ts';
import Button from '../common/Button.tsx';
import Select from '../common/Select.tsx';
import * as geminiService from '../../services/geminiService.ts';
import { LanguagesIcon } from '../icons/StudentIcons.tsx';
import { SendIcon } from '../icons/SettingsIcon.tsx';
import { parseInteractiveContent } from '../../utils/interactiveParser.ts';
import { FillInTheBlank, MultipleChoice } from './interactive/InteractiveWidgets.tsx';
// FIX: Import HEROES and Hero to determine the current hero theme.
import { HEROES, Hero } from '../../services/heroData.ts';

interface DisplayMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    content: ParsedContent[];
}

// --- Audio Helper Functions (as per guidelines) ---
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


interface LanguageTutorViewProps {
    // FIX: Add student prop to pass down hero theme information.
    student: StudentProfile;
    onBack: () => void;
}

const LanguageTutorView: React.FC<LanguageTutorViewProps> = ({ student, onBack }) => {
    const [language, setLanguage] = useState('Spanish');
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [audioPlaying, setAudioPlaying] = useState<string | null>(null); // message ID
    const [widgetStates, setWidgetStates] = useState<Record<string, any>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // FIX: Add hero object for theming interactive widgets.
    const hero: Hero = useMemo(() => HEROES.find(h => h.name === student.selectedHero) || HEROES[0], [student.selectedHero]);

    useEffect(() => {
        // Initialize AudioContext on first user interaction (or component mount)
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
    }, []);

    const handleWidgetAnswer = (widgetId: string, isCorrect: boolean, userAnswer: any) => {
        setWidgetStates(prev => ({ ...prev, [widgetId]: { submitted: true, isCorrect, userAnswer } }));
    };

    useEffect(() => {
        setMessages([{
            id: 'welcome-1',
            sender: 'ai',
            text: `¡Hola! Let's practice Spanish. What would you like to talk about?`,
            content: [{ type: 'text', value: `¡Hola! Let's practice Spanish. What would you like to talk about?` }]
        }]);
        setWidgetStates({});
    }, []);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value);
        setMessages([]); // Reset chat
        setWidgetStates({});
    };
    
    const handleSend = async (e: React.FormEvent, prompt?: string) => {
        e.preventDefault();
        const textToSend = prompt || userInput.trim();
        if (!textToSend || isLoading) return;

        const userMessage: DisplayMessage = { id: `user-${Date.now()}`, sender: 'user', text: textToSend, content: [{type: 'text', value: textToSend}] };
        const currentMessages = [...messages, userMessage];
        setMessages(currentMessages);
        setUserInput('');
        setIsLoading(true);

        const history: ChatMessage[] = currentMessages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        }));

        try {
            const stream = await geminiService.converseWithLanguageTutor(textToSend, history.slice(0, -1), language);
            
            const aiMessageId = `ai-${Date.now()}`;
            let fullText = '';
            setMessages(prev => [...prev, { id: aiMessageId, sender: 'ai', text: '', content: [] }]);
            
            for await (const chunk of stream) {
                fullText += chunk.text;
                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (lastMsg && lastMsg.id === aiMessageId) {
                        lastMsg.text = fullText;
                        lastMsg.content = [{ type: 'text', value: fullText }];
                    }
                    return newMsgs;
                });
            }

            setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: parseInteractiveContent(fullText, aiMessageId) } : m));

        } catch (error) {
            console.error("Language Tutor error:", error);
            setMessages(prev => [...prev, { id: `err-${Date.now()}`, sender: 'ai', text: "Sorry, I encountered an error.", content: [{type: 'text', value: "Sorry, I encountered an error."}] }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const playAudio = async (text: string, messageId: string) => {
        if (!audioContextRef.current || audioPlaying) return;
        setAudioPlaying(messageId);
        try {
            const base64Audio = await geminiService.getTtsAudio(text, language);
            const audioData = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => setAudioPlaying(null);
            source.start();
        } catch (error) {
            console.error("Failed to play audio:", error);
            setAudioPlaying(null);
        }
    };

    const scenarioPrompts = ["Practice ordering food", "Talk about my hobbies", "Ask for directions"];

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 h-full flex flex-col">
            <Button onClick={onBack} variant="secondary" className="mb-6 self-start">&larr; Back to Learning Hub</Button>
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                 <h2 className="text-2xl font-bold flex items-center gap-3">
                    <LanguagesIcon className="w-7 h-7 text-indigo-400" />
                    AI Language Tutor
                </h2>
                <div className="w-full md:w-64">
                    <Select label="Practice Language" value={language} onChange={handleLanguageChange}>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="Mandarin Chinese">Mandarin Chinese</option>
                        <option value="German">German</option>
                        <option value="Japanese">Japanese</option>
                    </Select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-900/50 rounded-lg p-6 border border-gray-700 min-h-[400px] flex flex-col">
                <div className="flex-1 space-y-4 pr-2">
                     {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xl p-3 rounded-xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                               {msg.content.map((part, index) => {
                                    switch (part.type) {
                                        case 'text':
                                            return <span key={index}>{part.value}</span>;
                                        case 'fill_in_blank':
                                            // FIX: Pass the hero prop to the FillInTheBlank component.
                                            return <FillInTheBlank key={index} {...part} widgetState={widgetStates[part.id] || {}} onAnswer={(isCorrect, ua) => handleWidgetAnswer(part.id, isCorrect, ua)} hero={hero} />;
                                        case 'mcq':
                                            // FIX: Pass the hero prop to the MultipleChoice component.
                                            return <MultipleChoice key={index} {...part} widgetState={widgetStates[part.id] || {}} onAnswer={(isCorrect, ua) => handleWidgetAnswer(part.id, isCorrect, ua)} hero={hero} />;
                                        default:
                                            return null;
                                    }
                               })}
                            </div>
                            {msg.sender === 'ai' && msg.text && (
                                <button onClick={() => playAudio(msg.text, msg.id)} disabled={!!audioPlaying} className="p-2 rounded-full bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={audioPlaying === msg.id ? 'animate-pulse text-yellow-300' : 'text-white'}>
                                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                    {isLoading && <div className="text-center text-gray-400">Thinking...</div>}
                    <div ref={messagesEndRef}></div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-700">
                    {messages.length === 0 && (
                        <div className="flex flex-wrap gap-2 mb-4 justify-center">
                            {scenarioPrompts.map((prompt, i) => (
                                <button key={i} onClick={(e) => handleSend(e as any, prompt)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 py-1.5 px-3 rounded-full transition-colors">
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}
                    <form onSubmit={handleSend} className="flex gap-4">
                        <input
                            type="text"
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            placeholder={`Type in ${language} or English...`}
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white"
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading || !userInput.trim()}><SendIcon className="w-5 h-5"/></Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LanguageTutorView;
