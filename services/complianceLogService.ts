
import { ComplianceLogEntry } from '../types.ts';

const LOG_KEY = 'complianceLog';

const initializeLog = (): void => {
    const existingLog = localStorage.getItem(LOG_KEY);
    if (!existingLog) {
        const initialLogs: ComplianceLogEntry[] = [
            {
                id: `log-${Date.now() - 200000}`,
                timestamp: new Date(Date.now() - 200000).toISOString(),
                user: 'Admin Portal',
                action: 'Generated Fairness Report',
                details: 'A school-wide incident fairness analysis was generated.',
                approvedBy: 'Principal Stevens'
            },
            {
                id: `log-${Date.now() - 100000}`,
                timestamp: new Date(Date.now() - 100000).toISOString(),
                user: 'Ms. Peterson',
                action: 'Logged Incident',
                details: 'Logged "Positive Behavior" incident for Alia Garcia.',
            },
            {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                user: 'System',
                action: 'Initialized Portals',
                details: 'Sovereign School OS portals were successfully initialized.',
            },
        ];
        localStorage.setItem(LOG_KEY, JSON.stringify(initialLogs));
    }
};

initializeLog();

export const getLogs = (): ComplianceLogEntry[] => {
    try {
        const logsJson = localStorage.getItem(LOG_KEY);
        const logs: ComplianceLogEntry[] = logsJson ? JSON.parse(logsJson) : [];
        // Sort by most recent first
        return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
        console.error("Failed to parse compliance logs from localStorage", error);
        return [];
    }
};

const saveLogs = (logs: ComplianceLogEntry[]): void => {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
};

export const addLog = (logData: Omit<ComplianceLogEntry, 'id' | 'timestamp'>): void => {
    const logs = getLogs();
    const newLog: ComplianceLogEntry = {
        ...logData,
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
    };
    logs.push(newLog);
    saveLogs(logs);
};
