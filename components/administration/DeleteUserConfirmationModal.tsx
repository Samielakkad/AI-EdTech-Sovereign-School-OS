import React from 'react';
import { StudentProfile, Teacher } from '../../types.ts';
import Button from '../common/Button.tsx';

interface DeleteUserConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    user: StudentProfile | Teacher | null;
}

const DeleteUserConfirmationModal: React.FC<DeleteUserConfirmationModalProps> = ({ isOpen, onClose, onConfirm, user }) => {
    if (!isOpen || !user) return null;

    const userType = 'gradeLevel' in user ? 'student' : 'teacher';

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-8 border border-gray-700">
                <h2 className="text-xl font-bold mb-4 text-red-400">Confirm Deletion</h2>
                <p className="text-gray-300 mb-6">
                    Are you sure you want to permanently delete the {userType}{' '}
                    <span className="font-bold">{user.name}</span>? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-4">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={onConfirm}>
                        Confirm Delete
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DeleteUserConfirmationModal;