import React, { useState } from 'react';
import { StudentProfile, Quiz } from '../../types.ts';
import { CalculatorIcon, ClipboardCheckIcon, CodeIcon, LanguagesIcon, ScienceIcon, EngineeringIcon, HistoryIcon, LiteratureIcon, ArtIcon, MusicIcon, DebateIcon, FinanceIcon } from '../icons/StudentIcons.tsx';
import MathSolverView from './MathSolverView.tsx';
import AssignmentsAndQuizzesView from './AssignmentsAndQuizzesView.tsx';
import AICoderView from './AICoderView.tsx';
import LanguageTutorView from './LanguageTutorView.tsx';
import * as studentDataService from '../../services/studentDataService.ts';
import ScienceLabView from './ScienceLabView.tsx';
import EngineeringSandboxView from './EngineeringSandboxView.tsx';
import HistoryExplorerView from './HistoryExplorerView.tsx';
import LiteratureCompanionView from './LiteratureCompanionView.tsx';
import ArtStudioView from './ArtStudioView.tsx';
import MusicComposerView from './MusicComposerView.tsx';
import DebateCoachView from './DebateCoachView.tsx';
import FinancialLiteracyView from './FinancialLiteracyView.tsx';


interface LearningHubViewProps {
    student: StudentProfile;
    onStartQuiz: (quiz: Quiz) => void;
    onUpdate: () => void;
}

type View = 'hub' | 'math_solver' | 'assignments_quizzes' | 'ai_coder' | 'language_tutor' | 'science_lab' | 'engineering_sandbox' | 'history_explorer' | 'literature_companion' | 'art_studio' | 'music_composer' | 'debate_coach' | 'financial_literacy';


const ClassCard: React.FC<{
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
    onClick: () => void;
    borderColor?: string;
}> = ({ icon: Icon, title, description, onClick, borderColor = 'border-gray-700' }) => (
    <button
        onClick={onClick}
        className={`bg-gray-800 hover:bg-gray-700/80 border ${borderColor} p-6 rounded-lg text-left w-full transition-all duration-200 transform hover:-translate-y-1 h-full flex flex-col`}
    >
        <div className="flex items-center gap-4 mb-3">
            <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                <Icon className="w-8 h-8 text-indigo-300" />
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-gray-400 flex-grow">{description}</p>
    </button>
);


