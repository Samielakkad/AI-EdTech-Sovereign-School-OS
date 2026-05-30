import React, { useState, useEffect, useRef } from 'react';
import { StudentProfile, ChatMessage } from '../../types.ts';
import * as courseSummaryService from '../../services/courseSummaryService.ts';
import { CourseSummary } from '../../services/courseSummaryService.ts';
import * as geminiService from '../../services/geminiService.ts';
import Button from '../common/Button.tsx';
import { GraduationCapIcon, MessageCircleIcon } from '../icons/StudentIcons.tsx';
import { DownloadIcon } from '../icons/SettingsIcon.tsx';

declare const jspdf: any;

const SummaryQnA: React.FC<{ summary: CourseSummary }> = ({ summary }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
        
        const context = `Topic: ${summary.topic}\n\nSummary:\n${summary.summary}\n\nFull Transcription:\n${summary.transcription}`;

        try {
            const aiResponseText = await geminiService.answerFromSummary(userMessage.parts[0].text, context, newMessages);
            const aiMessage: ChatMessage = { role: 'model', parts: [{ text: aiResponseText }] };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
             const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "Sorry, I had an error. Please try again." }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-900/50 rounded-lg p-4 mt-6 flex flex-col h-96">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-indigo-300">
                <MessageCircleIcon /> Ask a Question About This Lesson
            </h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                 {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        <div className={`max-w-md p-3 rounded-xl ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                           <p className="text-sm whitespace-pre-wrap">{msg.parts[0].text}</p>
                        </div>
                    </div>
                ))}
                 {isLoading && (
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
             <form onSubmit={handleSend} className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    placeholder="e.g., What is evaporation?"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !userInput.trim()}>Send</Button>
            </form>
        </div>
    );
};


const ClassSummariesView: React.FC<{ student: StudentProfile }> = ({ student }) => {
    const [summaries, setSummaries] = useState<CourseSummary[]>([]);
    const [selectedSummary, setSelectedSummary] = useState<CourseSummary | null>(null);

    useEffect(() => {
        setSummaries(courseSummaryService.getSummaries());
    }, []);
    
    const handleDownloadPdf = (summary: CourseSummary) => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const maxWidth = doc.internal.pageSize.getWidth() - 80;
        let yPos = 60;
    
        doc.setFontSize(24);
        doc.text(summary.topic, 40, yPos);
        yPos += 20;
    
        doc.setFontSize(10);
        doc.setTextColor(156, 163, 175); // text-gray-400
        doc.text(`Lesson by ${summary.teacherName} on ${new Date(summary.timestamp).toLocaleDateString()}`, 40, yPos);
        yPos += 40;
    
        doc.setFontSize(16);
        doc.setTextColor(229, 231, 235); // text-gray-200
        doc.text("Summary", 40, yPos);
        yPos += 25;
    
        doc.setFontSize(12);
        const summaryText = doc.splitTextToSize(summary.summary, maxWidth);
        doc.text(summaryText, 40, yPos);
        yPos += (summaryText.length * 15) + 30;
    
        doc.setFontSize(16);
        doc.text("Full Transcription", 40, yPos);
        yPos += 25;
    
        doc.setFontSize(10);
        const transcriptionText = doc.splitTextToSize(summary.transcription, maxWidth);
        doc.text(transcriptionText, 40, yPos);
    
        doc.save(`${summary.topic.replace(/\s+/g, '_')}_Summary.pdf`);
    };

    if (selectedSummary) {
        return (
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                <Button variant="secondary" onClick={() => setSelectedSummary(null)} className="mb-4">&larr; Back to All Summaries</Button>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold text-indigo-300">{selectedSummary.topic}</h2>
                        <p className="text-sm text-gray-400">by {selectedSummary.teacherName} on {new Date(selectedSummary.timestamp).toLocaleDateString()}</p>
                    </div>
                     <Button onClick={() => handleDownloadPdf(selectedSummary)} variant="secondary" className="flex items-center gap-2">
                        <DownloadIcon className="w-4 h-4" /> Download PDF
                    </Button>
                </div>

                <div className="mt-6 bg-gray-700/50 p-4 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">Lesson Summary</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{selectedSummary.summary}</p>
                </div>

                <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-gray-400 hover:text-white">View Full Transcription</summary>
                    <div className="mt-2 bg-gray-900/50 p-4 rounded-lg max-h-60 overflow-y-auto">
                        <p className="text-gray-400 whitespace-pre-wrap font-mono text-xs">{selectedSummary.transcription}</p>
                    </div>
                </details>

                <SummaryQnA summary={selectedSummary} />
            </div>
        );
    }

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <GraduationCapIcon className="w-7 h-7 text-indigo-400" />
                Class Summaries
            </h2>
            {summaries.length > 0 ? (
                <div className="space-y-3">
                    {summaries.map(summary => (
                        <button 
                            key={summary.id} 
                            onClick={() => setSelectedSummary(summary)}
                            className="w-full text-left bg-gray-700/60 hover:bg-gray-700 transition-colors p-4 rounded-lg"
                        >
                            <h3 className="font-bold text-white">{summary.topic}</h3>
                            <p className="text-sm text-indigo-300">Taught by {summary.teacherName} on {new Date(summary.timestamp).toLocaleDateString()}</p>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <GraduationCapIcon className="w-16 h-16 mx-auto mb-4" />
                    <p>Your teacher hasn't shared any class summaries yet.</p>
                </div>
            )}
        </div>
    );
};

export default ClassSummariesView;
