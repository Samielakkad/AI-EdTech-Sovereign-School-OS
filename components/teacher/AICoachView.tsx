import React, { useState, useEffect } from 'react';
import AstraForTeachers from './AstraForTeachers.tsx';
import * as studentDataService from '../../services/studentDataService.ts';
import { Teacher } from '../../types.ts';

const AICoachView: React.FC = () => {
    const [teacher, setTeacher] = useState<Teacher | null>(null);

    useEffect(() => {
        setTeacher(studentDataService.getTeachers()[0] || null);
    }, []);

    if (!teacher) {
        return <div>Loading teacher data...</div>;
    }

    return (
        <div className="p-6 h-full flex flex-col">
            <header className="mb-6">
                <h1 className="text-3xl font-bold">Astra AI Coach</h1>
                <p className="text-gray-400">Your AI partner for brainstorming, planning, and professional development. Using Thinking Mode for deeper insights.</p>
            </header>
            <div className="flex-1 bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col min-h-0">
                <AstraForTeachers 
                    lessonPlanContext={null} 
                    useThinkingMode={true} 
                    contextId={`teacher-${teacher.id}-coach`}
                />
            </div>
        </div>
    );
};

export default AICoachView;