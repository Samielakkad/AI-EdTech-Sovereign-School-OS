import React from 'react';
import { StudentProfile, StudentStatus } from '../../types.ts';
import { RocketIcon, TrendingUpIcon, AlertTriangleIcon, HelpCircleIcon, MailIcon } from '../icons/SettingsIcon.tsx';
import { CoinIcon } from '../icons/StudentIcons.tsx';

interface ClassRosterProps {
  students: StudentProfile[];
  onSelectStudent: (studentId: string) => void;
  onContactParent: (studentId: string) => void;
}

const getAverageQuizScore = (student: StudentProfile): number | null => {
    if (!student.quizAttempts || student.quizAttempts.length === 0) return null;
    const totalScore = student.quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
    return Math.round(totalScore / student.quizAttempts.length);
};

const categorizeStudents = (students: StudentProfile[]) => {
    const tiers: { [key: string]: StudentProfile[] } = {
        'Excelling': [],
        'On Track': [],
        'Needs Attention': [],
        'Not Graded': [],
    };

    students.forEach(student => {
        if (student.status === 'absent') return;
        
        const avgScore = getAverageQuizScore(student);
        if (avgScore === null) {
            tiers['Not Graded'].push(student);
            return;
        }

        if (avgScore >= 90 && student.points >= 200) {
            tiers['Excelling'].push(student);
        } else if (avgScore < 70 || student.points < 100) {
            tiers['Needs Attention'].push(student);
        } else {
            tiers['On Track'].push(student);
        }
    });
    
    // Also add absent students to a separate category to be rendered last
    tiers['Absent'] = students.filter(s => s.status === 'absent');

    return tiers;
};

const tierConfig = {
    'Excelling': { icon: RocketIcon, color: 'text-green-400', description: 'High quiz scores and points' },
    'On Track': { icon: TrendingUpIcon, color: 'text-blue-400', description: 'Meeting expectations' },
    'Needs Attention': { icon: AlertTriangleIcon, color: 'text-yellow-400', description: 'Low scores or points' },
    'Not Graded': { icon: HelpCircleIcon, color: 'text-gray-500', description: 'No quiz data available' },
    'Absent': { icon: HelpCircleIcon, color: 'text-gray-500', description: 'Absent today' }
};

const DefaultAvatarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const StatusIndicator: React.FC<{ status: StudentStatus }> = ({ status }) => {
  const statusConfig: Record<StudentStatus, { color: string; label: string }> = {
    focused: { color: 'bg-green-500', label: 'Focused' },
    distracted: { color: 'bg-yellow-400', label: 'Distracted' },
    needs_help: { color: 'bg-red-500', label: 'Needs Help' },
    absent: { color: 'bg-gray-500', label: 'Absent' },
  };

  const config = statusConfig[status];
  if (!config) return null;

  return (
    <div className="relative group/indicator flex-shrink-0 mr-2">
      <span className={`w-3 h-3 block rounded-full ${config.color}`} />
      <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/indicator:block bg-gray-900 text-white text-xs rounded py-1 px-2 z-10 whitespace-nowrap">
        {config.label}
      </span>
    </div>
  );
};

const StudentRow: React.FC<{ student: StudentProfile, onSelect: (id: string) => void; onContact: (id: string) => void; }> = ({ student, onSelect, onContact }) => {
    const avgScore = getAverageQuizScore(student);
    return (
        <div className="group flex items-center justify-between bg-gray-700/50 hover:bg-gray-700 p-3 rounded-md transition-colors text-left">
            <div className="flex items-center flex-1 min-w-0">
                 <button 
                    onClick={() => onSelect(student.id)}
                    className="flex items-center text-left min-w-0"
                >
                    {student.avatarUrl ? (
                        <img src={student.avatarUrl} alt={student.name} className="w-8 h-8 rounded-full mr-3 object-cover flex-shrink-0" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-3 flex-shrink-0">
                            <DefaultAvatarIcon className="text-gray-400" />
                        </div>
                    )}
                    <StatusIndicator status={student.status} />
                    <span className="font-medium text-gray-200 truncate">{student.name}</span>
                </button>
                 <button 
                    onClick={(e) => { e.stopPropagation(); onContact(student.id); }} 
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-indigo-600 flex-shrink-0"
                    title={`Contact parent of ${student.name}`}
                 >
                    <MailIcon className="w-5 h-5 text-indigo-300" />
                </button>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                {student.status !== 'absent' && (
                    <>
                        <div className="text-right">
                             <div className="font-bold text-sm text-white">{avgScore !== null ? `${avgScore}%` : 'N/A'}</div>
                             <div className="text-xs text-gray-400">Avg. Score</div>
                        </div>
                        <div className="text-right">
                             <div className="font-bold text-sm text-white flex items-center gap-1">
                                 <CoinIcon className="w-3 h-3 text-yellow-400" />
                                 {student.points}
                             </div>
                             <div className="text-xs text-gray-400">Points</div>
                        </div>
                    </>
                )}
                 {student.status === 'absent' && (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full capitalize bg-gray-600 text-gray-300">
                        Absent
                    </span>
                 )}
            </div>
        </div>
    );
};

const ClassRoster: React.FC<ClassRosterProps> = ({ students, onSelectStudent, onContactParent }) => {
    const categorizedStudents = categorizeStudents(students);
    const tierOrder: (keyof typeof tierConfig)[] = ['Needs Attention', 'On Track', 'Excelling', 'Not Graded', 'Absent'];

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 flex-shrink-0">Class Roster</h2>
            <div className="space-y-4 overflow-y-auto flex-1">
                {tierOrder.map(tier => {
                    const studentsInTier = categorizedStudents[tier];
                    if (studentsInTier.length === 0) return null;
                    const config = tierConfig[tier];
                    const Icon = config.icon;

                    return (
                        <details key={tier} className="group" open={tier !== 'Absent'}>
                            <summary className="list-none flex items-center justify-between cursor-pointer p-2 rounded-md hover:bg-gray-700/50">
                                <div className="flex items-center gap-3">
                                    <Icon className={`w-6 h-6 ${config.color}`} />
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-200">{tier}</h3>
                                        <p className="text-xs text-gray-400">{config.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-sm font-semibold bg-gray-900/50 px-3 py-1 rounded-full">{studentsInTier.length}</span>
                                    <svg className="w-5 h-5 text-gray-400 ml-2 transform transition-transform group-open:rotate-90" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                                </div>
                            </summary>
                            <div className="space-y-2 pt-2 pl-4">
                                {studentsInTier.map(student => (
                                    <StudentRow key={student.id} student={student} onSelect={onSelectStudent} onContact={onContactParent} />
                                ))}
                            </div>
                        </details>
                    );
                })}
            </div>
        </div>
    );
};

export default ClassRoster;
