import React from 'react';
import { StudentProfile } from '../../types.ts';
import ReflectionView from './ReflectionView.tsx';
import ProfileSettingsView from './ProfileSettingsView.tsx';
import { CheckCircleIcon } from '../icons/StudentIcons.tsx';

interface ProgressViewProps {
    student: StudentProfile;
    onUpdate: () => void;
}

const QuizHistory: React.FC<{ student: StudentProfile }> = ({ student }) => {
    const sortedQuizzes = [...student.quizAttempts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Quiz History</h2>
            {sortedQuizzes.length > 0 ? (
                <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {sortedQuizzes.map(qa => (
                        <li key={qa.id} className="bg-gray-700/50 p-3 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-white">{qa.quizTitle}</p>
                                <p className="text-xs text-gray-400">Taken: {new Date(qa.timestamp).toLocaleString()}</p>
                            </div>
                            <p className={`font-bold text-xl ${qa.score >= 80 ? 'text-green-400' : qa.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{qa.score}%</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <CheckCircleIcon className="w-12 h-12 mx-auto mb-2" />
                    <p>You haven't completed any quizzes yet.</p>
                </div>
            )}
        </div>
    );
};

const ProgressView: React.FC<ProgressViewProps> = ({ student, onUpdate }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                 <ReflectionView student={student} onUpdate={onUpdate} />
                 <QuizHistory student={student} />
            </div>
            <div className="lg:col-span-1">
                 <ProfileSettingsView student={student} onUpdate={onUpdate} />
            </div>
        </div>
    );
};

export default ProgressView;