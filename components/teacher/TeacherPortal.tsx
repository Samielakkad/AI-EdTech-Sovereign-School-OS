import React, { useState } from 'react';
import DashboardView from './DashboardView.tsx';
import IncidentsView from './IncidentsView.tsx';
import IEPCopilotView from './IEPCopilotView.tsx';
import CommunicationsView from './CommunicationsView.tsx';
import AdventureArchitectView from './AdventureArchitectView.tsx';
import StudentDashboardView from './StudentDashboardView.tsx';
import LessonPlannerView from './LessonPlannerView.tsx';
import AICoachView from './AICoachView.tsx';
import CourseSummaryView from './CourseSummaryView.tsx';
import MyLibraryView from './MyLibraryView.tsx';
import CalendarView from '../common/CalendarView.tsx';
import { HomeIcon, ShieldAlertIcon, FileTextIcon, MailIcon, BookOpenIcon, ClipboardListIcon, SparklesIcon, LayersIcon, CalendarIcon } from '../icons/SettingsIcon.tsx';
import { CommunicationTopic } from '../../types.ts';

type View = 'dashboard' | 'incidents' | 'iep_copilot' | 'communications' | 'adventure_architect' | 'lesson_planner' | 'ai_coach' | 'course_summary' | 'my_library' | 'calendar';

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'lesson_planner', label: 'Lesson Planner', icon: ClipboardListIcon },
    { id: 'adventure_architect', label: 'Adventure Architect', icon: BookOpenIcon },
    { id: 'my_library', label: 'My Library', icon: LayersIcon },
    { id: 'ai_coach', label: 'AI Coach', icon: SparklesIcon },
    { id: 'course_summary', label: 'Course Summary', icon: LayersIcon },
    { id: 'incidents', label: 'Incident Ledger', icon: ShieldAlertIcon },
    { id: 'iep_copilot', label: 'IEP Copilot', icon: FileTextIcon },
    { id: 'communications', label: 'Communications', icon: MailIcon },
];

const TeacherPortal: React.FC = () => {
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [contactStudentInfo, setContactStudentInfo] = useState<{ studentId: string; topic?: CommunicationTopic } | null>(null);

    const handleNavClick = (view: View) => {
        setActiveView(view);
        setSelectedStudentId(null);
        setContactStudentInfo(null);
    };

    const handleContactParent = (studentId: string, topic?: CommunicationTopic) => {
        setContactStudentInfo({ studentId, topic });
        setActiveView('communications');
        setSelectedStudentId(null);
    };

    const renderView = () => {
        if (selectedStudentId) {
            return <StudentDashboardView 
                studentId={selectedStudentId} 
                onBack={() => setSelectedStudentId(null)}
                onContactParent={handleContactParent} 
            />;
        }

        switch (activeView) {
            case 'dashboard': 
                return <DashboardView onSelectStudent={setSelectedStudentId} onContactParent={handleContactParent} />;
            case 'calendar':
                return <CalendarView role="teacher" />;
            case 'incidents': 
                return <IncidentsView />;
            case 'iep_copilot': 
                return <IEPCopilotView />;
            case 'communications': 
                return <CommunicationsView 
                    targetStudentId={contactStudentInfo?.studentId}
                    suggestedTopic={contactStudentInfo?.topic}
                    onTargetHandled={() => setContactStudentInfo(null)}
                />;
            case 'adventure_architect': 
                return <AdventureArchitectView />;
            case 'lesson_planner': 
                return <LessonPlannerView />;
            case 'ai_coach':
                return <AICoachView />;
            case 'course_summary':
                return <CourseSummaryView />;
            case 'my_library':
                return <MyLibraryView />;
            default: 
                return <DashboardView onSelectStudent={setSelectedStudentId} onContactParent={handleContactParent} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200">
            <aside className="w-20 lg:w-64 bg-gray-800 p-4 lg:p-6 flex flex-col border-r border-gray-700">
                <div className="mb-8 hidden lg:block">
                    <h1 className="text-2xl font-bold text-white">Sovereign OS</h1>
                    <p className="text-xs text-gray-400">Teacher Portal</p>
                </div>
                <nav className="flex flex-col gap-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id as View)}
                            className={`flex items-center gap-4 p-3 rounded-lg transition-colors text-sm lg:text-base ${
                                activeView === item.id && !selectedStudentId
                                ? 'bg-indigo-600 text-white shadow-lg' 
                                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                            }`}
                            title={item.label}
                        >
                            <item.icon className="w-6 h-6 flex-shrink-0" />
                            <span className="hidden lg:inline">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>
            <div className="flex-1 overflow-hidden">
                {renderView()}
            </div>
        </div>
    );
};

export default TeacherPortal;