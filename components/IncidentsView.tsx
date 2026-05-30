import React, { useState, useEffect } from 'react';
import IncidentModal from './MainApp.tsx';
import Button from './common/Button.tsx';
import { Incident, IncidentSeverity, IncidentType } from '../types.ts';
import { MicIcon } from './icons/SettingsIcon.tsx';
import * as studentDataService from '../services/studentDataService.ts';

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


const IncidentsView: React.FC = () => {
    const [isIncidentModalOpen, setIncidentModalOpen] = useState(false);
    const [allIncidents, setAllIncidents] = useState<Incident[]>([]);

    const fetchIncidents = () => {
        const profiles = studentDataService.getStudentProfiles();
        const incidents = profiles.flatMap(p => p.incidents);
        incidents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAllIncidents(incidents);
    };

    useEffect(() => {
        fetchIncidents();
    }, []);

    const handleModalClose = () => {
        setIncidentModalOpen(false);
        fetchIncidents(); 
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Incident Ledger (All Students)</h1>
                <Button onClick={() => setIncidentModalOpen(true)}>
                    <MicIcon className="w-5 h-5 mr-2" />
                    Log New Incident
                </Button>
            </header>
            <div className="bg-gray-800 rounded-lg shadow-lg flex-1 overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Student</th>
                            <th scope="col" className="px-6 py-3">Type</th>
                            <th scope="col" className="px-6 py-3">Summary</th>
                            <th scope="col" className="px-6 py-3">Severity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allIncidents.length > 0 ? (
                            allIncidents.map(incident => (
                                <tr key={incident.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="px-6 py-4 font-medium whitespace-nowrap">{new Date(incident.timestamp).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{incident.studentName}</td>
                                    <td className="px-6 py-4">
                                        {incident.incidentType ? <TypeBadge type={incident.incidentType} /> : <span className="text-gray-500">N/A</span>}
                                    </td>
                                    <td className="px-6 py-4 max-w-sm truncate" title={incident.summary}>{incident.summary}</td>
                                    <td className="px-6 py-4">
                                        <SeverityBadge severity={incident.severity} />
                                    </td>
                                </tr>
                            ))
                        ) : (
                             <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-500">
                                    No incidents have been logged yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
             <IncidentModal 
                isOpen={isIncidentModalOpen} 
                onClose={handleModalClose}
            />
        </div>
    );
};

export default IncidentsView;