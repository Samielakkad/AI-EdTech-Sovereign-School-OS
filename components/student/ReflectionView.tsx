import React, { useState } from 'react';
import { StudentProfile, Reflection } from '../../types.ts';
import Button from '../common/Button.tsx';
import * as studentDataService from '../../services/studentDataService.ts';

interface ReflectionViewProps {
    student: StudentProfile;
    onUpdate: () => void;
}

type Mood = Reflection['mood'];

const moodEmojis = {
    great: '🥳',
    good: '😊',
    okay: '😐',
    bad: '😕',
};

const ReflectionView: React.FC<ReflectionViewProps> = ({ student, onUpdate }) => {
    const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
    const [comment, setComment] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const hasReflectedToday = student.reflections.some(r => r.date.startsWith(today));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMood) return;

        studentDataService.addReflectionToStudent(student.id, { mood: selectedMood, comment });
        setIsSubmitted(true);
        onUpdate();
        
        setTimeout(() => {
            setSelectedMood(null);
            setComment('');
            setIsSubmitted(false);
        }, 3000)
    };
    
    if (hasReflectedToday && !isSubmitted) {
        return (
             <div className="bg-gray-800 rounded-lg shadow-lg p-6 text-center">
                <h2 className="text-2xl font-bold mb-2">Reflection Complete!</h2>
                <p className="text-gray-400">You've already submitted your reflection for today. See you tomorrow!</p>
                <div className="text-6xl mt-4">🎉</div>
             </div>
        );
    }
    
    if (isSubmitted) {
        return (
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 text-center">
                <h2 className="text-2xl font-bold mb-2">Thanks for sharing!</h2>
                <p className="text-gray-400">Your reflection has been saved.</p>
                <div className="text-6xl mt-4">👍</div>
             </div>
        )
    }

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Daily Reflection</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">How was your day?</label>
                    <div className="flex justify-around bg-gray-700/50 p-2 rounded-lg">
                        {(Object.keys(moodEmojis) as Mood[]).map(mood => (
                            <button
                                key={mood}
                                type="button"
                                onClick={() => setSelectedMood(mood)}
                                className={`text-4xl p-2 rounded-full transition-transform duration-200 ${selectedMood === mood ? 'bg-indigo-600 scale-125' : 'hover:scale-110'}`}
                                aria-label={mood}
                            >
                                {moodEmojis[mood]}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="mb-4">
                     <label htmlFor="comment" className="block text-sm font-medium text-gray-300 mb-2">Anything you want to add?</label>
                     <textarea
                        id="comment"
                        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                        placeholder="e.g., I was proud of my math work today."
                        rows={3}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                    />
                </div>
                <Button type="submit" disabled={!selectedMood} className="w-full">
                    Submit Reflection
                </Button>
            </form>
        </div>
    );
};

export default ReflectionView;