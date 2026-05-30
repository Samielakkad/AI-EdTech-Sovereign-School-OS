
import React, { useState, useEffect } from 'react';
import { ApprovalRequest, ApprovalRequestType } from '../../types.ts';
import * as approvalService from '../../services/approvalService.ts';
import Button from '../common/Button.tsx';
import { GavelIcon, CloseIcon } from '../icons/SettingsIcon.tsx';

const typeStyles: { [key in ApprovalRequestType]: string } = {
  'HIGH_SEVERITY_INCIDENT': 'bg-red-800 text-red-200',
  'IEP_GOAL': 'bg-blue-800 text-blue-200',
};

const TypeBadge: React.FC<{ type: ApprovalRequestType }> = ({ type }) => (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${typeStyles[type]}`}>
        {type.replace(/_/g, ' ').toLowerCase()}
    </span>
);

const ApprovalModal: React.FC<{ request: ApprovalRequest; onClose: () => void; onResolve: () => void; }> = ({ request, onClose, onResolve }) => {
    const [comment, setComment] = useState('');
    const [action, setAction] = useState<'approved' | 'denied' | null>(null);
    
    const handleResolve = () => {
        if (action) {
            approvalService.resolveRequest(request.id, action, comment || 'No comment.');
            onResolve();
            onClose();
        }
    }

    return (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl relative p-8">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <CloseIcon />
                </button>
                <h2 className="text-2xl font-bold mb-4">Review Request</h2>
                <div className="bg-gray-700/50 p-4 rounded-lg space-y-2">
                    <p><span className="font-bold text-gray-400">Student:</span> {request.studentName}</p>
                    <p><span className="font-bold text-gray-400">Requester:</span> {request.requesterName}</p>
                    <p><span className="font-bold text-gray-400">Type:</span> <TypeBadge type={request.type} /></p>
                    <p className="pt-2 font-bold text-gray-400">Details:</p>
                    <p className="text-sm font-mono bg-gray-900/50 p-3 rounded-md">{request.details}</p>
                </div>
                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Resolution Comments (Optional)</label>
                    <textarea
                        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>
                <div className="mt-6 flex justify-end gap-4">
                    <Button variant="danger" onClick={() => { setAction('denied'); handleResolve(); }}>Deny Request</Button>
                    <Button onClick={() => { setAction('approved'); handleResolve(); }}>Approve Request</Button>
                </div>
            </div>
        </div>
    );
};

const ApprovalsView: React.FC = () => {
    const [requests, setRequests] = useState<ApprovalRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);

    const fetchRequests = () => {
        setRequests(approvalService.getRequests());
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const resolvedRequests = requests.filter(r => r.status !== 'pending');

    return (
        <div className="p-6 h-full flex flex-col">
            <header className="mb-6">
                <h1 className="text-3xl font-bold">Approvals & Actions</h1>
                <p className="text-gray-400">Review and resolve teacher-submitted requests.</p>
            </header>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto">
                <section className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
                    <h2 className="text-xl font-bold mb-4">Pending Requests ({pendingRequests.length})</h2>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {pendingRequests.length > 0 ? (
                            pendingRequests.map(req => (
                                <div key={req.id} className="bg-gray-700/50 p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-white">{req.studentName}</p>
                                            <p className="text-xs text-gray-400">{new Date(req.timestamp).toLocaleString()}</p>
                                        </div>
                                        <TypeBadge type={req.type} />
                                    </div>
                                    <p className="text-sm text-gray-300 mt-2 truncate" title={req.details}>{req.details}</p>
                                    <div className="text-right mt-3">
                                        <Button onClick={() => setSelectedRequest(req)}>Review</Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <GavelIcon className="w-16 h-16 mb-4"/>
                                <p>No pending requests.</p>
                            </div>
                        )}
                    </div>
                </section>
                <section className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
                    <h2 className="text-xl font-bold mb-4">Resolved History</h2>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {resolvedRequests.map(req => (
                             <div key={req.id} className={`bg-gray-700/50 p-4 rounded-lg opacity-70 border-l-4 ${req.status === 'approved' ? 'border-green-500' : 'border-red-500'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-gray-300">{req.studentName}</p>
                                        <p className="text-xs text-gray-400">Resolved: {new Date(req.resolvedAt!).toLocaleString()}</p>
                                    </div>
                                    <span className={`text-sm font-bold ${req.status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>{req.status}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">"{req.approverComment}"</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
            {selectedRequest && <ApprovalModal request={selectedRequest} onClose={() => setSelectedRequest(null)} onResolve={fetchRequests}/>}
        </div>
    );
};

export default ApprovalsView;