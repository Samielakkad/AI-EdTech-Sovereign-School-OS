import React, { useState } from 'react';
import Button from '../../common/Button.tsx';
import { Hero } from '../../../services/heroData.ts';

const shuffleArray = (array: any[]) => {
    return [...array].sort(() => Math.random() - 0.5);
};

export const FillInTheBlank: React.FC<{
    before: string;
    after: string;
    answer: string;
    wordBank?: string[];
    widgetState: any;
    onAnswer: (isCorrect: boolean, userAnswer: string) => void;
    hero: Hero;
}> = ({ before, after, answer, wordBank, widgetState, onAnswer, hero }) => {
    const [userAnswer, setUserAnswer] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const isCorrect = userAnswer.trim().toLowerCase() === answer.toLowerCase();
        onAnswer(isCorrect, userAnswer.trim());
    };

    const handleWordBankClick = (word: string) => {
        const isCorrect = word.toLowerCase() === answer.toLowerCase();
        onAnswer(isCorrect, word);
    }

    if (widgetState.submitted) {
        return (
            <p className="inline">
                {before}
                <span className={`px-2 py-1 rounded-md mx-1 font-semibold text-white ${widgetState.isCorrect ? 'bg-green-600' : 'bg-red-600'}`}>
                    {widgetState.userAnswer}
                </span>
                {after}
                {!widgetState.isCorrect && <span className="text-green-400 font-bold ml-2">(Correct: {answer})</span>}
            </p>
        );
    }

    if (wordBank) {
        const [shuffledBank] = useState(() => shuffleArray(wordBank));
        return (
             <div className="inline">
                {before}
                <span className="px-2 py-1 rounded-md mx-1 bg-gray-800 text-gray-400 italic">...?...</span>
                {after}
                <div className="flex flex-wrap gap-2 mt-2">
                    {shuffledBank.map(word => (
                        <Button key={word} onClick={() => handleWordBankClick(word)} variant="secondary" className="!text-sm">
                            {word}
                        </Button>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="inline">
            {before}
            <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className={`bg-gray-900 border-b-2 focus:outline-none focus:border-white text-white w-24 mx-1 text-center ${hero.theme.primary.replace('bg-', 'border-')}`}
                style={{ display: 'inline-block', verticalAlign: 'baseline' }}
                aria-label="Fill in the blank"
            />
            {after}
            <Button type="submit" className={`!py-1 !px-2 !text-xs ml-2 ${hero.theme.primary}`}>Check</Button>
        </form>
    );
};

export const MultipleChoice: React.FC<{
    question: string;
    options: string[];
    answer: string;
    widgetState: any;
    onAnswer: (isCorrect: boolean, userAnswer: string) => void;
    hero: Hero;
}> = ({ question, options, answer, widgetState, onAnswer, hero }) => {
    const [shuffledOptions] = useState(() => shuffleArray(options));
    
    const handleSelect = (option: string) => {
        if (widgetState.submitted) return;
        const isCorrect = option === answer;
        onAnswer(isCorrect, option);
    };

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg my-2 border border-gray-600">
            <p className="font-semibold mb-3">{question}</p>
            <div className="space-y-2">
                {shuffledOptions.map((option, index) => {
                    const isSelected = widgetState.userAnswer === option;
                    const isCorrect = option === answer;
                    let buttonClass = 'bg-gray-700 hover:bg-gray-600';
                    if (widgetState.submitted) {
                        if (isSelected && !isCorrect) buttonClass = 'bg-red-600';
                        if (isCorrect) buttonClass = 'bg-green-600';
                    } else if (isSelected) {
                        buttonClass = `${hero.theme.primary}`;
                    }
                    
                    return (
                        <Button
                            key={index}
                            onClick={() => handleSelect(option)}
                            disabled={widgetState.submitted}
                            className={`w-full !justify-start !text-left !py-2 !px-3 ${buttonClass}`}
                        >
                            {option}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
};

export const MatchingExercise: React.FC<{
    instruction: string;
    pairs: { term: string; definition: string }[];
    widgetState: any;
    onAnswer: (result: { matches: Record<string, string>; correctCount: number; total: number }) => void;
    hero: Hero;
}> = ({ instruction, pairs, widgetState, onAnswer, hero }) => {
    const [terms] = useState(() => shuffleArray(pairs.map(p => p.term)));
    const [definitions] = useState(() => shuffleArray(pairs.map(p => p.definition)));
    const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
    const [userMatches, setUserMatches] = useState<Record<string, string>>({});

    const handleTermClick = (term: string) => {
        if (userMatches[term]) {
            const newMatches = { ...userMatches };
            delete newMatches[term];
            setUserMatches(newMatches);
            setSelectedTerm(null);
        } else {
            setSelectedTerm(term);
        }
    };

    const handleDefinitionClick = (definition: string) => {
        if (selectedTerm && !Object.values(userMatches).includes(definition)) {
            setUserMatches(prev => ({ ...prev, [selectedTerm]: definition }));
            setSelectedTerm(null);
        }
    };

    const handleSubmit = () => {
        let correctCount = 0;
        pairs.forEach(pair => {
            if (userMatches[pair.term] === pair.definition) {
                correctCount++;
            }
        });
        onAnswer({ matches: userMatches, correctCount, total: pairs.length });
    };

    if (widgetState.submitted) {
        const result = widgetState.userAnswer as { matches: Record<string, string>; correctCount: number; total: number };
        return (
            <div className="bg-gray-900/50 p-4 rounded-lg my-2 border border-gray-600">
                <p className="font-semibold">{instruction}</p>
                 <p className="text-lg font-bold my-2 text-center">{result.correctCount} / {result.total} Correct</p>
                <ul className="space-y-2 text-sm">
                    {pairs.map((pair, i) => {
                        const userDef = result.matches[pair.term];
                        const isCorrect = userDef === pair.definition;
                        return (
                            <li key={i} className={`p-2 rounded-md ${isCorrect ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                                <p className="font-semibold">{pair.term}</p>
                                <p>Your match: <span className="font-bold">{userDef || 'None'}</span> {isCorrect ? '✅' : '❌'}</p>
                                {!isCorrect && <p className="text-green-400">Correct match: <span className="font-bold">{pair.definition}</span></p>}
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }
    
    const allMatched = Object.keys(userMatches).length === pairs.length;

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg my-2 border border-gray-600">
            <p className="font-semibold mb-4">{instruction}</p>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    {terms.map(term => (
                        <button
                            key={term}
                            onClick={() => handleTermClick(term)}
                            className={`w-full p-2 text-left rounded-md border-2 transition-colors ${selectedTerm === term ? `border-yellow-400 ${hero.theme.userBubble}` : userMatches[term] ? `border-transparent ${hero.theme.primary}` : 'border-transparent bg-gray-700 hover:bg-gray-600'}`}
                        >
                            {term}
                        </button>
                    ))}
                </div>
                 <div className="space-y-2">
                    {definitions.map(def => (
                        <button
                            key={def}
                            onClick={() => handleDefinitionClick(def)}
                            className={`w-full p-2 text-left rounded-md border-2 transition-colors ${selectedTerm ? 'cursor-pointer hover:border-yellow-400' : ''} ${Object.values(userMatches).includes(def) ? `border-transparent ${hero.theme.primary}` : 'border-transparent bg-gray-700 hover:bg-gray-600'}`}
                        >
                            {def}
                        </button>
                    ))}
                </div>
            </div>
             <div className="mt-4 text-center">
                <Button onClick={handleSubmit} disabled={!allMatched} className={hero.theme.primary}>
                    {allMatched ? 'Check My Matches' : `Match all ${pairs.length} pairs`}
                </Button>
            </div>
        </div>
    );
};

export const OrderingExercise: React.FC<{
    instruction: string;
    orderingItems: string[]; // Correctly ordered items
    widgetState: any;
    onAnswer: (isCorrect: boolean, userOrder: string[]) => void;
    hero: Hero;
}> = ({ instruction, orderingItems, widgetState, onAnswer, hero }) => {
    const [userOrder, setUserOrder] = useState(() => shuffleArray(orderingItems));
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
        const isCorrect = JSON.stringify(userOrder) === JSON.stringify(orderingItems);
        onAnswer(isCorrect, userOrder);
    };

    if (widgetState.submitted) {
        const isCorrect = widgetState.isCorrect;
        return (
            <div className={`bg-gray-900/50 p-4 rounded-lg my-2 border-2 ${isCorrect ? 'border-green-600' : 'border-red-600'}`}>
                <p className="font-semibold mb-3">{instruction}</p>
                <p className={`text-lg font-bold my-2 text-center ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {isCorrect ? 'Correct!' : 'Not quite!'}
                </p>
                <ul className="space-y-2">
                    {widgetState.userAnswer.map((item: string, index: number) => {
                        const isItemCorrect = item === orderingItems[index];
                        return (
                            <li key={index} className={`p-2 rounded-md ${isItemCorrect ? 'bg-green-900/50' : 'bg-red-900/50'} flex justify-between items-center`}>
                                <span>{index + 1}. {item}</span>
                                {!isCorrect && <span className="text-xs text-green-400"> (Should be: {orderingItems[index]})</span>}
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }
    
    return (
        <div className="bg-gray-900/50 p-4 rounded-lg my-2 border border-gray-600">
            <p className="font-semibold mb-3">{instruction}</p>
            <ul className="space-y-2">
                {userOrder.map((item, index) => (
                    <li
                        key={item}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                        className={`p-3 rounded-md cursor-grab transition-all duration-300 ${hero.theme.userBubble} ${draggedIndex === index ? 'opacity-50 scale-105' : 'opacity-100'} border-2 border-transparent hover:border-indigo-400`}
                    >
                        {item}
                    </li>
                ))}
            </ul>
            <div className="mt-4 text-center">
                <Button onClick={handleSubmit} className={hero.theme.primary}>
                    Check Order
                </Button>
            </div>
        </div>
    );
};

export const FindTheMistake: React.FC<{
    statement: string;
    mistake: string;
    correction: string;
    widgetState: any;
    onAnswer: (isCorrect: boolean) => void;
    hero: Hero;
}> = ({ statement, mistake, correction, widgetState, onAnswer, hero }) => {
    const [isRevealed, setIsRevealed] = useState(false);
    
    const handleReveal = () => {
        setIsRevealed(true);
        onAnswer(true); // This interaction is more about discovery than a right/wrong answer
    };

    if (widgetState.submitted) {
        return (
            <div className="bg-gray-900/50 p-4 rounded-lg my-2 border border-green-600">
                <p className="font-semibold mb-2">Let's review:</p>
                <p className="text-gray-400 line-through">"{statement}"</p>
                <p className="mt-2 text-green-300 font-semibold">Corrected: "{correction}"</p>
            </div>
        );
    }

    const parts = statement.split(mistake);
    const before = parts[0];
    const after = parts[1];

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg my-2 border border-gray-600">
            <p className="font-semibold mb-3">Can you spot the mistake in this sentence?</p>
            <p className="text-lg bg-gray-800 p-3 rounded-md">
                {before}
                <span className="px-2 py-1 rounded-md bg-red-900/50 text-red-300 border border-red-500">{mistake}</span>
                {after}
            </p>
             <div className="mt-4 text-center">
                <Button onClick={handleReveal} className={hero.theme.primary}>
                    Reveal Correction
                </Button>
            </div>
        </div>
    );
};

export const CategorizationExercise: React.FC<{
    instruction: string;
    categories: string[];
    categorizationItems: { item: string; category: string }[];
    widgetState: any;
    onAnswer: (result: { placements: Record<string, string[]>; correctCount: number; total: number }) => void;
    hero: Hero;
}> = ({ instruction, categories, categorizationItems, widgetState, onAnswer, hero }) => {
    const [unplaced, setUnplaced] = useState(() => shuffleArray(categorizationItems.map(i => i.item)));
    const [placements, setPlacements] = useState<Record<string, string[]>>(() => {
        const state: Record<string, string[]> = {};
        categories.forEach(cat => state[cat] = []);
        return state;
    });
    const [draggedItem, setDraggedItem] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: string) => {
        setDraggedItem(item);
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
        if (!item) return;

        // Remove item from wherever it was
        const newUnplaced = unplaced.filter(i => i !== item);
        const newPlacements = { ...placements };
        Object.keys(newPlacements).forEach(cat => {
            newPlacements[cat] = newPlacements[cat].filter(i => i !== item);
        });

        // Add it to the new location
        if (targetCategory) {
            newPlacements[targetCategory].push(item);
        } else {
            newUnplaced.push(item);
        }
        
        setUnplaced(newUnplaced);
        setPlacements(newPlacements);
    };

    const handleSubmit = () => {
        let correctCount = 0;
        categorizationItems.forEach(({ item, category }) => {
            if (placements[category]?.includes(item)) {
                correctCount++;
            }
        });
        onAnswer({ placements, correctCount, total: categorizationItems.length });
    };

    if (widgetState.submitted) {
        const { placements: finalPlacements, correctCount, total } = widgetState.userAnswer;
         return (
            <div className="bg-gray-900/50 p-4 rounded-lg my-2 border border-gray-600">
                <p className="font-semibold">{instruction}</p>
                <p className="text-lg font-bold my-2 text-center">{correctCount} / {total} Correct</p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    {categories.map(cat => (
                        <div key={cat}>
                            <h4 className="font-bold text-center mb-2">{cat}</h4>
                            <div className="space-y-2">
                                {finalPlacements[cat].map((item: string) => {
                                    const isCorrect = categorizationItems.find(i => i.item === item)?.category === cat;
                                    return <div key={item} className={`p-2 rounded-md text-sm ${isCorrect ? 'bg-green-900/50' : 'bg-red-900/50'}`}>{item}</div>;
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    const allPlaced = unplaced.length === 0;

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg my-2 border border-gray-600">
            <p className="font-semibold mb-4">{instruction}</p>
            <div 
                className="bg-gray-800 p-2 rounded-lg min-h-[4rem] flex flex-wrap gap-2 justify-center mb-4"
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, null)}
            >
                {unplaced.map(item => (
                    <div key={item} draggable onDragStart={e => handleDragStart(e, item)} onDragEnd={handleDragEnd}
                        className={`p-2 rounded-md cursor-grab ${hero.theme.userBubble}`}>
                        {item}
                    </div>
                ))}
            </div>
            <div className={`grid grid-cols-${categories.length} gap-4`}>
                {categories.map(cat => (
                    <div key={cat} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, cat)}
                        className="bg-gray-800 p-2 rounded-lg min-h-[8rem] space-y-2 border-2 border-dashed border-gray-600">
                        <h4 className="font-bold text-center">{cat}</h4>
                        {placements[cat].map(item => (
                             <div key={item} draggable onDragStart={e => handleDragStart(e, item)} onDragEnd={handleDragEnd}
                                className={`p-2 rounded-md cursor-grab ${hero.theme.userBubble}`}>
                                {item}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div className="mt-4 text-center">
                <Button onClick={handleSubmit} disabled={!allPlaced} className={hero.theme.primary}>
                    {allPlaced ? 'Check My Answers' : 'Place all items'}
                </Button>
            </div>
        </div>
    );
};