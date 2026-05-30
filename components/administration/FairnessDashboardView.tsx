
import React, { useState, useEffect } from 'react';
import { Incident, IncidentType, StudentProfile } from '../../types.ts';
import * as studentDataService from '../../services/studentDataService.ts';
import * as geminiService from '../../services/geminiService.ts';

const BarChart: React.FC<{ data: { label: string; value: number }[]; title: string }> = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.value), 0);
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">{title}</h3>
            <div className="space-y-2">
                {data.map(item => (
                    <div key={item.label} className="flex items-center">
                        <span className="w-32 text-sm text-gray-400 truncate">{item.label}</span>
                        <div className="flex-1 bg-gray-700 rounded-full h-6 mr-2">
                            <div
                                className="bg-indigo-600 h-6 rounded-full text-xs text-white flex items-center justify-end pr-2"
                                style={{ width: maxValue > 0 ? `${(item.value / maxValue) * 100}%` : '0%' }}
                            >
                                {item.value > 0 ? item.value : ''}
                            </div>
                        </div>
                    </div>
                ))}
                 {data.length === 0 && <p className="text-sm text-gray-500">No data available.</p>}
            </div>
        </div>
    );
};


const FairnessEquityView: React.FC = () => {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const profiles = studentDataService.getStudentProfiles();
            const allIncidents = profiles.flatMap(p => p.incidents);
            
            setIncidents(allIncidents);

            if (allIncidents.length > 0) {
                const result = await geminiService.analyzeFairnessData(allIncidents);
                setAnalysis(result);
            } else {
                setAnalysis("No incident data available to analyze.");
            }
            
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const incidentsByType = incidents.reduce((acc, incident) => {
        acc[incident.incidentType] = (acc[incident.incidentType] || 0) + 1;
        return acc;
    }, {} as Record<IncidentType, number>);

    const incidentsByStudent = incidents.reduce((acc, incident) => {
        acc[incident.studentName] = (acc[incident.studentName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const chartDataByType = Object.entries(incidentsByType)
        .map(([label, value]) => ({ label, value }))
        .sort((a,b) => Number(b.value) - Number(a.value));

    const chartDataByStudent = Object.entries(incidentsByStudent)
        .map(([label, value]) => ({ label, value }))
        .sort((a,b) => Number(b.value) - Number(a.value));

    return (
        <div className="p-6 h-full flex flex-col overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold">Fairness & Equity Dashboard</h1>
                <p className="text-gray-400">An overview of incident logging to ensure equitable practices.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold mb-4">AI Equity Analysis</h2>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
                        </div>
                    ) : (
                        <div className="text-gray-300 whitespace-pre-wrap font-mono prose prose-invert prose-p:text-gray-300 prose-ul:text-gray-300">{analysis}</div>
                    )}
                </div>

                <BarChart data={chartDataByType} title="Incidents by Type" />
                <div className="lg:col-span-2">
                    <BarChart data={chartDataByStudent} title="Incidents per Student" />
                </div>
            </div>
        </div>
    );
};

export default FairnessEquityView;
