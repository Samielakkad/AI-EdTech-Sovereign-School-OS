

import React, { useState, useEffect, useRef } from 'react';
import { StudentProfile, AdventureModule, AdventureNode, AdventureChoice, AdventureInteraction, InteractionFillBlankPayload, InteractionMatchingPayload, InteractionFindMistakePayload, InteractionOrderingPayload, InteractionCategorizationPayload } from '../../types.ts';
import * as studentDataService from '../../services/studentDataService.ts';
import * as geminiService from '../../services/geminiService.ts';
import { BookIcon } from '../icons/StudentIcons.tsx';
import Button from '../common/Button.tsx';
import { DownloadIcon, ExpandIcon, ShrinkIcon } from '../icons/SettingsIcon.tsx';
import Select from '../common/Select.tsx';
import { HEROES } from '../../services/heroData.ts';

declare const jspdf: any;
declare const JSZip: any;

const LANGUAGES = [
    'English',
    'Spanish (Español)',
    'French (Français)',
    'Mandarin Chinese (中文)',
    'Arabic (العربية)',
    'Japanese (日本語)',
    'Indonesian (Bahasa Indonesia)',
    'Malay (Bahasa Melayu)',
    'Vietnamese (Tiếng Việt)',
    'Thai (ภาษาไทย)',
    'Greek (Ελληνικά)',
    'Portuguese (Português)',
    'German (Deutsch)',
    'Italian (Italiano)',
    'Korean (한국어)',
    'Hindi (हिन्दी)',
];

type StoryMode = 'image' | 'video';

const shuffleArray = (array: any[]) => {
    if (!array) return [];
    return [...array].sort(() => Math.random() - 0.5);
};


// --- INTERACTION COMPONENTS ---

