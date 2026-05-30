import React, { useState, useRef, useEffect } from 'react';
import Button from '../common/Button.tsx';
import { LiteratureIcon, BookshelfIcon } from '../icons/StudentIcons.tsx';
import { StudentProfile, ChatMessage } from '../../types.ts';
import * as geminiService from '../../services/geminiService.ts';
import MarkdownRenderer from '../common/MarkdownRenderer.tsx';

interface LiteratureCompanionViewProps {
    onBack: () => void;
    student: StudentProfile;
}

const BOOKS = [
    { title: "To Kill a Mockingbird", author: "Harper Lee" },
    { title: "1984", author: "George Orwell" },
    { title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
    { title: "Pride and Prejudice", author: "Jane Austen" },
];

const BookChatView: React.FC<{ student: StudentProfile; book: { title: string, author: string }; onBack: () => void }> = ({ student, book, onBack }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const systemInstruction = `You are an expert literary analyst specializing in "${book.title}" by ${book.author}. You are helping a ${student.gradeLevel}th-grade student.
- Your goal is to answer questions about this book's plot, characters, themes, and literary devices.
- Use clear, age-appropriate language.
- Provide insightful analysis but avoid simply giving away answers for homework. Guide the student to think critically.
- Use markdown to format your answers.`;

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
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "Sorry, I'm having trouble accessing my library. Please try again." }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const starterQuestions = [ `Summarize Chapter 1 of ${book.title}`, `Analyze the main character`, `What are the major themes?`];

    return (
        <div className="h-full flex flex-col">
            <Button onClick={onBack} variant="secondary" className="mb-6 self-start">&larr; Back to Bookshelf</Button>
            <div className="flex-1 bg-gray-900/50 rounded-lg p-6 border border-gray-700 min-h-[400px] flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                    {messages.length === 0 && (
                         <div className="text-center text-gray-400 h-full flex flex-col justify-center">
                            <LiteratureIcon className="w-24 h-24 mx-auto text-gray-600"/>
                            <p className="mt-4 font-semibold text-lg">Discussing: "{book.title}"</p>
                            <p>Ask a question to begin analyzing the book.</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && (
                                <div className="w-10 h-10 rounded-full bg-purple-500/80 flex items-center justify-center flex-shrink-0">
                                    <LiteratureIcon className="w-6 h-6"/>
                                </div>
                            )}
                            <div className={`max-w-2xl p-4 rounded-xl ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                                <MarkdownRenderer text={msg.parts[0].text}/>
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="text-center text-gray-400">Thinking...</div>}
                    <div ref={messagesEndRef}></div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-700">
                    {messages.length === 0 && (
                        <div className="flex flex-wrap gap-2 mb-4 justify-center">
                            {starterQuestions.map((q, i) => (
                                <button key={i} onClick={(e) => handleSend(e as any, q)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 py-1.5 px-3 rounded-full transition-colors">
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}
                    <form onSubmit={handleSend} className="flex gap-4">
                        <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)}
                            placeholder={`Ask about "${book.title}"...`}
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white" disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading || !userInput.trim()}>Ask</Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const LiteratureCompanionView: React.FC<LiteratureCompanionViewProps> = ({ onBack, student }) => {
    const [selectedBook, setSelectedBook] = useState<{ title: string, author: string } | null>(null);

    if (selectedBook) {
        return <BookChatView student={student} book={selectedBook} onBack={() => setSelectedBook(null)} />;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                    <LiteratureIcon className="w-8 h-8 text-purple-400" />
                    Literature Companion
                </h2>
                <Button onClick={onBack} variant="secondary">&larr; Back to Learning Hub</Button>
            </div>
            <p className="text-gray-400 mb-6">Explore classic literature. Select a book from the shelf to begin your analysis.</p>
            
            <div className="flex-1 bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                    <BookshelfIcon /> Select a Book
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {BOOKS.map(book => (
                        <button key={book.title} onClick={() => setSelectedBook(book)} className="bg-gray-700 rounded-lg p-4 text-center hover:bg-gray-600 transition-colors transform hover:-translate-y-1">
                            <p className="font-bold text-lg text-white">{book.title}</p>
                            <p className="text-sm text-gray-400">{book.author}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LiteratureCompanionView;
