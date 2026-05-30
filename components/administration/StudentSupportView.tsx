
import React, { useState } from 'react';
import { SupportRecommendation } from '../../types.ts';
import * as studentDataService from '../../services/studentDataService.ts';
import * as geminiService from '../../services/geminiService.ts';
import Button from '../common/Button.tsx';
import { HeartHandshakeIcon } from '../icons/SettingsIcon.tsx';

const RecommendationCard: React.FC<{ rec: SupportRecommendation }> = ({ rec }) => (
    <div className="bg-gray-700/50 p-6 rounded-lg border-l-4 border-yellow-500">
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-white">{rec.studentName}</h3>
            <div className="flex gap-4 text-right">
                <div>
                    <div className="font-bold text-lg">{rec.keyMetrics.incidents}</div>
                    <div className="text-xs text-gray-400">Incidents</div>
                </div>
                <div>
                    <div className="font-bold text-lg">{rec.keyMetrics.avgScore !== null ? `${rec.keyMetrics.avgScore}%` : 'N/A'}</div>
                    <div className="text-xs text-gray-400">Avg. Score</div>
                </div>
                 <div>
                    <div className="font-bold text-lg">{rec.keyMetrics.attendance}%</div>
                    <div className="text-xs text-gray-400">Attendance</div>
                </div>
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-600">
            <h4 className="font-semibold text-yellow-300">Reason for Concern</h4>
            <p className="text-sm text-gray-300 mt-1">{rec.reason}</p>
        </div>
        <div className="mt-4">
            <h4 className="font-semibold text-green-300">Suggested Action</h4>
            <p className="text-sm text-gray-300 mt-1">{rec.suggestedAction}</p>
        </div>
    </div>
);

const StudentSupportView: React.FC = () => {
    const [recommendations, setRecommendations] = useState<SupportRecommendation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setRecommendations([]);
        try {
            const profiles = studentDataService.getStudentProfiles();
            if (profiles.length > 0) {
                const result = await geminiService.generateSupportRecommendations(profiles);
                setRecommendations(result);
            }
        } catch (e) {
            setError('Failed to generate support analysis. Please try again later.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col overflow-y-auto">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Student Support Hub</h1>
                    <p className="text-gray-400">Proactively identify students who may need additional support.</p>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? 'Analyzing...' : 'Generate Support Analysis'}
                </Button>
            </header>

            <div className="flex-1">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400 mx-auto mb-4"></div>
                        <p>Analyzing school-wide data to identify students...</p>
                    </div>
                )}

                {error && <p className="text-red-400 text-center py-8">{error}</p>}

                {!isLoading && !error && recommendations.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <HeartHandshakeIcon className="w-24 h-24 text-gray-600 mb-4" />
                        <h2 className="text-xl font-bold text-gray-400">Ready to Analyze</h2>
                        <p className="max-w-md">Click "Generate Support Analysis" for an AI-powered list of students who might benefit from a check-in based on a holistic view of their data.</p>
                    </div>
                )}
                
                {!isLoading && !error && recommendations.length > 0 && (
                     <div className="space-y-6">
                        {recommendations.map(rec => <RecommendationCard key={rec.studentId} rec={rec} />)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentSupportView;
