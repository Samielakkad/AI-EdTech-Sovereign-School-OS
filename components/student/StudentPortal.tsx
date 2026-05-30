import React, { useState, useEffect } from 'react';
import { StudentProfile, Quiz } from '../../types.ts';
import * as studentDataService from '../../services/studentDataService.ts';
import Select from '../common/Select.tsx';
import Button from '../common/Button.tsx';
import StudentHeader from './StudentHeader.tsx';
import QuestsView from './QuestsView.tsx';
import ProgressView from './ProgressView.tsx';
import LearningHubView from './LearningHubView.tsx';
import QuizView from './QuizView.tsx';
import AITeacherView from './AITeacherView.tsx';
import AdventuresView from './StoriesView.tsx';
import ClassSummariesView from './ClassSummariesView.tsx';
import CalendarView from '../common/CalendarView.tsx';
import { GraduationCapIcon, SparklesIcon, CheckCircleIcon, MessageCircleIcon, BookIcon, LayersIcon } from '../icons/StudentIcons.tsx';
import { CalendarIcon, CloseIcon } from '../icons/SettingsIcon.tsx';
import FocusModeBanner from './FocusModeBanner.tsx';
import * as focusService from '../../services/focusService.ts';
import { FocusSession } from '../../services/focusService.ts';
import { HEROES, Hero } from '../../services/heroData.ts';

interface StudentPortalProps {
    onExit: () => void;
}

type StudentView = 'dashboard' | 'quiz';
type Tab = 'learning_hub' | 'ai_teacher' | 'quests' | 'adventures' | 'summaries' | 'progress' | 'calendar';

const WelcomeModal: React.FC<{ student: StudentProfile; hero: Hero; onClose: () => void; }> = ({ student, hero, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
            <div className={`bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg relative p-8 border-2 ${hero.theme.primary.replace('bg-', 'border-')} text-center`}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><CloseIcon /></button>
                <h1 className="text-3xl font-bold text-white mb-2">Welcome, {student.name.split(' ')[0]}!</h1>
                <p className="text-indigo-200 mb-6">Your learning companion for today is...</p>
                <div className={`p-6 rounded-lg ${hero.theme.secondary}`}>
                    <div className="text-6xl mb-4">{hero.avatar}</div>
                    <h2 className={`text-4xl font-bold ${hero.theme.accent}`}>{hero.name}</h2>
                    <p className="text-gray-300 mt-2">{hero.description}</p>
                </div>
                <Button onClick={onClose} className={`!text-lg !px-8 !py-3 mt-8 ${hero.theme.primary}`}>Let's Go!</Button>
            </div>
        </div>
    );
};


