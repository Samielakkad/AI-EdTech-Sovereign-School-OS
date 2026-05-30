import React, { useState } from 'react';
import { StudentProfile, Assignment, Quiz, AssignmentSubmission } from '../../types.ts';
import Button from '../common/Button.tsx';
import * as studentDataService from '../../services/studentDataService.ts';
import * as geminiService from '../../services/geminiService.ts';
import { ClipboardCheckIcon, GraduationCapIcon, CheckCircleIcon, UploadCloudIcon } from '../icons/StudentIcons.tsx';
import { CloseIcon, DownloadIcon } from '../icons/SettingsIcon.tsx';
import AdaptiveLearningPathView from './AdaptiveLearningPathView.tsx';

interface AssignmentsAndQuizzesViewProps {
    student: StudentProfile;
    onStartQuiz: (quiz: Quiz) => void;
    onUpdate: () => void;
    onBack: () => void;
}

const SubmissionModal: React.FC<{
    assignment: Assignment;
    onClose: () => void;
    onSubmit: (submission: Omit<AssignmentSubmission, 'submittedDate'>) => void;
}> = ({ assignment, onClose, onSubmit }) => {
    const [submissionType, setSubmissionType] = useState<'text' | 'file'>('text');
    const [textContent, setTextContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (submissionType === 'text' && textContent.trim()) {
            onSubmit({ type: 'text', content: textContent });
        } else if (submissionType === 'file' && file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const base64 = (loadEvent.target?.result as string).split(',')[1];
                onSubmit({ type: 'file', content: base64, fileName: file.name });
            };
            reader.onerror = () => {
                alert("Error reading file.");
                setIsSubmitting(false);
            }
            reader.readAsDataURL(file);
        }
    };
    
    const canSubmit = (submissionType === 'text' && textContent.trim()) || (submissionType === 'file' && file);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(assignment.dueDate + 'T00:00:00');
    
    const isPastDue = dueDate.getTime() < today.getTime() && assignment.status === 'pending';

    const formattedDate = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(dueDate);


    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl relative p-8 flex flex-col max-h-[90vh] border border-gray-700" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><CloseIcon /></button>
                <h2 className="text-2xl font-bold mb-2 text-indigo-300">{assignment.title}</h2>
                <div className="flex items-center gap-4 mb-4">
                    <p className={`text-sm font-semibold ${isPastDue ? 'text-red-400' : 'text-gray-400'}`}>
                        {isPastDue ? 'Past Due: ' : 'Due: '} {formattedDate}
                    </p>
                    <span className="bg-gray-700 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {assignment.topic}
                    </span>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                        <h3 className="font-bold text-gray-200 mb-2">Instructions</h3>
                        <p className="text-gray-300 whitespace-pre-wrap">{assignment.description}</p>
                    </div>

                    {assignment.pdfUrl && (
                        <a href={assignment.pdfUrl} download={assignment.pdfName || 'assignment.pdf'} className="block">
                            <Button variant="secondary" className="w-full flex items-center justify-center">
                                <DownloadIcon className="w-5 h-5 mr-2" /> Download "{assignment.pdfName || 'Attachment'}"
                            </Button>
                        </a>
                    )}

                    {assignment.rubric && (
                        <div className="bg-gray-700/50 p-4 rounded-lg">
                            <h3 className="font-bold text-gray-200 mb-2">Grading Rubric</h3>
                            <ul className="space-y-3">
                                {assignment.rubric.criteria.map((c, i) => (
                                    <li key={i} className="border-t border-gray-600 pt-2">
                                        <p className="font-semibold text-indigo-300">{c.criterion}</p>
                                        <p className="text-sm text-gray-400">{c.description}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}


                    {assignment.status === 'pending' ? (
                        <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-gray-700">
                            <h3 className="font-bold text-lg text-gray-200 mb-2">Your Submission</h3>
                            <div className="mb-4">
                                <div className="flex bg-gray-700 rounded-md p-1">
                                    <Button type="button" onClick={() => setSubmissionType('text')} variant={submissionType === 'text' ? 'primary' : 'secondary'} className={`w-1/2 !rounded-md ${submissionType === 'text' ? '' : '!bg-transparent'}`}>Write Submission</Button>
                                    <Button type="button" onClick={() => setSubmissionType('file')} variant={submissionType === 'file' ? 'primary' : 'secondary'} className={`w-1/2 !rounded-md ${submissionType === 'file' ? '' : '!bg-transparent'}`}>Upload File</Button>
                                </div>
                            </div>

                            {submissionType === 'text' ? (
                                <textarea
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Type your response here..."
                                    rows={8}
                                    value={textContent}
                                    onChange={e => setTextContent(e.target.value)}
                                />
                            ) : (
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-500"/>
                                        <div className="flex text-sm text-gray-400">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-indigo-400 hover:text-indigo-300">
                                                <span>Upload a file</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500">{file?.name || 'PDF, DOCX, PNG, JPG'}</p>
                                    </div>
                                </div>
                            )}
                            <div className="mt-6 flex justify-end">
                                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                                    {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <h3 className="font-bold text-lg text-gray-200 mb-2">Your Submission</h3>
                            <div className="bg-gray-900/50 p-4 rounded-lg">
                                <p className="text-xs text-gray-400">Submitted on: {new Date(assignment.submission!.submittedDate).toLocaleString()}</p>
                                {assignment.submission?.type === 'text' ? (
                                    <p className="text-gray-300 mt-2 whitespace-pre-wrap">{assignment.submission.content}</p>
                                ) : (
                                    <p className="text-gray-300 mt-2">File: {assignment.submission?.fileName}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatusBadge: React.FC<{ status: Assignment['status'] }> = ({ status }) => {
    const config = {
        pending: { text: 'Pending', className: 'bg-gray-600 text-gray-200' },
        submitted: { text: 'Submitted', className: 'bg-yellow-800 text-yellow-200' },
        completed: { text: 'Graded', className: 'bg-green-800 text-green-200' }
    };
    return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${config[status].className}`}>{config[status].text}</span>;
};

const AssignmentItem: React.FC<{ assignment: Assignment; onSelect: () => void; }> = ({ assignment, onSelect }) => {
    const isPending = assignment.status === 'pending';
    const borderColor = {
        pending: 'border-transparent',
        submitted: 'border-yellow-500',
        completed: 'border-green-500'
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(assignment.dueDate + 'T00:00:00');
    
    const isPastDue = dueDate.getTime() < today.getTime() && assignment.status === 'pending';

    const formattedDate = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric'
    }).format(dueDate);

    return (
        <div className={`p-4 rounded-lg flex items-center justify-between transition-all bg-gray-700/60 border-l-4 ${borderColor[assignment.status]}`}>
            <div className="flex items-center flex-grow min-w-0">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-4 bg-indigo-500">
                   <ClipboardCheckIcon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold text-white truncate">{assignment.title}</h3>
                    <p className={`text-sm font-semibold ${isPastDue ? 'text-red-400' : 'text-gray-400'}`}>
                        {isPastDue ? 'Past Due: ' : 'Due: '} {formattedDate}
                    </p>
                </div>
            </div>
            <div className="ml-4 flex-shrink-0 flex items-center gap-4">
                <StatusBadge status={assignment.status} />
                <Button onClick={onSelect} variant="secondary" className="!py-1 !px-3 !text-xs">
                    {isPending ? 'View & Submit' : 'View Details'}
                </Button>
            </div>
        </div>
    );
};


const QuizItem: React.FC<{ quiz: Quiz; onStart: () => void, isCompleted: boolean }> = ({ quiz, onStart, isCompleted }) => (
     <div className={`p-4 rounded-lg flex items-center justify-between ${isCompleted ? 'bg-green-900/50' : 'bg-gray-700/60'}`}>
        <div className="flex items-center">
            <GraduationCapIcon className="w-6 h-6 text-indigo-400 mr-4 flex-shrink-0" />
            <div>
                <h3 className={`font-bold ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>{quiz.title}</h3>
                <p className="text-sm text-gray-400">{quiz.questions.length} Questions</p>
            </div>
        </div>
        {isCompleted ? (
            <span className="text-sm font-semibold text-green-400 flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/>Completed</span>
        ) : (
             <Button onClick={onStart} className="!py-1 !px-3 !text-xs ml-4 flex-shrink-0">Start Quiz</Button>
        )}
    </div>
);


const AssignmentsAndQuizzesView: React.FC<AssignmentsAndQuizzesViewProps> = ({ student, onStartQuiz, onUpdate, onBack }) => {
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [isPathLoading, setIsPathLoading] = useState(false);

    const handleGeneratePath = async () => {
        setIsPathLoading(true);
        const newPath = await geminiService.generateLearningPath(student);
        studentDataService.updateStudentLearningPath(student.id, newPath);
        onUpdate();
        setIsPathLoading(false);
    };

    const handleSubmitAssignment = (submission: Omit<AssignmentSubmission, 'submittedDate'>) => {
        if (selectedAssignment) {
            studentDataService.submitAssignment(student.id, selectedAssignment.id, submission);
            setSelectedAssignment(null);
            onUpdate();
        }
    };
    
    const quizzes = studentDataService.getQuizzes();
    const completedQuizIds = new Set(student.quizAttempts.map(qa => qa.quizId));

    const upcomingAssignments = student.assignments.filter(a => a.status === 'pending').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    const submittedAssignments = student.assignments.filter(a => a.status !== 'pending').sort((a, b) => new Date(b.submission?.submittedDate || 0).getTime() - new Date(a.submission?.submittedDate || 0).getTime());
    
    return (
        <>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold">Assignments & Quizzes</h2>
                    <Button onClick={onBack} variant="secondary">&larr; Back to Learning Hub</Button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-2xl font-bold mb-4">Assignments</h3>
                        <div className="space-y-3">
                            {upcomingAssignments.length > 0 ? (
                                upcomingAssignments.map(assignment => (
                                    <AssignmentItem key={assignment.id} assignment={assignment} onSelect={() => setSelectedAssignment(assignment)} />
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 bg-gray-900/50 rounded-lg">
                                    <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 text-green-500" />
                                    <p>No upcoming assignments. You're all caught up!</p>
                                </div>
                            )}
                            {submittedAssignments.length > 0 && (
                                <div className="pt-4 mt-4 border-t border-gray-700">
                                    <h4 className="text-lg font-bold text-gray-400 mb-3">Submitted</h4>
                                    <div className="space-y-3">
                                        {submittedAssignments.map(assignment => (
                                            <AssignmentItem key={assignment.id} assignment={assignment} onSelect={() => setSelectedAssignment(assignment)} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold mb-4">Quizzes</h3>
                        <div className="space-y-3">
                             {quizzes.length > 0 ? (
                                quizzes.map(quiz => (
                                    <QuizItem 
                                        key={quiz.id} 
                                        quiz={quiz} 
                                        onStart={() => onStartQuiz(quiz)}
                                        isCompleted={completedQuizIds.has(quiz.id)}
                                    />
                                ))
                             ) : (
                                <p className="text-center text-gray-500 py-4">No quizzes available right now.</p>
                             )}
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <AdaptiveLearningPathView student={student} onGenerate={handleGeneratePath} isLoading={isPathLoading} />
                </div>
            </div>
            {selectedAssignment && (
                <SubmissionModal 
                    assignment={selectedAssignment}
                    onClose={() => setSelectedAssignment(null)}
                    onSubmit={handleSubmitAssignment}
                />
            )}
        </>
    );
};

export default AssignmentsAndQuizzesView;