const LearningHubView: React.FC<LearningHubViewProps> = ({ student, onStartQuiz, onUpdate }) => {
    const [currentView, setCurrentView] = useState<View>('hub');
    
    const quizzes = studentDataService.getQuizzes();
    const completedQuizIds = new Set(student.quizAttempts.map(qa => qa.quizId));
    const numAvailableQuizzes = quizzes.filter(q => !completedQuizIds.has(q.id)).length;
    const numPendingAssignments = student.assignments.filter(a => a.status === 'pending').length;
    
    const renderContent = () => {
        switch (currentView) {
            case 'math_solver':
                return <MathSolverView student={student} onBack={() => setCurrentView('hub')} />;
            case 'assignments_quizzes':
                return <AssignmentsAndQuizzesView student={student} onStartQuiz={onStartQuiz} onUpdate={onUpdate} onBack={() => setCurrentView('hub')} />;
            case 'ai_coder':
                // FIX: Pass the student prop to AICoderView.
                return <AICoderView student={student} onBack={() => setCurrentView('hub')} />;
            case 'language_tutor':
                // FIX: Pass the student prop to LanguageTutorView.
                return <LanguageTutorView student={student} onBack={() => setCurrentView('hub')} />;
            case 'science_lab':
                return <ScienceLabView student={student} onBack={() => setCurrentView('hub')} />;
            case 'engineering_sandbox':
                return <EngineeringSandboxView student={student} onBack={() => setCurrentView('hub')} />;
            case 'history_explorer':
                return <HistoryExplorerView student={student} onBack={() => setCurrentView('hub')} />;
            case 'literature_companion':
                return <LiteratureCompanionView student={student} onBack={() => setCurrentView('hub')} />;
            case 'art_studio':
                return <ArtStudioView onBack={() => setCurrentView('hub')} />;
            case 'music_composer':
                return <MusicComposerView student={student} onBack={() => setCurrentView('hub')} />;
            case 'debate_coach':
                return <DebateCoachView student={student} onBack={() => setCurrentView('hub')} />;
            case 'financial_literacy':
                return <FinancialLiteracyView student={student} onBack={() => setCurrentView('hub')} />;
            case 'hub':
            default:
                return (
                    <div>
                        <div className="text-center mb-12">
                            <h1 className="text-4xl font-bold text-white mb-2">Learning Hub</h1>
                            <p className="text-lg text-indigo-300">Your central campus for lessons, tools, and assignments.</p>
                        </div>
                        
                        <div className="space-y-16">
                             {/* Featured Card */}
                            <button
                                onClick={() => setCurrentView('assignments_quizzes')}
                                className="bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 border border-indigo-500 p-6 md:p-8 rounded-lg text-left w-full transition-all duration-200 transform hover:-translate-y-1 shadow-lg group"
                            >
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="bg-white/10 p-4 rounded-lg border border-white/20 group-hover:bg-white/20 transition-colors">
                                        <ClipboardCheckIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-2xl md:text-3xl font-bold text-white">Assignments & Quizzes</h3>
                                        <p className="text-indigo-200 mt-1">View your work, submit assignments, and take quizzes.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-center bg-black/20 p-4 rounded-lg min-w-[90px]">
                                            <p className="text-3xl font-bold text-white">{numPendingAssignments}</p>
                                            <p className="text-sm text-indigo-200">Pending</p>
                                        </div>
                                        <div className="text-center bg-black/20 p-4 rounded-lg min-w-[90px]">
                                            <p className="text-3xl font-bold text-white">{numAvailableQuizzes}</p>
                                            <p className="text-sm text-indigo-200">Quizzes</p>
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {/* STEM Wing */}
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-6 border-b-2 border-indigo-500 pb-2">STEM Wing</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                    <ClassCard icon={CalculatorIcon} title="Math Solver" description="Get step-by-step solutions and graph functions instantly." onClick={() => setCurrentView('math_solver')} borderColor="border-indigo-700" />
                                    <ClassCard icon={CodeIcon} title="AI Coder" description="Get code solutions and simple explanations for any language." onClick={() => setCurrentView('ai_coder')} borderColor="border-indigo-700" />
                                    <ClassCard icon={ScienceIcon} title="Science Lab" description="Explore scientific concepts and virtual experiments." onClick={() => setCurrentView('science_lab')} borderColor="border-indigo-700" />
                                    <ClassCard icon={EngineeringIcon} title="Engineering Sandbox" description="Tackle design challenges and engineering problems." onClick={() => setCurrentView('engineering_sandbox')} borderColor="border-indigo-700" />
                                </div>
                            </div>
                            
                            {/* Humanities Hall */}
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-6 border-b-2 border-purple-500 pb-2">Humanities Hall</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <ClassCard icon={LanguagesIcon} title="Language Tutor" description="Practice speaking and writing with an AI conversation partner." onClick={() => setCurrentView('language_tutor')} borderColor="border-purple-700" />
                                    <ClassCard icon={HistoryIcon} title="History Explorer" description="Ask about historical events, figures, and concepts." onClick={() => setCurrentView('history_explorer')} borderColor="border-purple-700" />
                                    <ClassCard icon={LiteratureIcon} title="Literature Companion" description="Get book summaries, character analysis, and more." onClick={() => setCurrentView('literature_companion')} borderColor="border-purple-700" />
                                </div>
                            </div>

                            {/* Creative Arts Center */}
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-6 border-b-2 border-rose-500 pb-2">Creative Arts Center</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                                    <ClassCard icon={ArtIcon} title="Art Studio" description="Create stunning images and art with AI." onClick={() => setCurrentView('art_studio')} borderColor="border-rose-700" />
                                    <ClassCard icon={MusicIcon} title="Music Composer" description="Get help with music theory and generate melodies." onClick={() => setCurrentView('music_composer')} borderColor="border-rose-700" />
                                </div>
                            </div>

                             {/* Life Skills Academy */}
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-6 border-b-2 border-teal-500 pb-2">Life Skills Academy</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                                    <ClassCard icon={DebateIcon} title="Debate Coach" description="Practice argumentation and public speaking skills." onClick={() => setCurrentView('debate_coach')} borderColor="border-teal-700" />
                                    <ClassCard icon={FinanceIcon} title="Financial Literacy" description="Learn about budgeting, saving, and smart spending." onClick={() => setCurrentView('financial_literacy')} borderColor="border-teal-700" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };
    
    return <div>{renderContent()}</div>;
};

export default LearningHubView;
