import React from 'react';
import { StudentProfile } from '../../types.ts';
import Button from '../common/Button.tsx';
import { CoinIcon, FlameIcon, BookIcon, MessageCircleIcon } from '../icons/StudentIcons.tsx';

interface StudentHeaderProps {
    student: StudentProfile;
    onBack: () => void;
    onAskAstra: () => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; color: string; }> = ({ icon, label, value, color }) => (
    <div className={`flex items-center p-4 rounded-lg bg-gray-800/50 border border-gray-700`}>
        <div className={`p-3 rounded-full mr-4 ${color}`}>
            {icon}
        </div>
        <div>
            <div className="text-3xl font-bold text-white">{value}</div>
            <div className="text-sm text-gray-400">{label}</div>
        </div>
    </div>
);

const StudentHeader: React.FC<StudentHeaderProps> = ({ student, onBack, onAskAstra }) => {
    return (
        <header>
             <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-4xl font-bold text-white">Welcome, {student.name.split(' ')[0]}!</h1>
                    <p className="text-lg text-indigo-300">Let's have a great day of learning.</p>
                </div>
                <Button onClick={onBack} variant="secondary">
                   &larr; Log Out
                </Button>
            </div>
             <div className="mt-6 p-6 bg-indigo-900/40 rounded-lg flex items-center justify-between border border-indigo-700">
                <div>
                    <h2 className="text-xl font-bold">Have a question?</h2>
                    <p className="text-indigo-200">Professor Astra is here to help you with your lessons!</p>
                </div>
                <Button onClick={onAskAstra} className="!px-6 !py-3 !text-base flex items-center gap-2">
                    <MessageCircleIcon className="w-5 h-5" />
                    Ask Professor Astra
                </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <StatCard 
                    icon={<CoinIcon className="w-6 h-6 text-white"/>} 
                    label="Total Points" 
                    value={student.points}
                    color="bg-yellow-500/80"
                />
                 <StatCard 
                    icon={<FlameIcon className="w-6 h-6 text-white"/>} 
                    label="Focus Streak" 
                    value={`${student.focusStreak} Days`}
                    color="bg-red-500/80"
                />
                 <StatCard 
                    icon={<BookIcon className="w-6 h-6 text-white"/>} 
                    label="Reading Streak" 
                    value={`${student.readingStreak} Days`}
                    color="bg-blue-500/80"
                />
            </div>
        </header>
    );
};

export default StudentHeader;
