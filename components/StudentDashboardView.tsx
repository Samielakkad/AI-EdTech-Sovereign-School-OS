



import React, { useState, useEffect } from 'react';
import { StudentProfile, Incident, IEPGoal, IncidentSeverity, IncidentType, CommunicationTopic } from '../types.ts';
import * as studentDataService from '../services/studentDataService.ts';
import Button from './common/Button.tsx';
import { BookIcon, BrainCircuitIcon, CoinIcon, FlameIcon } from './icons/StudentIcons.tsx';
import { MailIcon, UserCheckIcon } from './icons/SettingsIcon.tsx';

interface StudentDashboardViewProps {
    studentId: string;
    onBack: () => void;
    onContactParent: (studentId: string, topic?: CommunicationTopic) => void;
}

const severityStyles: { [key in IncidentSeverity]: string } = {
  low: 'bg-blue-800 text-blue-200',
  medium: 'bg-yellow-800 text-yellow-200',
  high: 'bg-red-800 text-red-200',
};

const typeStyles: { [key in IncidentType]: string } = {
  'Disruption': 'bg-purple-800 text-purple-200',
  'Off-task': 'bg-gray-600 text-gray-300',
  'Positive Behavior': 'bg-green-800 text-green-200',
  'Conflict': 'bg-orange-800 text-orange-200',
  'Safety Concern': 'bg-pink-800 text-pink-200',
};

const SeverityBadge: React.FC<{ severity: IncidentSeverity }> = ({ severity }) => (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${severityStyles[severity]}`}>
        {severity}
    </span>
);

const TypeBadge: React.FC<{ type: IncidentType }> = ({ type }) => (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${typeStyles[type] || typeStyles['Off-task']}`}>
        {type}
    </span>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; color: string; }> = ({ icon, label, value, color }) => (
    <div className={`flex items-center p-3 rounded-lg bg-gray-800/50 flex-1`}>
        <div className={`p-2 rounded-full mr-3 ${color}`}>
            {icon}
        </div>
        <div>
            <div className="text-xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
        </div>
    </div>
);

