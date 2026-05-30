import { StudentStatus } from '../types.ts';
import { getStudentProfiles } from './studentDataService.ts';

const FOCUS_SESSION_KEY = 'focusSession';

export interface FocusSession {
    isActive: boolean;
    startTime: number;
    endTime: number;
    studentStatuses: Record<string, StudentStatus>;
}

// Initialize student statuses for a new session
const initializeStatuses = (): Record<string, StudentStatus> => {
    const students = getStudentProfiles();
    const statuses: Record<string, StudentStatus> = {};
    students.forEach(student => {
        // Only include students who are not absent
        if (student.status !== 'absent') {
            statuses[student.id] = 'focused';
        }
    });
    return statuses;
};

export const startFocusSession = (durationMinutes: number): FocusSession => {
    const now = Date.now();
    const session: FocusSession = {
        isActive: true,
        startTime: now,
        endTime: now + durationMinutes * 60 * 1000,
        studentStatuses: initializeStatuses(),
    };
    localStorage.setItem(FOCUS_SESSION_KEY, JSON.stringify(session));
    return session;
};

export const endFocusSession = (): void => {
    const session = getFocusSession();
    if (session) {
        session.isActive = false;
        localStorage.setItem(FOCUS_SESSION_KEY, JSON.stringify(session));
    } else {
        localStorage.removeItem(FOCUS_SESSION_KEY);
    }
};

export const getFocusSession = (): FocusSession | null => {
    const sessionJson = localStorage.getItem(FOCUS_SESSION_KEY);
    if (!sessionJson) return null;
    try {
        const session = JSON.parse(sessionJson) as FocusSession;
        // Check if the session is expired and deactivate if it is
        if (session.isActive && Date.now() > session.endTime) {
            session.isActive = false;
            localStorage.setItem(FOCUS_SESSION_KEY, JSON.stringify(session));
        }
        return session;
    } catch (e) {
        console.error("Failed to parse focus session", e);
        return null;
    }
};

export const updateStudentStatus = (studentId: string, status: StudentStatus): void => {
    const session = getFocusSession();
    // Ensure we don't update a non-existent or inactive session
    if (session && session.isActive && session.studentStatuses.hasOwnProperty(studentId)) {
        session.studentStatuses[studentId] = status;
        localStorage.setItem(FOCUS_SESSION_KEY, JSON.stringify(session));
    }
};