const FillInTheBlankInteraction: React.FC<{
    interaction: InteractionFillBlankPayload;
    onComplete: (isCorrect: boolean, userAnswer: string) => void;
}> = ({ interaction, onComplete }) => {
    const [userAnswer, setUserAnswer] = useState('');
    const onCompleteCalled = useRef(false);

    if (!interaction.sentenceWithAnswer) {
        if (!onCompleteCalled.current) {
            onComplete(true, "Skipped");
            onCompleteCalled.current = true;
        }
        return null;
    }
    
    const parts = interaction.sentenceWithAnswer.match(/(.*){(.*)}(.*)/s);
    if (!parts) {
        if (!onCompleteCalled.current) {
            onComplete(true, "Skipped");
            onCompleteCalled.current = true;
        }
        return <p className="text-yellow-400 italic"><strong>Note:</strong> {interaction.sentenceWithAnswer}</p>;
    }
    const [, before, answer, after] = parts;

    const checkAnswer = (submittedAnswer: string) => {
        if (onCompleteCalled.current) return;
        const correct = submittedAnswer.trim().toLowerCase() === answer.toLowerCase();
        onComplete(correct, submittedAnswer);
        onCompleteCalled.current = true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        checkAnswer(userAnswer);
    };

    const handleWordBankClick = (word: string) => {
        checkAnswer(word);
    };
    
    if (interaction.wordBank && interaction.wordBank.length > 0) {
        const [shuffledBank] = useState(() => shuffleArray(interaction.wordBank!));
        return (
            <div className="space-y-4">
                <p className="text-lg text-center">{before} <span className="px-2 py-1 rounded-md mx-1 bg-gray-900 text-gray-400 italic">...?...</span> {after}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {shuffledBank.map((word: string) => (
                        <Button key={word} onClick={() => handleWordBankClick(word)} variant="secondary" className="!text-base">
                            {word}
                        </Button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-2 text-lg">
            <span>{before}</span>
            <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="bg-gray-900 border-b-2 border-indigo-400 focus:outline-none focus:border-white text-white w-32 text-center"
                autoFocus
                aria-label="Fill in the blank"
            />
            <span>{after}</span>
            <Button type="submit" className="!py-1 !px-3">Check</Button>
        </form>
    );
};

const MatchingInteraction: React.FC<{
    interaction: InteractionMatchingPayload;
    onComplete: (isCorrect: boolean, userAnswer: string) => void;
}> = ({ interaction, onComplete }) => {
    const [terms] = useState(() => shuffleArray(interaction.pairs?.map(p => p.term)));
    const [definitions] = useState(() => shuffleArray(interaction.pairs?.map(p => p.definition)));
    const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
    const [matches, setMatches] = useState<Record<string, string>>({});

    const handleTermClick = (term: string) => {
        if (matches[term]) return;
        setSelectedTerm(prev => (prev === term ? null : term));
    };

    const handleDefinitionClick = (def: string) => {
        if (!selectedTerm || Object.values(matches).includes(def)) return;
        setMatches(prev => ({ ...prev, [selectedTerm]: def }));
        setSelectedTerm(null);
    };

    const handleSubmit = () => {
        const correctCount = (interaction.pairs || []).filter(p => matches[p.term] === p.definition).length;
        const total = interaction.pairs?.length || 0;
        onComplete(correctCount === total, `Matched ${correctCount} of ${total} correctly.`);
    };
    
    const allMatched = Object.keys(matches).length === (interaction.pairs?.length || 0);

    return (
        <div className="space-y-4">
            <p className="font-semibold text-lg">{interaction.instruction}</p>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    {terms.map(term => (
                        <button key={term} onClick={() => handleTermClick(term)}
                            className={`w-full p-2 text-left rounded-md border-2 transition-colors ${
                                selectedTerm === term ? 'border-yellow-400 bg-gray-600' : matches[term] ? 'border-indigo-500 bg-indigo-900/50 cursor-not-allowed' : 'border-transparent bg-gray-700 hover:bg-gray-600'
                            }`}>
                            {term}
                        </button>
                    ))}
                </div>
                <div className="space-y-2">
                    {definitions.map(def => (
                         <button key={def} onClick={() => handleDefinitionClick(def)} disabled={!selectedTerm || Object.values(matches).includes(def)}
                            className={`w-full p-2 text-left rounded-md border-2 transition-colors ${Object.values(matches).includes(def) ? 'border-indigo-500 bg-indigo-900/50 cursor-not-allowed' : 'border-transparent bg-gray-700'} ${selectedTerm ? 'hover:border-yellow-400 cursor-pointer' : 'cursor-default'}`}>
                            {def}
                        </button>
                    ))}
                </div>
            </div>
            <div className="text-center">
                <Button onClick={handleSubmit} disabled={!allMatched}>Check My Matches</Button>
            </div>
        </div>
    )
};

const FindTheMistakeInteraction: React.FC<{
    interaction: InteractionFindMistakePayload;
    onComplete: (isCorrect: boolean, userAnswer: string) => void;
}> = ({ interaction, onComplete }) => {
    return (
        <div className="space-y-4 text-center">
            <p className="font-semibold text-lg">Can you find the mistake in this sentence?</p>
            <blockquote className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-gray-500 italic text-left">
                {interaction.statement}
            </blockquote>
            <Button onClick={() => onComplete(true, "Spotted the mistake")}>Reveal Mistake & Correction</Button>
        </div>
    );
};

const OrderingInteraction: React.FC<{
    interaction: InteractionOrderingPayload;
    onComplete: (isCorrect: boolean, userAnswer: string) => void;
}> = ({ interaction, onComplete }) => {
    const [userOrder, setUserOrder] = useState(() => shuffleArray(interaction.orderingItems));
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragOver = (e: React.DragEvent<HTMLLIElement>, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        
        const newOrder = [...userOrder];
        const [draggedItem] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(index, 0, draggedItem);
        
        setUserOrder(newOrder);
        setDraggedIndex(index);
    };

    const handleDrop = (e: React.DragEvent<HTMLLIElement>) => {
        e.preventDefault();
        e.currentTarget.style.opacity = '1';
    }

    const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
        setDraggedIndex(null);
        e.currentTarget.style.opacity = '1';
    };

    const handleSubmit = () => {
        const isCorrect = JSON.stringify(userOrder) === JSON.stringify(interaction.orderingItems);
        onComplete(isCorrect, "Submitted order");
    };

    return (
        <div className="space-y-4">
            <p className="font-semibold text-lg">{interaction.instruction}</p>
            <ul className="space-y-2">
                {userOrder.map((item, index) => (
                    <li
                        key={item}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                        className={`p-3 rounded-md transition-colors cursor-grab hover:bg-gray-600 bg-gray-900/50 ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}`}
                    >
                        {index + 1}. {item}
                    </li>
                ))}
            </ul>
            <div className="text-center">
                <Button onClick={handleSubmit}>Check My Order</Button>
            </div>
        </div>
    );
};

const CategorizationInteraction: React.FC<{
    interaction: InteractionCategorizationPayload;
    onComplete: (isCorrect: boolean, userAnswer: string) => void;
}> = ({ interaction, onComplete }) => {
    const [unplaced, setUnplaced] = useState(() => shuffleArray(interaction.categorizationItems.map(i => i.item)));
    const [placements, setPlacements] = useState<Record<string, string[]>>(() => {
        const state: Record<string, string[]> = {};
        interaction.categories.forEach(cat => (state[cat] = []));
        return state;
    });
    const [draggedItem, setDraggedItem] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: string) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData("text/plain", item);
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        setDraggedItem(null);
        e.currentTarget.style.opacity = '1';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetCategory: string | null) => {
        e.preventDefault();
        const item = e.dataTransfer.getData("text/plain");
        if (!item || item !== draggedItem) return;
        const newUnplaced = unplaced.filter(i => i !== item);
        const newPlacements = { ...placements };
        Object.keys(newPlacements).forEach(cat => { newPlacements[cat] = newPlacements[cat].filter(i => i !== item); });
        if (targetCategory) { newPlacements[targetCategory].push(item); } else { newUnplaced.push(item); }
        setUnplaced(newUnplaced);
        setPlacements(newPlacements);
    };

    const handleSubmit = () => {
        let correctCount = 0;
        interaction.categorizationItems.forEach(({ item, category }) => { if (placements[category]?.includes(item)) correctCount++; });
        const total = interaction.categorizationItems.length;
        onComplete(correctCount === total, `Sorted ${correctCount} of ${total} correctly.`);
    };

    const allPlaced = unplaced.length === 0;

    return (
        <div className="space-y-4">
            <p className="font-semibold text-lg text-center mb-4">{interaction.instruction}</p>
            <div className="bg-gray-800 p-2 rounded-lg min-h-[4rem] flex flex-wrap gap-2 justify-center mb-4 border-2 border-dashed border-gray-600" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, null)}>
                {unplaced.map(item => ( <div key={item} draggable onDragStart={e => handleDragStart(e, item)} onDragEnd={handleDragEnd} className="p-2 rounded-md cursor-grab bg-indigo-600">{item}</div> ))}
                 {unplaced.length === 0 && <p className="text-gray-500 text-sm p-2">All items placed!</p>}
            </div>
            <div className={`grid grid-cols-${interaction.categories.length} gap-4`}>
                {interaction.categories.map(cat => (
                    <div key={cat} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, cat)} className="bg-gray-800 p-2 rounded-lg min-h-[8rem] space-y-2 border-2 border-dashed border-gray-600">
                        <h4 className="font-bold text-center text-indigo-300">{cat}</h4>
                        {placements[cat].map(item => ( <div key={item} draggable onDragStart={e => handleDragStart(e, item)} onDragEnd={handleDragEnd} className="p-2 rounded-md cursor-grab bg-indigo-600">{item}</div> ))}
                    </div>
                ))}
            </div>
            <div className="mt-4 text-center"> <Button onClick={handleSubmit} disabled={!allPlaced}>{allPlaced ? 'Check My Answers' : 'Place all items'}</Button> </div>
        </div>
    );
};


