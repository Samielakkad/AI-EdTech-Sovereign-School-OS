
import React, { useState, useEffect } from 'react';
import * as studentDataService from '../../services/studentDataService.ts';
import { AdventureModule, Teacher } from '../../types.ts';

interface TeacherStats {
    incidentsLogged: number;
    positiveBehaviors: number;
    commsDrafted: number; // This will be a mock value for now
    adventuresCreated: number;
}

interface TeacherWithStats extends Teacher {
    stats: TeacherStats;
}

const StaffOverviewView: React.FC = () => {
    const [staff, setStaff] = useState<TeacherWithStats[]>([]);

    useEffect(() => {
        const profiles = studentDataService.getStudentProfiles();
        const allIncidents = profiles.flatMap(p => p.incidents);
        const allAdventureModules = studentDataService.getAdventureModules();
        const allTeachers = studentDataService.getTeachers();

        const staffWithStats = allTeachers.map(teacher => {
            // In a real multi-teacher app, we would filter by teacherId
            const incidentsLogged = allIncidents.length;
            const positiveBehaviors = allIncidents.filter(inc => inc.incidentType === 'Positive Behavior').length;
            const commsDrafted = 5; // Mocking this
            const adventuresCreated = allAdventureModules.filter(m => m.teacherId === teacher.id).length;

            return {
                ...teacher,
                stats: {
                    incidentsLogged,
                    positiveBehaviors,
                    commsDrafted,
                    adventuresCreated
                }
            };
        });

        setStaff(staffWithStats);
    }, []);

    return (
        <div className="p-6 h-full flex flex-col overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold">Staff Overview</h1>
                <p className="text-gray-400">An overview of staff activity and platform engagement.</p>
            </header>
            
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Teacher Activity</h2>
                <div className="space-y-4">
                    {staff.map(teacher => (
                        <div key={teacher.id} className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-indigo-300">{teacher.name}</h3>
                                <p className="text-sm text-gray-400">{teacher.classId}</p>
                            </div>
                            <div className="flex gap-6 text-center">
                                <div>
                                    <p className="font-bold text-2xl">{teacher.stats.incidentsLogged}</p>
                                    <p className="text-xs text-gray-400">Incidents Logged</p>
                                </div>
                                <div>
                                    <p className="font-bold text-2xl text-green-400">{teacher.stats.positiveBehaviors}</p>
                                    <p className="text-xs text-gray-400">Positive Logs</p>
                                </div>
                                <div>
                                    <p className="font-bold text-2xl">{teacher.stats.commsDrafted}</p>
                                    <p className="text-xs text-gray-400">Comms Drafted</p>
                                </div>
                                <div>
                                    <p className="font-bold text-2xl">{teacher.stats.adventuresCreated}</p>
                                    <p className="text-xs text-gray-400">Adventures Created</p>
                                </div>
                            </div>
                        </div>
                    ))}
                     {staff.length === 0 && <p className="text-gray-500">No teacher data found.</p>}
                </div>
            </div>
        </div>
    );
};

export default StaffOverviewView;