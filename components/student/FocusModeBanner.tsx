import React, { useState, useEffect } from 'react';
import { FocusSession } from '../../services/focusService.ts';
import { StudentProfile } from '../../types.ts';
import * as focusService from '../../services/focusService.ts';
import Button from '../common/Button.tsx';
import { HelpCircleIcon } from '../icons/SettingsIcon.tsx';

interface FocusModeBannerProps {
    session: FocusSession;
    student: StudentProfile;
}

const formatTime = (ms: number): string => {
    if (ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const FocusModeBanner: React.FC<FocusModeBannerProps> = ({ session, student }) => {
    const [timeLeft, setTimeLeft] = useState(session.endTime - Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            const remaining = session.endTime - Date.now();
            setTimeLeft(remaining > 0 ? remaining : 0);
        }, 1000);

        return () => clearInterval(timer);
    }, [session.endTime]);
    
    const handleNeedHelp = () => {
        focusService.updateStudentStatus(student.id, 'needs_help');
    };

    const studentStatus = session.studentStatuses[student.id];
    
    let statusMessage = "Stay focused! You can do it.";
    let bgColor = "bg-indigo-900/80 border-indigo-700";
    if (studentStatus === 'distracted') {
        statusMessage = "It looks like you're distracted. Come back to your lesson!";
        bgColor = "bg-yellow-900/80 border-yellow-700";
    } else if (studentStatus === 'needs_help') {
        statusMessage = "Your teacher has been notified that you need help.";
        bgColor = "bg-red-900/80 border-red-700";
    }

    return (
        <div className={`fixed bottom-0 left-0 right-0 p-4 ${bgColor} backdrop-blur-md border-t-2 z-50 transition-colors duration-500`} role="status">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                    <h3 className="text-lg font-bold text-white">Focus Window Active</h3>
                    <p className="text-sm text-gray-300">{statusMessage}</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold font-mono tracking-widest text-white" aria-label="Time remaining">{formatTime(timeLeft)}</div>
                        <div className="text-xs text-gray-400">Time Remaining</div>
                    </div>
                    <Button 
                        onClick={handleNeedHelp} 
                        variant="secondary" 
                        className="!p-4"
                        disabled={studentStatus === 'needs_help'}
                        aria-label="I need help"
                    >
                       <HelpCircleIcon className="w-6 h-6" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FocusModeBanner;