const AdventureGame: React.FC<{ student: StudentProfile, module: AdventureModule, onBack: () => void, language: string, mode: StoryMode }> = ({ student, module, onBack, language, mode }) => {
    const [title, setTitle] = useState('');
    const [nodes, setNodes] = useState<AdventureNode[]>([]);
    const [nextNode, setNextNode] = useState<AdventureNode | null>(null);
    const [sceneVisuals, setSceneVisuals] = useState<Record<number, string>>({});
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isFetchingNext, setIsFetchingNext] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [answers, setAnswers] = useState<{stage: number, isCorrect: boolean}[]>([]);
    const [showNextButton, setShowNextButton] = useState(false);
    const [visualErrors, setVisualErrors] = useState<Record<number, boolean>>({});
    const [aiFeedback, setAiFeedback] = useState<string>('');
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState<boolean>(false);
    const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
    const adventureContainerRef = useRef<HTMLDivElement>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const handleFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    useEffect(() => {
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    const toggleFullScreen = () => {
        if (!adventureContainerRef.current) return;
        if (!document.fullscreenElement) {
            adventureContainerRef.current.requestFullscreen().catch(err => alert(`Error: ${err.message}`));
        } else {
            document.exitFullscreen();
        }
    };
    
    const fetchVisual = async (node: AdventureNode) => {
        try {
            const visualUrl = mode === 'image'
                ? await geminiService.generateImage(node.sceneVisualPrompt, '16:9')
                : await geminiService.generateVideoFromPrompt(`A short video clip in a vibrant, 2D storybook animation style. ${student.selectedHero} is in a scene described as: ${node.sceneVisualPrompt}`, '16:9');
            setSceneVisuals(prev => ({ ...prev, [node.stage]: visualUrl }));
        } catch (err) {
            console.error(`Visual generation failed for stage ${node.stage}:`, err);
            setVisualErrors(prev => ({ ...prev, [node.stage]: true }));
        }
    };
    
    useEffect(() => {
        const startAdventure = async () => {
            setIsLoadingInitial(true);
            try {
                const initialNode = await geminiService.generateAdventureInitialNode(module, student, language);
                setTitle(module.prompt);
                setNodes([initialNode]);
                fetchVisual(initialNode);
            } catch (err) { console.error("Failed to start adventure", err); } 
            finally { setIsLoadingInitial(false); }
        };
        startAdventure();
    }, [module, student, language]);

    useEffect(() => {
        const prefetchNextNode = async () => {
            if (nodes.length === 0 || nodes.length >= module.stages) return;
            setIsFetchingNext(true);
            setNextNode(null);
            try {
                const next = await geminiService.generateAdventureNextNode(module, student, language, nodes, answers);
                setNextNode(next);
                fetchVisual(next);
            } catch (error) { console.error("Failed to pre-fetch next node:", error); } 
            finally { setIsFetchingNext(false); }
        };
        if (!isLoadingInitial) prefetchNextNode();
    }, [nodes, answers]);

    const handleInteractionComplete = async (isCorrect: boolean, userAnswerString: string) => {
        const currentNode = nodes[nodes.length - 1];
        const newAnswers = [...answers, { stage: currentNode.stage, isCorrect }];
        setAnswers(newAnswers);
        setLastAnswerCorrect(isCorrect);
    
        setIsGeneratingFeedback(true);
        setAiFeedback('');
    
        try {
            const stream = await geminiService.generateAdventureFeedback(student, currentNode, isCorrect, userAnswerString);
            for await (const chunk of stream) {
                setAiFeedback(prev => prev + chunk);
            }
        } catch (error) {
            console.error("Error generating AI feedback:", error);
            setAiFeedback(isCorrect ? "Great job!" : "That's not quite right, but good try!");
        } finally {
            setIsGeneratingFeedback(false);
            setShowNextButton(true);
        }
    };

    const handleChoice = (choice: AdventureChoice) => {
        handleInteractionComplete(choice.isCorrect, choice.text);
    };

    const handleNext = async () => {
        if (nodes.length >= module.stages) {
            setIsComplete(true);
            const correctCount = answers.filter(a => a.isCorrect).length;
            const score = Math.round((correctCount / module.stages) * 100);
            studentDataService.addAdventureToHistory(student.id, { moduleId: module.id, title: title, score: score });
            return;
        }

        const proceedWithNode = (node: AdventureNode) => {
            setNodes(prev => [...prev, node]);
            setAiFeedback('');
            setShowNextButton(false);
            setLastAnswerCorrect(null);
        };

        if (nextNode) {
            proceedWithNode(nextNode);
            setNextNode(null);
        } else {
            setIsFetchingNext(true);
            try {
                const next = await geminiService.generateAdventureNextNode(module, student, language, nodes, answers);
                fetchVisual(next);
                proceedWithNode(next);
            } catch (error) {
                alert("Sorry, there was an error generating the next part of the story. Please try again.");
            } finally {
                setIsFetchingNext(false);
            }
        }
    };

    const handleDownloadPdf = async () => {
        if (nodes.length === 0 || mode === 'video') return;
        const { jsPDF } = jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1280, 720] });
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (i > 0) doc.addPage();
            doc.setFillColor(31, 41, 55); doc.rect(0, 0, 1280, 720, 'F');
            doc.setTextColor(229, 231, 235); doc.setFontSize(36); doc.text(title, 40, 60);
            doc.setTextColor(165, 180, 252); doc.setFontSize(18); doc.text(`Page ${node.stage}`, 40, 90);
            if (sceneVisuals[node.stage]) { try { doc.addImage(sceneVisuals[node.stage], 'PNG', 40, 120, 640, 360); } catch(e) { doc.text("Image could not be loaded.", 40, 120); }}
            doc.setTextColor(209, 213, 219); doc.setFontSize(16);
            const splitText = doc.splitTextToSize(node.sceneDescription, 550); doc.text(splitText, 720, 120);
        }
        doc.save(`${title.replace(/\s/g, '_')}.pdf`);
    };
    
    const handleDownloadVisualsZip = async () => {
        if (nodes.length === 0) return;
        const zip = new JSZip(); const extension = mode === 'image' ? 'png' : 'mp4';
        for (const node of nodes) {
            if (sceneVisuals[node.stage] && !visualErrors[node.stage]) {
                try {
                    const res = await fetch(sceneVisuals[node.stage]);
                    zip.file(`page_${node.stage}.${extension}`, await res.blob());
                } catch (err) { console.error(`Failed to fetch ${mode} for zipping:`, err); }
            }
        }
        zip.generateAsync({ type: 'blob' }).then((content: any) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content); link.download = `${title.replace(/\s/g, '_')}_${mode}s.zip`;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
        });
    };

    const renderInteraction = (interaction: AdventureInteraction) => {
        if (showNextButton || isGeneratingFeedback || aiFeedback) return null;
        switch (interaction.type) {
            case 'CHOICE': return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{interaction.choices.map((c, i) => <Button key={i} onClick={() => handleChoice(c)} className="!text-base !py-4 h-full">{c.text}</Button>)}</div>;
            case 'FILL_IN_THE_BLANK': return <FillInTheBlankInteraction interaction={interaction} onComplete={handleInteractionComplete} />;
            case 'MATCHING': return <MatchingInteraction interaction={interaction} onComplete={handleInteractionComplete} />;
            case 'FIND_THE_MISTAKE': return <FindTheMistakeInteraction interaction={interaction} onComplete={handleInteractionComplete} />;
            case 'ORDERING': return <OrderingInteraction interaction={interaction} onComplete={handleInteractionComplete} />;
            case 'CATEGORIZATION': return <CategorizationInteraction interaction={interaction} onComplete={handleInteractionComplete} />;
            default: setTimeout(() => handleInteractionComplete(true, "Auto-completed"), 100); return <p className="text-yellow-400 italic">Unknown interaction. Proceeding...</p>;
        }
    }

    const renderContent = () => {
        if (isLoadingInitial) {
            return <div className="text-center py-20"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400 mx-auto mb-4"></div><p className="text-gray-400">Building your adventure starring {student.selectedHero}...</p></div>;
        }
        const currentNode = nodes[nodes.length - 1];
        if (isComplete) {
            const correct = answers.filter(a => a.isCorrect).length; const score = Math.round((correct / module.stages) * 100);
            return <div className="text-center py-12"><h2 className="text-3xl font-bold text-green-400 mb-4">Adventure Complete!</h2><p className="text-lg">Your score: <span className="font-bold text-white">{score}%</span> ({correct}/{module.stages} correct)</p><p className="text-gray-300 mb-6">You helped {student.selectedHero} succeed using your knowledge of {module.topic}!</p><div className="bg-gray-700/50 p-6 rounded-lg max-w-2xl mx-auto"><h3 className="font-bold text-lg text-indigo-300 mb-2">Final Assessment</h3><p className="text-gray-200">{module.finalAssessmentQuestion.question}</p></div><div className="mt-8 flex items-center justify-center gap-4"><Button onClick={onBack}>Back to Adventures</Button>{mode === 'image' && <Button onClick={handleDownloadPdf} variant="secondary" className="flex items-center gap-2"><DownloadIcon className="w-5 h-5" /> Export PDF</Button>}<Button onClick={handleDownloadVisualsZip} variant="secondary" className="flex items-center gap-2"><DownloadIcon className="w-5 h-5" /> Export {mode === 'image' ? 'Images' : 'Videos'} (ZIP)</Button></div></div>;
        }
        if (!currentNode) { return <div className="text-center py-20 text-red-400"><p className="font-bold text-xl">Error</p><p>Could not load the adventure. Please go back and try again.</p></div>; }
        
        return <div><Button variant="secondary" onClick={onBack} className="mb-4">&larr; Back to Adventures</Button><h1 className="text-3xl font-bold text-indigo-400 mb-2">{title}</h1><p className="text-sm font-semibold text-gray-400 mb-6">Stage {currentNode.stage} of {module.stages} | Topic: {module.topic}</p><div className="bg-gray-700/50 rounded-lg shadow-lg overflow-hidden"><div className="aspect-video bg-gray-900 flex items-center justify-center">{visualErrors[currentNode.stage] ? <div className="text-red-400 p-4 text-center"><p className="font-bold">Error</p><p>Could not generate the {mode}.</p></div> : sceneVisuals[currentNode.stage] ? (mode === 'image' ? <img src={sceneVisuals[currentNode.stage]} alt={currentNode.sceneVisualPrompt} className="w-full h-full object-cover"/> : <video src={sceneVisuals[currentNode.stage]} controls autoPlay loop muted playsInline className="w-full h-full object-cover"/>) : <div className="text-center text-gray-400"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div><p>{mode === 'image' ? 'Generating image...' : 'Generating video...'}</p></div>}</div><div className="p-6"><p className="text-gray-300 leading-relaxed mb-6">{currentNode.sceneDescription}</p>{renderInteraction(currentNode.interaction)}{(isGeneratingFeedback || aiFeedback) && <div className={`mt-4 p-4 rounded-lg border-2 ${lastAnswerCorrect === true ? 'bg-green-900/30 border-green-500' : lastAnswerCorrect === false ? 'bg-red-900/30 border-red-500' : 'bg-gray-900/50 border-indigo-500/50'}`}><div className="flex items-start gap-3"><div className="flex-shrink-0 flex flex-col items-center gap-2"><div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-2xl text-white">{(HEROES.find(h => h.name === student.selectedHero) || HEROES[0]).avatar}</div>{lastAnswerCorrect !== null && (<div className={`text-3xl transition-opacity duration-300 ${isGeneratingFeedback ? 'opacity-0' : 'opacity-100'}`}>{lastAnswerCorrect ? '✅' : '❌'}</div>)}</div><div className="pt-1"><p className="font-bold text-white mb-1">{(HEROES.find(h => h.name === student.selectedHero) || HEROES[0]).name} says:</p><p className="text-gray-300 whitespace-pre-wrap">{aiFeedback}{isGeneratingFeedback && <span className="inline-block w-2 h-2 ml-1 bg-white rounded-full animate-pulse"></span>}</p></div></div></div>}{showNextButton && !isGeneratingFeedback && <div className="text-right mt-4"><Button onClick={handleNext} disabled={isFetchingNext && !nextNode}>{isFetchingNext && !nextNode ? 'Generating...' : 'Next Stage'} &rarr;</Button></div>}</div></div></div>;
    }
    
    return <div ref={adventureContainerRef} className={`relative ${isFullScreen ? 'h-screen w-screen bg-gray-800 p-6 overflow-y-auto' : 'h-full'}`}><button onClick={toggleFullScreen} className="absolute top-6 right-6 z-20 p-4 text-white bg-indigo-600/80 hover:bg-indigo-500 rounded-full shadow-xl border-2 border-indigo-500/50" title={isFullScreen ? "Exit" : "Full Screen"}>{isFullScreen ? <ShrinkIcon className="w-8 h-8" /> : <ExpandIcon className="w-8 h-8" />}</button>{renderContent()}</div>;
};


