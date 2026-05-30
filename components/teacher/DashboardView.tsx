import React, { useState, useCallback, useEffect } from 'react';
import * as studentDataService from '../../services/studentDataService.ts';
import AttentionGauge from './AttentionGauge.tsx';
import ClassRoster from './ClassRoster.tsx';
import Button from '../common/Button.tsx';
import { FocusIcon, MicIcon, LightbulbIcon, ThumbsUpIcon, ExportIcon, TrashIcon, PlusIcon } from '../icons/SettingsIcon.tsx';
import IncidentModal from './IncidentModal.tsx';
import SmartSuggestionModal from './SmartSuggestionModal.tsx';
import { StudentProfile, IncidentType, CommunicationTopic, Priority, Teacher } from '../../types.ts';
import * as priorityService from '../../services/priorityService.ts';

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
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>(() => studentDataService.getStudentProfiles());
    const [isIncidentModalOpen, setIncidentModalOpen] = useState(false);
    const [isSuggestionModalOpen, setSuggestionModalOpen] = useState(false);
    const [incidentInitialData, setIncidentInitialData] = useState<Partial<typeof initialIncidentData> | undefined>(undefined);

    const [priorities, setPriorities] = useState<Priority[]>([]);
    const [newPriorityText, setNewPriorityText] = useState('');
    
    useEffect(() => {
        // In a real app with auth, you'd get the logged-in teacher. Here we take the first.
        const currentTeacher = studentDataService.getTeachers()[0];
        setTeacher(currentTeacher);
    }, []);

    useEffect(() => {
        setPriorities(priorityService.getPriorities());
    }, []);

    const handleAddPriority = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPriorityText.trim()) {
            const newPriorities = priorityService.addPriority(newPriorityText.trim());
            setPriorities(newPriorities);
            setNewPriorityText('');
        }
    };

    const handleTogglePriority = (id: string) => {
        const newPriorities = priorityService.togglePriority(id);
        setPriorities(newPriorities);
    };

    const handleDeletePriority = (id: string) => {
        const newPriorities = priorityService.deletePriority(id);
        setPriorities(newPriorities);
    };


    const refreshDashboardData = useCallback(() => {
        setStudentProfiles(studentDataService.getStudentProfiles());
    }, []);

    const openIncidentModal = (initialData?: Partial<typeof initialIncidentData>) => {
        setIncidentInitialData(initialData);
        setIncidentModalOpen(true);
    };

    const handleIncidentModalClose = () => {
        setIncidentModalOpen(false);
        refreshDashboardData();
    };

    const handleExportSummary = () => {
        if (!teacher) return;
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
Teacher: ${teacher.name}
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
    
    return (
        <div className="flex flex-col h-full">
            <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 flex justify-between items-center z-10 flex-shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-white">{teacher?.name}</h1>
                    <p className="text-sm text-gray-400">{teacher?.classId}</p>
                </div>
                <div className="flex items-center gap-4">
                    <AttentionGauge score={88} />
                    <Button variant="secondary" onClick={handleExportSummary} title="Export Daily Summary">
                        <ExportIcon className="w-5 h-5" />
                    </Button>
                    <Button>
                        <FocusIcon className="w-5 h-5 mr-2" />
                        Start Focus Window
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
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
                        <h2 className="text-xl font-bold mb-4">Today's Priorities</h2>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-4">
                            {priorities.length > 0 ? (
                                priorities.map(p => (
                                    <div 
                                        key={p.id} 
                                        className={`flex items-center group transition-colors duration-300 rounded-md p-2 -m-2 ${
                                            p.isCompleted ? 'bg-green-900/40' : 'hover:bg-gray-700/50'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            id={`priority-${p.id}`}
                                            checked={p.isCompleted}
                                            onChange={() => handleTogglePriority(p.id)}
                                            className="w-5 h-5 bg-gray-700 border-gray-600 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <label 
                                            htmlFor={`priority-${p.id}`} 
                                            className={`ml-3 flex-1 text-gray-300 cursor-pointer transition-colors duration-300 ${
                                                p.isCompleted ? 'line-through text-gray-500' : ''
                                            }`}
                                        >
                                            {p.text}
                                        </label>
                                        <button
                                            onClick={() => handleDeletePriority(p.id)}
                                            className="ml-2 p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label="Delete priority"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">No priorities set for today.</p>
                            )}
                        </div>
                        <form onSubmit={handleAddPriority} className="flex gap-2 border-t border-gray-700 pt-4 mt-auto">
                            <input
                                type="text"
                                value={newPriorityText}
                                onChange={(e) => setNewPriorityText(e.target.value)}
                                placeholder="Add a new priority..."
                                className="flex-1 bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                            <Button type="submit" className="!p-2.5" aria-label="Add priority">
                                <PlusIcon className="w-5 h-5" />
                            </Button>
                        </form>
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