import React, { useState, useEffect } from 'react';
import { Flashcard } from '../../services/geminiService.ts';
import Button from '../common/Button.tsx';
import { CloseIcon, DownloadIcon } from '../icons/SettingsIcon.tsx';

interface FlashcardModalProps {
    isOpen: boolean;
    onClose: () => void;
    flashcards: Flashcard[];
}

const FlashcardModal: React.FC<FlashcardModalProps> = ({ isOpen, onClose, flashcards }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
            setIsFlipped(false);
            setIsAnimating(false);
        }
    }, [isOpen]);

    if (!isOpen || flashcards.length === 0) return null;

    const currentCard = flashcards[currentIndex];

    const navigate = (direction: 'next' | 'prev') => {
        const canGoNext = currentIndex < flashcards.length - 1;
        const canGoPrev = currentIndex > 0;

        if ((direction === 'next' && !canGoNext) || (direction === 'prev' && !canGoPrev) || isAnimating) {
            return;
        }

        setIsAnimating(true);
        setTimeout(() => {
            setIsFlipped(false);
            setCurrentIndex(prev => direction === 'next' ? prev + 1 : prev - 1);
            setIsAnimating(false);
        }, 150); // Match the fade-out duration
    };

    const handleNext = () => navigate('next');
    const handlePrev = () => navigate('prev');
    
    const handleDownload = () => {
        const content = flashcards.map(c => `Word: ${c.word}\nDefinition: ${c.definition}`).join('\n\n---\n\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'flashcards.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl relative p-8 flex flex-col gap-6 border border-gray-700" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <CloseIcon />
                </button>
                <h2 className="text-2xl font-bold text-center text-white">Vocabulary Flashcards</h2>

                {/* Card container with transition */}
                <div className={`transition-opacity duration-150 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                    <div 
                        className="w-full h-64 [perspective:1000px] cursor-pointer group"
                        onClick={() => !isAnimating && setIsFlipped(!isFlipped)}
                        onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !isAnimating && setIsFlipped(!isFlipped)}
                        role="button"
                        aria-pressed={isFlipped}
                        tabIndex={0}
                    >
                        <div
                            className={`relative w-full h-full [transform-style:preserve-3d] transition-transform duration-700 ease-in-out ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                        >
                            {/* Front */}
                            <div className="absolute w-full h-full [backface-visibility:hidden] bg-indigo-600 rounded-lg flex items-center justify-center p-6 shadow-2xl border-2 border-indigo-400 transition-transform duration-300 group-hover:scale-[1.02]">
                                <h3 className="text-4xl font-bold text-white text-center break-words">{currentCard.word}</h3>
                            </div>
                            {/* Back */}
                            <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gray-700 rounded-lg flex items-center justify-center p-6 shadow-2xl border-2 border-gray-600 transition-transform duration-300 group-hover:scale-[1.02]">
                                <p className="text-xl text-gray-200 text-center">{currentCard.definition}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                    <Button onClick={handlePrev} disabled={currentIndex === 0 || isAnimating} variant="secondary">
                        &larr; Previous
                    </Button>
                    <span className="font-semibold text-gray-400">{currentIndex + 1} / {flashcards.length}</span>
                    <Button onClick={handleNext} disabled={currentIndex === flashcards.length - 1 || isAnimating} variant="secondary">
                        Next &rarr;
                    </Button>
                </div>
                
                 <div className="border-t border-gray-700 pt-6 text-center">
                     <Button onClick={handleDownload} className="inline-flex items-center gap-2 !py-3 !px-6">
                        <DownloadIcon className="w-5 h-5"/>
                        Download All Cards (.txt)
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FlashcardModal;