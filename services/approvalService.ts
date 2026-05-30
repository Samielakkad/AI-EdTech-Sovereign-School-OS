
import { ApprovalRequest } from '../types.ts';
import * as studentDataService from './studentDataService.ts';
import * as complianceLogService from './complianceLogService.ts';

const APPROVAL_KEY = 'approvalRequests';

const initializeApprovals = (): void => {
    const existing = localStorage.getItem(APPROVAL_KEY);
    if (!existing) {
        localStorage.setItem(APPROVAL_KEY, JSON.stringify([]));
    }
};

initializeApprovals();

export const getRequests = (): ApprovalRequest[] => {
    try {
        const requestsJson = localStorage.getItem(APPROVAL_KEY);
        const requests: ApprovalRequest[] = requestsJson ? JSON.parse(requestsJson) : [];
        return requests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
        console.error("Failed to parse approval requests from localStorage", error);
        return [];
    }
};

const saveRequests = (requests: ApprovalRequest[]): void => {
    localStorage.setItem(APPROVAL_KEY, JSON.stringify(requests));
};

export const addRequest = (requestData: Omit<ApprovalRequest, 'id' | 'timestamp' | 'status'>): void => {
    const requests = getRequests();
    const newRequest: ApprovalRequest = {
        ...requestData,
        id: `req-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'pending',
    };
    requests.push(newRequest);
    saveRequests(requests);
};

export const resolveRequest = (requestId: string, status: 'approved' | 'denied', approverComment: string): void => {
    const requests = getRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);

    if (requestIndex !== -1) {
        const request = requests[requestIndex];
        request.status = status;
        request.approverComment = approverComment;
        request.resolvedAt = new Date().toISOString();
        request.resolvedBy = 'Admin'; // In a real app, this would be the logged-in admin's name

        // If it's an approved IEP Goal, update the goal's status
        if (request.type === 'IEP_GOAL' && status === 'approved') {
            studentDataService.updateIEPGoalForStudent(request.studentId, request.relatedId, { status: 'active' });
        }

        // Add to compliance log
        complianceLogService.addLog({
            user: 'Admin Portal',
            action: `Request ${status}`,
            details: `Request for ${request.studentName} (${request.type}) was ${status}. Comment: ${approverComment}`,
            approvedBy: 'Admin'
        });

        saveRequests(requests);
    }
};