const AdventuresView: React.FC<{ student: StudentProfile }> = ({ student }) => {
    const [modules, setModules] = useState<AdventureModule[]>([]);
    const [selectedModule, setSelectedModule] = useState<AdventureModule | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const [storyMode, setStoryMode] = useState<StoryMode>('image');

    useEffect(() => {
        const allModules = studentDataService.getAdventureModules();
        const assigned = allModules.filter(m => student.adventureModuleIds?.includes(m.id));
        setModules(assigned);
    }, [student.adventureModuleIds]);

    if (selectedModule) {
        return <AdventureGame student={student} module={selectedModule} onBack={() => setSelectedModule(null)} language={selectedLanguage} mode={storyMode} />;
    }

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4 border-b border-gray-700 pb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <BookIcon className="w-7 h-7 text-indigo-400" />
                    My Adventures
                </h2>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-56">
                        <Select
                            label="Story Language"
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang} value={lang.split(' (')[0]}>{lang}</option>
                            ))}
                        </Select>
                    </div>
                     <div className="w-full sm:w-56">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Story Mode</label>
                         <div className="flex bg-gray-700 rounded-md p-1">
                            <Button onClick={() => setStoryMode('image')} variant={storyMode === 'image' ? 'primary' : 'secondary'} className={`w-1/2 !rounded-md ${storyMode === 'image' ? '' : '!bg-transparent'}`}>Image</Button>
                            <Button onClick={() => setStoryMode('video')} variant={storyMode === 'video' ? 'primary' : 'secondary'} className={`w-1/2 !rounded-md ${storyMode === 'video' ? '' : '!bg-transparent'}`}>Video</Button>
                        </div>
                        {storyMode === 'video' && <p className="text-xs text-yellow-400 mt-2">Video generation may take several minutes per scene.</p>}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                <h3 className="text-xl font-bold mb-3">Available Adventures</h3>
                {modules.length > 0 ? (
                    <div className="space-y-3">
                        {modules.map(module => (
                            <button 
                                key={module.id} 
                                onClick={() => setSelectedModule(module)}
                                className="w-full text-left bg-gray-700/60 hover:bg-gray-700 transition-colors p-4 rounded-lg"
                            >
                                <h3 className="font-bold text-white">{module.prompt}</h3>
                                <p className="text-sm text-indigo-300">Topic: {module.topic}</p>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <BookIcon className="w-16 h-16 mx-auto mb-4" />
                        <p>You don't have any assigned adventures yet.</p>
                        <p>Your teacher can create them from their portal.</p>
                    </div>
                )}
                
                {student.adventureHistory && student.adventureHistory.length > 0 && (
                     <div className="mt-8 pt-6 border-t border-gray-700">
                        <h3 className="text-xl font-bold mb-3">Completed Adventures</h3>
                        <div className="space-y-3">
                            {student.adventureHistory.map(entry => (
                                <div key={entry.completedAt} className="bg-gray-700/60 p-4 rounded-lg flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-white">{entry.title}</h4>
                                        <p className="text-xs text-gray-400">Completed: {new Date(entry.completedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-xl ${entry.score >= 80 ? 'text-green-400' : entry.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{entry.score}%</p>
                                        <p className="text-xs text-gray-400">Score</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdventuresView;