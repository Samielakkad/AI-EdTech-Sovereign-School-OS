import React, { useState, useEffect } from 'react';
import { StudentProfile, Teacher, Student } from '../../types.ts';
import * as studentDataService from '../../services/studentDataService.ts';
import Button from '../common/Button.tsx';
import UserModal from './UserModal.tsx';
import DeleteUserConfirmationModal from './DeleteUserConfirmationModal.tsx';
import { PencilIcon, TrashIcon, PlusIcon } from '../icons/SettingsIcon.tsx';

type ModalType = 'student' | 'teacher';

const UserManagementView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentUser, setCurrentUser] = useState<StudentProfile | Teacher | null>(null);
    const [modalType, setModalType] = useState<ModalType>('student');

    // Delete confirmation modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<StudentProfile | Teacher | null>(null);

    const fetchData = () => {
        setStudents(studentDataService.getStudentProfiles());
        setTeachers(studentDataService.getTeachers());
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (mode: 'add' | 'edit', type: ModalType, user: StudentProfile | Teacher | null = null) => {
        setModalMode(mode);
        setModalType(type);
        setCurrentUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentUser(null);
    };

    const handleSave = () => {
        fetchData(); // Refetch all data after a save
    };

    const handleOpenDeleteModal = (user: StudentProfile | Teacher) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
    };

    const handleDeleteConfirm = () => {
        if (!userToDelete) return;
        
        if ('gradeLevel' in userToDelete) { // It's a student
            studentDataService.deleteStudent(userToDelete.id);
        } else { // It's a teacher
            studentDataService.deleteTeacher(userToDelete.id);
        }
        
        fetchData();
        handleCloseDeleteModal();
    };


    return (
        <>
            <div className="p-6 h-full flex flex-col">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-gray-400">Add, edit, and remove student and teacher accounts.</p>
                </header>

                <div className="border-b border-gray-700 mb-6">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('students')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'students' ? 'border-indigo-400 text-indigo-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Students</button>
                        <button onClick={() => setActiveTab('teachers')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'teachers' ? 'border-indigo-400 text-indigo-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Teachers</button>
                    </nav>
                </div>
                
                <div className="flex-1 bg-gray-800 rounded-lg shadow-lg p-6 overflow-y-auto">
                    {activeTab === 'students' && (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">All Students ({students.length})</h2>
                                <Button onClick={() => handleOpenModal('add', 'student')}>
                                    <PlusIcon className="w-5 h-5 mr-2"/> Add Student
                                </Button>
                            </div>
                            <table className="w-full text-sm text-left text-gray-300">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">Grade</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(s => (
                                        <tr key={s.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                            <td className="px-6 py-4 font-medium">{s.name}</td>
                                            <td className="px-6 py-4">{s.gradeLevel}</td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="secondary" className="!p-2" onClick={() => handleOpenModal('edit', 'student', s)}><PencilIcon className="w-4 h-4"/></Button>
                                                <Button variant="danger" className="!p-2 ml-2" onClick={() => handleOpenDeleteModal(s)}><TrashIcon className="w-4 h-4"/></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                    {activeTab === 'teachers' && (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">All Teachers ({teachers.length})</h2>
                                <Button onClick={() => handleOpenModal('add', 'teacher')}>
                                    <PlusIcon className="w-5 h-5 mr-2"/> Add Teacher
                                </Button>
                            </div>
                             <table className="w-full text-sm text-left text-gray-300">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">Email</th>
                                        <th className="px-6 py-3">Class ID</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teachers.map(t => (
                                        <tr key={t.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                            <td className="px-6 py-4 font-medium">{t.name}</td>
                                            <td className="px-6 py-4">{t.email}</td>
                                            <td className="px-6 py-4">{t.classId}</td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="secondary" className="!p-2" onClick={() => handleOpenModal('edit', 'teacher', t)}><PencilIcon className="w-4 h-4"/></Button>
                                                <Button variant="danger" className="!p-2 ml-2" onClick={() => handleOpenDeleteModal(t)}><TrashIcon className="w-4 h-4"/></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                userType={modalType}
                mode={modalMode}
                initialData={currentUser}
            />
            
            <DeleteUserConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDeleteConfirm}
                user={userToDelete}
            />

        </>
    );
};

export default UserManagementView;