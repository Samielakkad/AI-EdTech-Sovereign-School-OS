import React, { useState, useEffect } from 'react';
import { SmartSuggestion } from '../../types.ts';
import * as geminiService from '../../services/geminiService.ts';
import { CloseIcon, LightbulbIcon, FileTextIcon } from '../icons/SettingsIcon.tsx';
import { UserIcon } from '../icons/StudentIcons.tsx';

interface SmartSuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SuggestionItem: React.FC<{ suggestion: SmartSuggestion }> = ({ suggestion }) => {
    const isIndividual = suggestion.type === 'individual';
    const Icon = isIndividual ? UserIcon : FileTextIcon;
    return (
        <li className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-lg">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isIndividual ? 'bg-blue-500/50' : 'bg-purple-500/50'}`}>
                <Icon className={`w-6 h-6 ${isIndividual ? 'text-blue-200' : 'text-purple-200'}`} />
            </div>
            <div>
                {isIndividual && suggestion.studentName && <p className="font-bold text-indigo-300">{suggestion.studentName}</p>}
                <p className="text-gray-300">{suggestion.suggestion}</p>
            </div>
        </li>
    );
};

const SmartSuggestionModal: React.FC<SmartSuggestionModalProps> = ({ isOpen, onClose }) => {
    const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchSuggestions = async () => {
                setIsLoading(true);
                setError(null);
                setSuggestions([]);
                try {
                    const result = await geminiService.generateSmartSuggestions();
                    setSuggestions(result);
                } catch (e) {
                    setError('Failed to generate suggestions. Please try again later.');
                    console.error(e);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSuggestions();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg relative p-8">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <CloseIcon />
                </button>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <LightbulbIcon className="text-yellow-300"/>
                    AI Smart Suggestions
                </h2>

                {isLoading && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
                        <p className="text-gray-400">Analyzing class data...</p>
                    </div>
                )}
                {error && <p className="text-red-400 text-center py-8">{error}</p>}
                
                {!isLoading && !error && (
                     <ul className="space-y-4 max-h-96 overflow-y-auto">
                        {suggestions.length > 0 ? (
                            suggestions.map((s, i) => <SuggestionItem key={i} suggestion={s} />)
                        ) : (
                            <p className="text-gray-500 text-center py-8">No specific suggestions at this time. Looks like a great day!</p>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default SmartSuggestionModal;