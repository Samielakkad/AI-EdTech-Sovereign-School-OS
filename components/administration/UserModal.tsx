import React, { useState, useEffect } from 'react';
import { StudentProfile, Teacher } from '../../types.ts';
import Button from '../common/Button.tsx';
import Input from '../common/Input.tsx';
import { CloseIcon } from '../icons/SettingsIcon.tsx';
import * as studentDataService from '../../services/studentDataService.ts';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    userType: 'student' | 'teacher';
    mode: 'add' | 'edit';
    initialData?: StudentProfile | Teacher | null;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, userType, mode, initialData }) => {
    // Student fields
    const [name, setName] = useState('');
    const [gradeLevel, setGradeLevel] = useState(5);

    // Teacher fields
    const [email, setEmail] = useState('');
    const [classId, setClassId] = useState('');

    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name);
            if (userType === 'student' && 'gradeLevel' in initialData) {
                setGradeLevel(initialData.gradeLevel);
            }
            if (userType === 'teacher' && 'email' in initialData) {
                setEmail(initialData.email);
                setClassId(initialData.classId);
            }
        } else {
            // Reset fields when opening in 'add' mode or closing
            setName('');
            setGradeLevel(5);
            setEmail('');
            setClassId('');
        }
    }, [isOpen, initialData, userType]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (userType === 'student') {
            if (mode === 'add') {
                studentDataService.addStudent({ name, gradeLevel });
            } else if (initialData) {
                studentDataService.updateStudent(initialData.id, { name, gradeLevel });
            }
        } else if (userType === 'teacher') {
            if (mode === 'add') {
                studentDataService.addTeacher({ name, email, classId });
            } else if (initialData) {
                studentDataService.updateTeacher(initialData.id, { name, email, classId });
            }
        }

        onSave();
        onClose();
    };

    if (!isOpen) return null;

    const title = `${mode === 'add' ? 'Add' : 'Edit'} ${userType === 'student' ? 'Student' : 'Teacher'}`;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-8 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><CloseIcon /></button>
                <h2 className="text-2xl font-bold mb-6">{title}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Full Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                    {userType === 'student' ? (
                        <Input
                            label="Grade Level"
                            type="number"
                            value={gradeLevel}
                            onChange={e => setGradeLevel(parseInt(e.target.value))}
                            required
                        />
                    ) : (
                        <>
                            <Input
                                label="Email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                            <Input
                                label="Class ID"
                                value={classId}
                                onChange={e => setClassId(e.target.value)}
                                required
                            />
                        </>
                    )}
                    <div className="pt-4 flex justify-end gap-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;