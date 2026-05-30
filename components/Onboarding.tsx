import React, { useState, useCallback, useEffect, useRef } from 'react';
import { mockTeacher } from '../hooks/useUserProfile.ts';
import * as studentDataService from '../services/studentDataService.ts';
import * as focusService from '../services/focusService.ts';
import { FocusSession } from '../services/focusService.ts';
import AttentionGauge from './GenerationOutput.tsx';
import ClassRoster from './ClassRoster.tsx';
import Button from './common/Button.tsx';
import { FocusIcon, MicIcon, LightbulbIcon, ThumbsUpIcon, ExportIcon } from './icons/SettingsIcon.tsx';
import IncidentModal from './MainApp.tsx';
import SmartSuggestionModal from './SmartSuggestionModal.tsx';
import { StudentProfile, IncidentType, Incident, CommunicationTopic, StudentStatus } from '../types.ts';

interface DashboardViewProps {
    onSelectStudent: (studentId: string) => void;
    onContactParent: (studentId: string, topic?: CommunicationTopic) => void;
}

const initialIncidentData = { 
    studentId: '', 
    summary: '', 
    severity: 'low' as 'low' | 'medium' | 'high',
    incidentType: 'Disruption' as IncidentType,
};

const DashboardView: React.FC<DashboardViewProps> = ({ onSelectStudent, onContactParent }) => {
    // State for student data and modals
    const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>(() => studentDataService.getStudentProfiles());
    const [isIncidentModalOpen, setIncidentModalOpen] = useState(false);
    const [isSuggestionModalOpen, setSuggestionModalOpen] = useState(false);
    const [incidentInitialData, setIncidentInitialData] = useState<Partial<typeof initialIncidentData> | undefined>(undefined);
    
    // Focus Window State
    const [focusSession, setFocusSession] = useState<FocusSession | null>(() => focusService.getFocusSession());
    const [attentionScore, setAttentionScore] = useState(88); // Default
    const timerRef = useRef<number | null>(null);

    const refreshDashboardData = useCallback(() => {
        setStudentProfiles(studentDataService.getStudentProfiles());
    }, []);
    
    useEffect(() => {
        const poll = () => {
            const session = focusService.getFocusSession();
            setFocusSession(session);

            if (session && session.isActive) {
                const statuses = Object.values(session.studentStatuses);
                const focusedCount = statuses.filter(s => s === 'focused').length;
                const totalTracked = statuses.length;
                const score = totalTracked > 0 ? Math.round((focusedCount / totalTracked) * 100) : 100;
                setAttentionScore(score);

                // Update student profiles with new statuses from the session
                setStudentProfiles(prevProfiles => {
                    return prevProfiles.map(p => {
                        if (session.studentStatuses[p.id]) {
                            return { ...p, status: session.studentStatuses[p.id] as StudentStatus };
                        }
                        return p;
                    });
                });
            } else {
                // Reset statuses when session ends, but avoid rapid state changes
                if (studentProfiles.some(p => ['focused', 'distracted', 'needs_help'].includes(p.status))) {
                     refreshDashboardData();
                }
                setAttentionScore(88); // Reset score
            }
        };

        timerRef.current = window.setInterval(poll, 2000); // Poll every 2 seconds

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [refreshDashboardData]);


    const openIncidentModal = (initialData?: Partial<typeof initialIncidentData>) => {
        setIncidentInitialData(initialData);
        setIncidentModalOpen(true);
    };

    const handleIncidentModalClose = () => {
        setIncidentModalOpen(false);
        refreshDashboardData();
    };
    
    const handleToggleFocusWindow = () => {
        if (focusSession && focusSession.isActive) {
            focusService.endFocusSession();
            setFocusSession(null);
        } else {
            const session = focusService.startFocusSession(15); // 15 minute session
            setFocusSession(session);
        }
    };

    const handleExportSummary = () => {
        const today = new Date().toISOString().split('T')[0];
        const allIncidents = studentDataService.getStudentProfiles().flatMap(p => p.incidents);
        const todaysIncidents = allIncidents.filter(inc => inc.timestamp.startsWith(today));

        const positiveBehaviors = todaysIncidents.filter(inc => inc.incidentType === 'Positive Behavior');
        const otherIncidents = todaysIncidents.filter(inc => inc.incidentType !== 'Positive Behavior');

        const praisedStudents = [...new Set(positiveBehaviors.map(inc => inc.studentName))].join(', ') || 'None';
        const otherStudents = [...new Set(otherIncidents.map(inc => inc.studentName))].join(', ') || 'None';

        const summaryText = `
Sovereign School OS - Daily Summary
Date: ${new Date().toLocaleDateString()}
Teacher: ${mockTeacher.name}
---

Key Events:
- Positive Behaviors Logged: ${positiveBehaviors.length}
- Other Incidents Logged: ${otherIncidents.length}

---

Students Praised:
- ${praisedStudents}

Students Needing Attention:
- ${otherStudents}

---

Detailed Incidents:
${todaysIncidents.length > 0 ? todaysIncidents.map(inc => `- [${new Date(inc.timestamp).toLocaleTimeString()}] ${inc.studentName} - ${inc.incidentType}: ${inc.summary}`).join('\n') : "No incidents to report."}
        `;

        const blob = new Blob([summaryText.trim()], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Daily_Summary_${today}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const isFocusWindowActive = focusSession && focusSession.isActive;

    return (
        <div className="flex flex-col h-full">
            <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 flex justify-between items-center z-10 flex-shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-white">{mockTeacher.name}</h1>
                    <p className="text-sm text-gray-400">{mockTeacher.classId}</p>
                </div>
                <div className="flex items-center gap-4">
                    <AttentionGauge score={attentionScore} />
                    <Button variant="secondary" onClick={handleExportSummary} title="Export Daily Summary">
                        <ExportIcon className="w-5 h-5" />
                    </Button>
                    <Button onClick={handleToggleFocusWindow}>
                        <FocusIcon className="w-5 h-5 mr-2" />
                        {isFocusWindowActive ? 'End Focus Window' : 'Start Focus Window'}
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto">
                <div className="lg:col-span-2 space-y-6">
                     <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Button variant="secondary" onClick={() => openIncidentModal()} className="!py-4 !text-base flex flex-col items-center justify-center h-24">
                                <MicIcon className="w-6 h-6 mb-2 text-red-400" />
                                Record Incident
                            </Button>
                            <Button variant="secondary" onClick={() => openIncidentModal({ incidentType: 'Positive Behavior' })} className="!py-4 !text-base flex flex-col items-center justify-center h-24">
                                <ThumbsUpIcon className="w-6 h-6 mb-2 text-green-400" />
                                Praise Student
                            </Button>
                            <Button variant="secondary" onClick={() => setSuggestionModalOpen(true)} className="!py-4 !text-base flex flex-col items-center justify-center h-24">
                                <LightbulbIcon className="w-6 h-6 mb-2 text-yellow-300" />
                                AI Suggestion
                            </Button>
                        </div>
                    </div>
                    <ClassRoster students={studentProfiles} onSelectStudent={onSelectStudent} onContactParent={onContactParent} />
                </div>
                <div className="space-y-6">
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                         <h2 className="text-xl font-bold mb-4">Today's Priorities</h2>
                         <ul className="space-y-3 list-disc list-inside text-gray-300">
                            <li>Review IEP draft for Frank Green</li>
                            <li>Prepare for parent-teacher conference</li>
                            <li>Grade recent math quiz</li>
                         </ul>
                    </div>
                     <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                         <h2 className="text-xl font-bold mb-4">Parent Replies</h2>
                         <p className="text-sm text-gray-400">No unread messages.</p>
                    </div>
                </div>
            </main>
             <IncidentModal 
                isOpen={isIncidentModalOpen} 
                onClose={handleIncidentModalClose}
                initialData={incidentInitialData}
            />
            <SmartSuggestionModal 
                isOpen={isSuggestionModalOpen}
                onClose={() => setSuggestionModalOpen(false)}
            />
        </div>
    );
};

export default DashboardView;
