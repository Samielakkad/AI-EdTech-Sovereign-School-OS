

import React, { useState, useEffect } from 'react';
import { StudentProfile, Incident, IncidentType, ApprovalRequest } from '../../types.ts';
import * as studentDataService from '../../services/studentDataService.ts';
import * as approvalService from '../../services/approvalService.ts';
import * as communicationService from '../../services/communicationService.ts';
import { UserCheckIcon } from '../icons/SettingsIcon.tsx';

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex items-center gap-4">
        <div className="bg-gray-700 p-3 rounded-lg">
            {icon}
        </div>
        <div>
            <div className="text-3xl font-bold">{value}</div>
            <div className="text-sm text-gray-400">{label}</div>
        </div>
    </div>
);

const typeStyles: { [key in IncidentType]: string } = {
  'Disruption': 'bg-purple-800 text-purple-200',
  'Off-task': 'bg-gray-600 text-gray-300',
  'Positive Behavior': 'bg-green-800 text-green-200',
  'Conflict': 'bg-orange-800 text-orange-200',
  'Safety Concern': 'bg-pink-800 text-pink-200',
};

const TypeBadge: React.FC<{ type: IncidentType }> = ({ type }) => (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${typeStyles[type] || typeStyles['Off-task']}`}>
        {type}
    </span>
);

const PieChart: React.FC<{ data: { name: string; value: number }[]; title: string }> = ({ data, title }) => {
    const colors = ['#818cf8', '#a78bfa', '#c084fc', '#f472b6', '#fb7185'];
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 h-full flex flex-col">
            <h3 className="text-lg font-bold mb-4">{title}</h3>
            {total > 0 ? (
                 <div className="flex-1 flex items-center justify-around flex-col sm:flex-row lg:flex-col">
                    <div className="relative w-40 h-40">
                         <svg viewBox="0 0 36 36" className="w-full h-full">
                            {(() => {
                                let accumulated = 0;
                                return data.map((item, index) => {
                                    const percentage = (item.value / total) * 100;
                                    const strokeDasharray = `${percentage} ${100 - percentage}`;
                                    const strokeDashoffset = -accumulated;
                                    accumulated += percentage;
                                    return (
                                        <circle
                                            key={index}
                                            cx="18" cy="18" r="15.915"
                                            fill="transparent"
                                            stroke={colors[index % colors.length]}
                                            strokeWidth="3.8"
                                            strokeDasharray={strokeDasharray}
                                            strokeDashoffset={strokeDashoffset}
                                            transform="rotate(-90 18 18)"
                                        />
                                    );
                                });
                            })()}
                        </svg>
                    </div>
                    <ul className="space-y-2 text-sm mt-4 sm:mt-0 lg:mt-4">
                        {data.map((item, index) => (
                            <li key={index} className="flex items-center">
                                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors[index % colors.length] }}></span>
                                <span className="text-gray-300">{item.name} ({Math.round((item.value / total) * 100)}%)</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="text-sm text-gray-500 m-auto">No data available.</p>
            )}
        </div>
    );
};

const AdminDashboardView: React.FC = () => {
    const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
    const [stats, setStats] = useState({
        totalStudents: 0,
        avgAttendance: '0%',
        avgQuizScore: 'N/A',
        pendingApprovals: 0,
        parentContactRate: '0%',
    });
    const [concernData, setConcernData] = useState<{name: string, value: number}[]>([]);

    useEffect(() => {
        const allProfiles = studentDataService.getStudentProfiles();
        const allIncidents = allProfiles.flatMap(p => p.incidents);
        allIncidents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentIncidents(allIncidents.slice(0, 5));

        const pending = approvalService.getRequests().filter(r => r.status === 'pending');
        const parents = communicationService.getParents();
        const conversations = communicationService.getConversations();

        // Calculate stats
        const totalStudents = allProfiles.length;
        const contactedParentIds = new Set(conversations.map(c => c.parentId));
        const parentContactRate = parents.length > 0 ? Math.round((contactedParentIds.size / parents.length) * 100) : 0;
        
        const totalAttendance = allProfiles.reduce((sum, p) => sum + p.attendancePercentage, 0);
        const avgAttendance = totalStudents > 0 ? Math.round(totalAttendance / totalStudents) : 0;

        const allQuizAttempts = allProfiles.flatMap(p => p.quizAttempts);
        const totalScore = allQuizAttempts.reduce((sum, qa) => sum + qa.score, 0);
        const avgQuizScore = allQuizAttempts.length > 0 ? Math.round(totalScore / allQuizAttempts.length) : null;
        
        // Calculate common concerns
        const concerns = conversations.reduce((acc, convo) => {
            if (convo.subject.toLowerCase().includes('behavior')) {
                acc['Behavior'] = (acc['Behavior'] || 0) + 1;
            } else if (convo.subject.toLowerCase().includes('assignment') || convo.subject.toLowerCase().includes('work')) {
                acc['Assignments'] = (acc['Assignments'] || 0) + 1;
            } else if (convo.subject.toLowerCase().includes('positive') || convo.subject.toLowerCase().includes('excellent')) {
                acc['Positive Feedback'] = (acc['Positive Feedback'] || 0) + 1;
            } else {
                acc['Other'] = (acc['Other'] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const concernsChartData = Object.entries(concerns).map(([name, value]) => ({name, value})).sort((a, b) => b.value - a.value);
        setConcernData(concernsChartData);

        setStats({
            totalStudents,
            avgAttendance: `${avgAttendance}%`,
            avgQuizScore: avgQuizScore !== null ? `${avgQuizScore}%` : 'N/A',
            pendingApprovals: pending.length,
            parentContactRate: `${parentContactRate}%`,
        });

    }, []);

    return (
        <div className="p-6 h-full flex flex-col overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold">Administrator Dashboard</h1>
                <p className="text-gray-400">School-wide overview and key metrics.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                <StatCard label="Total Students" value={String(stats.totalStudents)} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-indigo-400"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>} />
                <StatCard label="Avg. Attendance" value={stats.avgAttendance} icon={<UserCheckIcon className="w-6 h-6 text-green-400" />} />
                <StatCard label="Avg. Quiz Score" value={stats.avgQuizScore} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-blue-400"><path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path></svg>} />
                <StatCard label="Pending Approvals" value={String(stats.pendingApprovals)} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-yellow-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>} />
                <StatCard label="Parent Contact Rate" value={stats.parentContactRate} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-purple-400"><path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"></path><rect x="3" y="4" width="18" height="18" rx="2"></rect><circle cx="12" cy="10" r="2"></circle></svg>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
                    <h2 className="text-xl font-bold mb-4">Recent Incidents</h2>
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Date</th>
                                    <th scope="col" className="px-6 py-3">Student</th>
                                    <th scope="col" className="px-6 py-3">Type</th>
                                    <th scope="col" className="px-6 py-3">Summary</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentIncidents.length > 0 ? (
                                    recentIncidents.map(incident => (
                                        <tr key={incident.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap">{new Date(incident.timestamp).toLocaleString()}</td>
                                            <td className="px-6 py-4 font-medium">{incident.studentName}</td>
                                            <td className="px-6 py-4"><TypeBadge type={incident.incidentType} /></td>
                                            <td className="px-6 py-4 max-w-sm truncate" title={incident.summary}>{incident.summary}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-gray-500">No incidents have been logged yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                 <div className="lg:col-span-1">
                    <PieChart data={concernData} title="Common Parent Concerns" />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardView;
