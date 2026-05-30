
import React, { useState, useEffect } from 'react';
import { mockStudents, mockTeacher } from '../../hooks/useUserProfile.ts';
import Button from '../common/Button.tsx';
import Select from '../common/Select.tsx';
import Input from '../common/Input.tsx';
import { generateIEPGoal } from '../../services/geminiService.ts';
import * as studentDataService from '../../services/studentDataService.ts';
import * as approvalService from '../../services/approvalService.ts';
import { IEPGoal } from '../../types.ts';
import { TrashIcon, PencilIcon } from '../icons/SettingsIcon.tsx';

type SavedGoal = IEPGoal & { studentName: string };

const IEPCopilotView: React.FC = () => {
    const [studentId, setStudentId] = useState(mockStudents[0].id);
    const [inferredFocusArea, setInferredFocusArea] = useState('');
    
    const [generatedGoal, setGeneratedGoal] = useState('');
    const [editableGoal, setEditableGoal] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [savedGoals, setSavedGoals] = useState<SavedGoal[]>([]);
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [goalToDelete, setGoalToDelete] = useState<SavedGoal | null>(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [goalToEdit, setGoalToEdit] = useState<SavedGoal | null>(null);
    const [editingGoalData, setEditingGoalData] = useState({ goal: '', focusArea: '' });


    const fetchAllSavedGoals = () => {
        const profiles = studentDataService.getStudentProfiles();
        const allGoals = profiles.flatMap(p => p.iepGoals.map(g => ({ ...g, studentName: p.name })));
        allGoals.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
        setSavedGoals(allGoals);
    };

    useEffect(() => {
        fetchAllSavedGoals();
    }, []);

    const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStudentId(e.target.value);
        setGeneratedGoal('');
        setEditableGoal('');
        setIsSaved(false);
        setInferredFocusArea('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setGeneratedGoal('');
        setEditableGoal('');
        setIsSaved(false);
        setInferredFocusArea('');
        const selectedStudent = studentDataService.getStudentProfile(studentId);
        if (!selectedStudent) {
            setIsLoading(false);
            return;
        }

        const response = await generateIEPGoal({ 
            student: selectedStudent, 
        });
        setGeneratedGoal(response.goal);
        setEditableGoal(response.goal);
        setInferredFocusArea(response.focusArea);
        setIsLoading(false);
    };

    const handleSaveGoal = () => {
        if (editableGoal && studentId && inferredFocusArea) {
            const student = mockStudents.find(s => s.id === studentId);
            if (!student) return;

            const newGoal = studentDataService.addIEPGoalToStudent(studentId, {
                studentId,
                goal: editableGoal,
                focusArea: inferredFocusArea,
            });

            if (newGoal) {
                approvalService.addRequest({
                    requesterId: mockTeacher.id,
                    requesterName: mockTeacher.name,
                    studentId: studentId,
                    studentName: student.name,
                    type: 'IEP_GOAL',
                    relatedId: newGoal.id,
                    details: `New IEP Goal Draft: ${editableGoal}`
                });
            }

            setIsSaved(true);
            fetchAllSavedGoals();

            setTimeout(() => {
                 setGeneratedGoal('');
                 setEditableGoal('');
                 setInferredFocusArea('');
                 setIsSaved(false);
            }, 3000);
        }
    };
    
    // --- Delete Modal Logic ---
    const openDeleteModal = (goal: SavedGoal) => {
        setGoalToDelete(goal);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setGoalToDelete(null);
        setIsDeleteModalOpen(false);
    };
    
    const handleDeleteConfirm = () => {
        if (goalToDelete) {
            studentDataService.deleteIEPGoalForStudent(goalToDelete.studentId, goalToDelete.id);
            fetchAllSavedGoals();
            closeDeleteModal();
        }
    };
    
    // --- Edit Modal Logic ---
    const openEditModal = (goal: SavedGoal) => {
        setGoalToEdit(goal);
        setEditingGoalData({ goal: goal.goal, focusArea: goal.focusArea });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setGoalToEdit(null);
        setIsEditModalOpen(false);
        setEditingGoalData({ goal: '', focusArea: '' });
    };

    const handleUpdateGoal = (e: React.FormEvent) => {
        e.preventDefault();
        if (goalToEdit && editingGoalData.goal && editingGoalData.focusArea) {
            studentDataService.updateIEPGoalForStudent(goalToEdit.studentId, goalToEdit.id, {
                goal: editingGoalData.goal,
                focusArea: editingGoalData.focusArea,
            });
            fetchAllSavedGoals();
            closeEditModal();
        }
    };


    const getStatusBadge = (status: IEPGoal['status']) => {
        switch(status) {
            case 'pending_approval': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-800 text-yellow-200 capitalize">Pending</span>;
            case 'active': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-800 text-green-200 capitalize">Active</span>;
            case 'achieved': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-800 text-blue-200 capitalize">Achieved</span>;
            case 'archived': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-600 text-gray-300 capitalize">Archived</span>;
            default: return null;
        }
    }


    return (
        <div className="p-6 h-full flex flex-col">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">IEP Goal Copilot</h1>
                <p className="text-gray-400">Generate and save S.M.A.R.T. goal drafts for student IEPs.</p>
            </header>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <h2 className="text-xl font-bold">Generate New Goal</h2>
                            <Select label="Select Student" value={studentId} onChange={handleStudentChange}>
                                {mockStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </Select>
                            <p className="text-xs text-gray-400 !mt-2">The AI will analyze the selected student's complete profile to identify an area of need and generate a S.M.A.R.T. goal.</p>
                            <Button type="submit" disabled={isLoading} className="w-full !mt-6">
                                {isLoading ? 'Analyzing Profile...' : 'Generate Goal Draft'}
                            </Button>
                        </form>
                    </div>
                     <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
                        <h2 className="text-xl font-bold mb-4">Generated Goal Output (Editable)</h2>
                        {generatedGoal && !isLoading && (
                             <div className="mb-4">
                                <Input
                                    label="Focus Area"
                                    value={inferredFocusArea}
                                    onChange={(e) => setInferredFocusArea(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <div className="flex-1 mb-4 flex flex-col">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-full bg-gray-700/50 rounded-md">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
                                </div>
                            ) : editableGoal ? (
                                <>
                                    <label htmlFor="iep-goal-text" className="block text-sm font-medium text-gray-300 mb-1">Goal Text</label>
                                    <textarea
                                        id="iep-goal-text"
                                        className="w-full flex-1 bg-gray-700/50 rounded-md p-4 text-gray-300 whitespace-pre-wrap font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={editableGoal}
                                        onChange={(e) => setEditableGoal(e.target.value)}
                                        aria-label="Editable generated IEP goal"
                                    />
                                </>
                            ) : (
                                 <div className="flex items-center justify-center h-full bg-gray-700/50 rounded-md">
                                    <p className="text-gray-500 text-center">Your AI-generated goal will appear here.</p>
                                 </div>
                            )}
                        </div>
                        {!isLoading && generatedGoal && (
                            <Button onClick={handleSaveGoal} disabled={isSaved || !editableGoal || !inferredFocusArea} className="w-full">
                                {isSaved ? 'Submitted for Approval!' : 'Save & Submit for Approval'}
                            </Button>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
                    <h2 className="text-xl font-bold mb-4">Saved Goal Ledger (All Students)</h2>
                    <div className="flex-1 overflow-y-auto">
                        {savedGoals.length > 0 ? (
                            <ul className="space-y-4">
                                {savedGoals.map(goal => (
                                    <li key={goal.id} className="bg-gray-700/50 p-4 rounded-md group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-indigo-300">{goal.studentName}</p>
                                                <p className="text-xs text-gray-400">{new Date(goal.dateCreated).toLocaleDateString()}</p>
                                            </div>
                                             <div className="flex items-center gap-2">
                                                 {getStatusBadge(goal.status)}
                                                 <Button variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity !p-2" onClick={() => openEditModal(goal)} title="Edit Goal">
                                                    <PencilIcon className="w-4 h-4 text-yellow-400" />
                                                </Button>
                                                 <Button variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity !p-2" onClick={() => openDeleteModal(goal)} title="Delete Goal">
                                                    <TrashIcon className="w-4 h-4 text-red-400" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-300 font-mono">{goal.goal}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-center mt-8">No IEP goals have been saved yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {isDeleteModalOpen && goalToDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-8">
                        <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
                        <p className="text-gray-300 mb-6">
                            Are you sure you want to delete this goal for <span className="font-bold">{goalToDelete.studentName}</span>? This action cannot be undone.
                        </p>
                         <div className="bg-gray-700/50 p-4 rounded-md mb-6">
                            <p className="text-sm text-gray-400 font-mono">{goalToDelete.goal}</p>
                        </div>
                        <div className="flex justify-end gap-4">
                            <Button variant="secondary" onClick={closeDeleteModal}>
                                Cancel
                            </Button>
                             <Button variant="danger" onClick={handleDeleteConfirm}>
                                Confirm
                            </Button>
                        </div>
                    </div>
                 </div>
            )}
            
            {isEditModalOpen && goalToEdit && (
                 <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-8">
                        <h2 className="text-xl font-bold mb-4">Edit IEP Goal</h2>
                        <p className="text-gray-400 mb-6">Editing goal for <span className="font-bold">{goalToEdit.studentName}</span>.</p>
                        <form onSubmit={handleUpdateGoal} className="space-y-4">
                            <Input
                                label="Focus Area"
                                value={editingGoalData.focusArea}
                                onChange={e => setEditingGoalData(prev => ({ ...prev, focusArea: e.target.value }))}
                                required
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Goal Text</label>
                                <textarea
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                                    rows={6}
                                    value={editingGoalData.goal}
                                    onChange={e => setEditingGoalData(prev => ({ ...prev, goal: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <Button type="button" variant="secondary" onClick={closeEditModal}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default IEPCopilotView;