const StudentPortal: React.FC<StudentPortalProps> = ({ onExit }) => {
    const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
    const [currentView, setCurrentView] = useState<StudentView>('dashboard');
    const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
    const [focusSession, setFocusSession] = useState<FocusSession | null>(null);

    useEffect(() => {
        setAllStudents(studentDataService.getStudentProfiles());
    }, []);

    const refreshStudentProfile = () => {
        if (selectedStudentId) {
            const profile = studentDataService.getStudentProfile(selectedStudentId);
            setStudentProfile(profile ? {...profile} : null);
        }
    };

    useEffect(() => {
        if (selectedStudentId) {
            refreshStudentProfile();
        } else {
            setStudentProfile(null);
        }
    }, [selectedStudentId]);
    
    useEffect(() => {
        // Poll for focus session state
        const interval = setInterval(() => {
            const session = focusService.getFocusSession();
            setFocusSession(session && session.isActive ? session : null);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!selectedStudentId) return;

        const handleVisibilityChange = () => {
            const currentSession = focusService.getFocusSession();
            if (!currentSession || !currentSession.isActive) return;

            if (document.hidden) {
                focusService.updateStudentStatus(selectedStudentId, 'distracted');
            } else {
                if (currentSession.studentStatuses[selectedStudentId] === 'distracted') {
                    focusService.updateStudentStatus(selectedStudentId, 'focused');
                }
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [selectedStudentId]);

    const handleStartQuiz = (quiz: Quiz) => {
        setActiveQuiz(quiz);
        setCurrentView('quiz');
    };
    
    const handleQuizFinish = () => {
        setActiveQuiz(null);
        setCurrentView('dashboard');
        refreshStudentProfile();
    };

    if (!selectedStudentId || !studentProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="w-full max-w-sm p-8 bg-gray-800 rounded-lg shadow-2xl text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Welcome, Student!</h1>
                    <p className="text-gray-400 mb-6">Please select your name to continue.</p>
                    <Select 
                        label="Select Your Name"
                        value={selectedStudentId || ''}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                    >
                        <option value="" disabled>-- Select Name --</option>
                        {allStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                     <Button onClick={onExit} variant="secondary" className="w-full mt-8">
                        Back to Portal Select
                    </Button>
                </div>
            </div>
        );
    }
    
    if (currentView === 'quiz' && activeQuiz) {
        return (
            <>
                <QuizView student={studentProfile} quiz={activeQuiz} onFinish={handleQuizFinish} />
                {focusSession && <FocusModeBanner session={focusSession} student={studentProfile} />}
            </>
        );
    }

    return (
        <>
            <Dashboard student={studentProfile} onStartQuiz={handleStartQuiz} onLogout={() => setSelectedStudentId(null)} onUpdate={refreshStudentProfile} />
            {focusSession && <FocusModeBanner session={focusSession} student={studentProfile} />}
        </>
    );
};


const Dashboard: React.FC<{ student: StudentProfile, onStartQuiz: (quiz: Quiz) => void, onLogout: () => void, onUpdate: () => void }> = ({ student, onStartQuiz, onLogout, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<Tab>('learning_hub');
    const [showWelcome, setShowWelcome] = useState(false);
    
    const hero = HEROES.find(h => h.name === student.selectedHero);

    useEffect(() => {
        const welcomeShown = sessionStorage.getItem('welcomeMessageShown');
        if (!welcomeShown) {
            setShowWelcome(true);
        }
    }, []);

    const handleCloseWelcome = () => {
        sessionStorage.setItem('welcomeMessageShown', 'true');
        setShowWelcome(false);
    };

    const navItems = [
        { id: 'learning_hub', label: 'Learning Hub', icon: GraduationCapIcon },
        { id: 'ai_teacher', label: 'Professor Astra', icon: MessageCircleIcon },
        { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
        { id: 'quests', label: 'Daily Quests', icon: SparklesIcon },
        { id: 'adventures', label: 'My Adventures', icon: BookIcon },
        { id: 'summaries', label: 'Class Summaries', icon: LayersIcon },
        { id: 'progress', label: 'My Progress', icon: CheckCircleIcon },
    ];

    const renderTabContent = () => {
        switch(activeTab) {
            case 'learning_hub': return <LearningHubView student={student} onStartQuiz={onStartQuiz} onUpdate={onUpdate} />;
            case 'ai_teacher': return <AITeacherView student={student} />;
            case 'calendar': return <CalendarView role="student" studentId={student.id} />;
            case 'quests': return <QuestsView student={student} onUpdate={onUpdate} />;
            case 'adventures': return <AdventuresView student={student} />;
            case 'summaries': return <ClassSummariesView student={student} />;
            case 'progress': return <ProgressView student={student} onUpdate={onUpdate} />;
            default: return null;
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
            {showWelcome && hero && <WelcomeModal student={student} hero={hero} onClose={handleCloseWelcome} />}
            <div className="max-w-7xl mx-auto">
                <StudentHeader student={student} onBack={onLogout} onAskAstra={() => setActiveTab('ai_teacher')} />
                <main className="mt-8">
                     <div className="mb-6 border-b border-gray-700">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                            {navItems.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as Tab)}
                                    className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                        activeTab === tab.id
                                        ? 'border-indigo-400 text-indigo-300'
                                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                                    }`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="pb-24">
                        {renderTabContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StudentPortal;