const StatusBadge: React.FC<{ status: 'completed' | 'failed' }> = ({ status }) => {
    if (!status) return null;
    const styles = {
        completed: 'bg-green-800 text-green-200',
        failed: 'bg-red-800 text-red-200',
    };
    const style = styles[status];
    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${style}`}>
            {status}
        </span>
    );
};


type Tab = 'goals' | 'incidents' | 'academics' | 'review';

const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ studentId, onBack, onContactParent }) => {
    const [student, setStudent] = useState<StudentProfile | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('academics');
    const [isParentView, setIsParentView] = useState(false);

    const refreshStudentData = () => {
         const profile = studentDataService.getStudentProfile(studentId);
         setStudent(profile || null);
    }

    useEffect(() => {
       refreshStudentData();
    }, [studentId]);

    const handleReviewQuest = (questId: string, isApproved: boolean) => {
        studentDataService.reviewQuestProof(studentId, questId, isApproved);
        refreshStudentData();
    };

    if (!student) {
        return (
            <div className="p-6 h-full flex items-center justify-center">
                <p className="text-gray-400">Loading student data...</p>
            </div>
        );
    }
    
    const sortedIncidents = [...student.incidents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const sortedGoals = [...student.iepGoals].sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
    const sortedQuizzes = [...student.quizAttempts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const questsToReview = student.quests.filter(q => q.status === 'pending_review');
    
    const hasRecentConcern = student.incidents.some(inc => 
        (inc.severity === 'high' || inc.severity === 'medium') && 
        (new Date(inc.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // last 7 days
    );
    const suggestedContactTopic = hasRecentConcern ? 'behavior_concern' : 'positive_update';

    return (
        <div className="p-6 h-full flex flex-col">
            <header className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                         <Button onClick={onBack} variant="secondary" className="mb-4">
                            &larr; Back to Dashboard
                        </Button>
                        <h1 className="text-3xl font-bold">{student.name}</h1>
                        <p className="text-gray-400">Student Dashboard</p>
                    </div>
                     <div className="flex flex-col items-end gap-4">
                        <Button onClick={() => onContactParent(studentId, suggestedContactTopic)}>
                            <MailIcon className="w-5 h-5 mr-2" />
                            Contact Parent
                        </Button>
                        <div className="flex items-center gap-4 bg-gray-800 p-3 rounded-lg">
                            <span className="text-sm font-medium">Parent View Preview</span>
                            <label htmlFor="parent-view-toggle" className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    id="parent-view-toggle" 
                                    className="sr-only peer"
                                    checked={isParentView}
                                    onChange={() => setIsParentView(!isParentView)}
                                />
                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
                 <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <StatCard 
                        icon={<CoinIcon className="w-5 h-5 text-white"/>} 
                        label="Total Points" 
                        value={student.points}
                        color="bg-yellow-500/80"
                    />
                    <StatCard 
                        icon={<FlameIcon className="w-5 h-5 text-white"/>} 
                        label="Focus Streak" 
                        value={`${student.focusStreak} Days`}
                        color="bg-red-500/80"
                    />
                    <StatCard 
                        icon={<BookIcon className="w-5 h-5 text-white"/>} 
                        label="Reading Streak" 
                        value={`${student.readingStreak} Days`}
                        color="bg-blue-500/80"
                    />
                    <StatCard 
                        icon={<UserCheckIcon className="w-5 h-5 text-white"/>} 
                        label="Attendance" 
                        value={`${student.attendancePercentage}%`}
                        color="bg-green-500/80"
                    />
                </div>
            </header>

            <div className="border-b border-gray-700 mb-6">
                <nav className="flex space-x-4" aria-label="Tabs">
                    <button onClick={() => setActiveTab('academics')} className={`px-3 py-2 font-medium text-sm rounded-md ${activeTab === 'academics' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                        Academics ({sortedQuizzes.length})
                    </button>
                    <button onClick={() => setActiveTab('goals')} className={`px-3 py-2 font-medium text-sm rounded-md ${activeTab === 'goals' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                        IEP Goals ({sortedGoals.length})
                    </button>
                    <button onClick={() => setActiveTab('incidents')} className={`px-3 py-2 font-medium text-sm rounded-md ${activeTab === 'incidents' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                        Incident History ({sortedIncidents.length})
                    </button>
                    {!isParentView && (
                         <button onClick={() => setActiveTab('review')} className={`relative px-3 py-2 font-medium text-sm rounded-md ${activeTab === 'review' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                            Review Submissions
                            {questsToReview.length > 0 && (
                                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                    {questsToReview.length}
                                </span>
                            )}
                        </button>
                    )}
                </nav>
            </div>

            <main className="flex-1 bg-gray-800 rounded-lg shadow-lg p-6 overflow-y-auto">
                {activeTab === 'goals' && (
                    <div>
                        <h2 className="text-xl font-bold mb-4">IEP Goals</h2>
                         {sortedGoals.length > 0 ? (
                            <ul className="space-y-4">
                                {sortedGoals.map(goal => (
                                    <li key={goal.id} className="bg-gray-700/50 p-4 rounded-md">
                                        <div className="flex justify-between items-center mb-2">
                                             <p className="font-semibold text-indigo-300">{goal.focusArea}</p>
                                            <p className="text-xs text-gray-400">{new Date(goal.dateCreated).toLocaleDateString()}</p>
                                        </div>
                                        <p className="text-sm text-gray-300 font-mono">{goal.goal}</p>
                                        {!isParentView && <span className="mt-2 inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-green-800 text-green-200 capitalize">{goal.status}</span>}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-center mt-8">No IEP goals have been saved for this student.</p>
                        )}
                    </div>
                )}

                {activeTab === 'incidents' && (
                     <div>
                        <h2 className="text-xl font-bold mb-4">Incident History</h2>
                        {sortedIncidents.length > 0 ? (
                            <table className="w-full text-sm text-left text-gray-300">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Date</th>
                                        <th scope="col" className="px-6 py-3">Type</th>
                                        <th scope="col" className="px-6 py-3">Summary</th>
                                        {!isParentView && <th scope="col" className="px-6 py-3">Severity</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedIncidents.map(incident => (
                                        <tr key={incident.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                            <td className="px-6 py-4 font-medium whitespace-nowrap">{new Date(incident.timestamp).toLocaleDateString()}</td>
                                            <td className="px-6 py-4"><TypeBadge type={incident.incidentType} /></td>
                                            <td className="px-6 py-4 max-w-sm truncate" title={incident.summary}>{incident.summary}</td>
                                            {!isParentView && <td className="px-6 py-4"><SeverityBadge severity={incident.severity} /></td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                             <p className="text-gray-500 text-center mt-8">No incidents have been logged for this student.</p>
                        )}
                    </div>
                )}
                
                {activeTab === 'academics' && (
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-xl font-bold mb-4">Quiz History</h2>
                            {sortedQuizzes.length > 0 ? (
                                <ul className="space-y-4">
                                    {sortedQuizzes.map(attempt => (
                                        <li key={attempt.id} className="bg-gray-700/50 p-4 rounded-md">
                                            <div className="flex justify-between items-center mb-3">
                                                <div>
                                                    <p className="font-bold text-indigo-300">{attempt.quizTitle}</p>
                                                    <p className="text-xs text-gray-400">{new Date(attempt.timestamp).toLocaleString()}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {/* FIX: Derive status from score since 'status' does not exist on the attempt object. */}
                                                    <StatusBadge status={attempt.score >= 60 ? 'completed' : 'failed'} />
                                                    <p className={`font-bold text-2xl ${attempt.score >= 80 ? 'text-green-400' : attempt.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                        {attempt.score}%
                                                    </p>
                                                </div>
                                            </div>
                                            {!isParentView && (
                                                <div>
                                                    <p className="text-sm font-semibold mb-2">Responses:</p>
                                                    <div className="flex gap-2">
                                                        {attempt.answers.map((ans, index) => (
                                                            <div key={ans.questionId} title={`Question ${index + 1}`} className={`w-full h-2 rounded-full ${ans.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-center mt-8">No quizzes have been completed by this student yet.</p>
                            )}
                        </div>
                         <div>
                            <h2 className="text-xl font-bold mb-4">Recommended Learning Path</h2>
                             {student.learningPath.length > 0 ? (
                                <ul className="space-y-3">
                                    {student.learningPath.map((item, index) => (
                                        <li key={index} className="bg-gray-700/50 p-4 rounded-md border-l-4 border-indigo-500">
                                            <div className="flex items-start gap-3">
                                                 <div className="flex-shrink-0">
                                                    {item.type === 'lesson' ? <BookIcon className="w-5 h-5 text-indigo-400"/> : <BrainCircuitIcon className="w-5 h-5 text-indigo-400"/>}
                                                 </div>
                                                 <div>
                                                    <p className="font-bold text-white">{item.title}</p>
                                                    <p className="text-xs text-gray-400 uppercase font-semibold">{item.topic} • {item.difficulty}</p>
                                                    <p className="text-sm text-gray-300 mt-1">{item.description}</p>
                                                 </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-center mt-8">No learning path has been generated yet. The student can generate one from their portal after completing a quiz.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'review' && !isParentView && (
                    <div>
                        <h2 className="text-xl font-bold mb-4">Submissions for Review</h2>
                        {questsToReview.length > 0 ? (
                            <ul className="space-y-4">
                                {questsToReview.map(quest => (
                                    <li key={quest.id} className="bg-gray-700/50 p-4 rounded-md">
                                        <p className="font-bold text-indigo-300">{quest.title}</p>
                                        <p className="text-xs text-gray-400 mb-3">{quest.description}</p>
                                        <div className="bg-gray-900/50 p-3 rounded-md border border-gray-600">
                                            <p className="text-sm text-gray-300 whitespace-pre-wrap font-mono">{quest.proof?.content || 'No submission content.'}</p>
                                        </div>
                                        <div className="flex justify-end gap-2 mt-3">
                                            <Button variant="danger" className="!text-xs !py-1" onClick={() => handleReviewQuest(quest.id, false)}>Reject</Button>
                                            <Button className="!text-xs !py-1" onClick={() => handleReviewQuest(quest.id, true)}>Approve (+{quest.points} pts)</Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-center mt-8">No submissions are currently pending review.</p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default StudentDashboardView;