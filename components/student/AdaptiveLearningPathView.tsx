import React from 'react';
import { StudentProfile, LearningRecommendation } from '../../types.ts';
import Button from '../common/Button.tsx';
import { PathIcon, BookIcon, BrainCircuitIcon } from '../icons/StudentIcons.tsx';

interface AdaptiveLearningPathViewProps {
    student: StudentProfile;
    onGenerate: () => void;
    isLoading: boolean;
}

const RecommendationCard: React.FC<{ item: LearningRecommendation }> = ({ item }) => {
    const difficultyColors = {
        easy: 'border-green-500',
        medium: 'border-yellow-500',
        hard: 'border-red-500',
    };
    const Icon = item.type === 'lesson' ? BookIcon : BrainCircuitIcon;
    return (
        <div className={`bg-gray-700/50 p-4 rounded-lg border-l-4 ${difficultyColors[item.difficulty]}`}>
            <div className="flex items-start gap-4">
                <Icon className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
                <div>
                    <p className="font-bold text-white">{item.title}</p>
                    <p className="text-xs text-gray-400 uppercase font-semibold">{item.topic} • {item.type}</p>
                    <p className="text-sm text-gray-300 mt-2">{item.description}</p>
                </div>
                 <Button variant="secondary" className="!text-xs !py-1 !px-2 ml-auto">Start</Button>
            </div>
        </div>
    );
};


const AdaptiveLearningPathView: React.FC<AdaptiveLearningPathViewProps> = ({ student, onGenerate, isLoading }) => {
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <PathIcon className="w-7 h-7 text-indigo-400" />
                    Your Learning Path
                </h2>
                <Button onClick={onGenerate} disabled={isLoading || student.quizAttempts.length === 0} title={student.quizAttempts.length === 0 ? "Complete a quiz to generate a path" : ""}>
                    {isLoading ? 'Analyzing...' : 'Generate My Next Steps'}
                </Button>
            </div>
            {isLoading && (
                 <div className="text-center py-8 text-gray-400">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
                    <p>Analyzing your results to build your personalized path...</p>
                </div>
            )}
            {!isLoading && student.learningPath.length > 0 && (
                <div className="space-y-3">
                    {student.learningPath.map((item, index) => (
                        <RecommendationCard key={index} item={item} />
                    ))}
                </div>
            )}
            {!isLoading && student.learningPath.length === 0 && (
                 <div className="text-center py-8 text-gray-500">
                    <p>
                        {student.quizAttempts.length === 0 
                            ? "After you take a quiz, your personalized next steps will appear here."
                            : "You're doing great! Click 'Generate My Next Steps' to see what to work on next."
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

export default AdaptiveLearningPathView;