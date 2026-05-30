import React, { useState } from 'react';
import AdminDashboardView from './AdminDashboardView.tsx';
import FairnessEquityView from './FairnessDashboardView.tsx';
import StudentSupportView from './StudentSupportView.tsx';
import StaffOverviewView from './StaffOverviewView.tsx';
import SchoolArchiveView from './SchoolArchiveView.tsx';
import ApprovalsView from './ApprovalsView.tsx';
import CommunicationsView from './CommunicationsView.tsx';
import AICopilotView from './AICopilotView.tsx';
import CalendarView from '../common/CalendarView.tsx';
import UserManagementView from './UserManagementView.tsx';
import { HomeIcon, BalanceIcon, HeartHandshakeIcon, UsersIcon, FileLockIcon, GavelIcon, MegaphoneIcon, SparklesIcon, CalendarIcon } from '../icons/SettingsIcon.tsx';
import Button from '../common/Button.tsx';

type AdminView = 'dashboard' | 'fairness_equity' | 'student_support' | 'staff_overview' | 'approvals' | 'communications' | 'school_archive' | 'ai_copilot' | 'calendar' | 'user_management';

interface AdministrationPortalProps {
    onExit: () => void;
}

const AdministrationPortal: React.FC<AdministrationPortalProps> = ({ onExit }) => {
    const [activeView, setActiveView] = useState<AdminView>('dashboard');

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
        { id: 'ai_copilot', label: 'AI Copilot', icon: SparklesIcon },
        { id: 'user_management', label: 'User Management', icon: UsersIcon },
        { id: 'calendar', label: 'School Calendar', icon: CalendarIcon },
        { id: 'fairness_equity', label: 'Fairness & Equity', icon: BalanceIcon },
        { id: 'student_support', label: 'Student Support Hub', icon: HeartHandshakeIcon },
        { id: 'staff_overview', label: 'Staff Overview', icon: UsersIcon },
        { id: 'approvals', label: 'Approvals & Actions', icon: GavelIcon },
        { id: 'communications', label: 'School Comms', icon: MegaphoneIcon },
        { id: 'school_archive', label: 'School Archive', icon: FileLockIcon },
    ];

    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <AdminDashboardView />;
            case 'fairness_equity': return <FairnessEquityView />;
            case 'student_support': return <StudentSupportView />;
            case 'staff_overview': return <StaffOverviewView />;
            case 'approvals': return <ApprovalsView />;
            case 'communications': return <CommunicationsView />;
            case 'school_archive': return <SchoolArchiveView />;
            case 'ai_copilot': return <AICopilotView />;
            case 'calendar': return <CalendarView role="administration" />;
            case 'user_management': return <UserManagementView />;
            default: return <AdminDashboardView />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200">
            <aside className="w-20 lg:w-64 bg-gray-800 p-4 lg:p-6 flex flex-col border-r border-gray-700">
                <div className="mb-8 hidden lg:block">
                    <h1 className="text-2xl font-bold text-white">Sovereign OS</h1>
                    <p className="text-xs text-gray-400">Admin Portal</p>
                </div>
                <nav className="flex flex-col gap-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id as AdminView)}
                            className={`flex items-center gap-4 p-3 rounded-lg transition-colors text-sm lg:text-base ${
                                activeView === item.id
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
                 <div className="mt-auto hidden lg:block">
                    <Button onClick={onExit} variant="secondary" className="w-full">
                        &larr; Exit Portal
                    </Button>
                </div>
                 <button onClick={onExit} title="Exit Portal" className="mt-auto lg:hidden p-3 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
            </aside>
            <div className="flex-1 overflow-hidden">
                {renderView()}
            </div>
        </div>
    );
};

export default AdministrationPortal;