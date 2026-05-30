import { LessonPlan } from '../types.ts';

const VERSIONS_KEY = 'lessonPlanVersions';

export interface LessonVersion {
  plan: LessonPlan;
  timestamp: string; // ISO string
}

type VersionHistory = Record<string, LessonVersion[]>;

const getHistory = (): VersionHistory => {
    try {
        const historyJson = localStorage.getItem(VERSIONS_KEY);
        return historyJson ? JSON.parse(historyJson) : {};
    } catch (error) {
        console.error("Failed to parse lesson plan versions from localStorage", error);
        return {};
    }
};

const saveHistory = (history: VersionHistory): void => {
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(history));
};

export const addVersion = (sessionId: string, plan: LessonPlan): void => {
    const history = getHistory();
    if (!history[sessionId]) {
        history[sessionId] = [];
    }
    const newVersion: LessonVersion = {
        plan,
        timestamp: new Date().toISOString(),
    };
    // Add to the front (newest first)
    history[sessionId].unshift(newVersion);
    saveHistory(history);
};

export const getVersions = (sessionId: string): LessonVersion[] => {
    const history = getHistory();
    return history[sessionId] || [];
};

export const clearHistory = (sessionId: string): void => {
    const history = getHistory();
    delete history[sessionId];
    saveHistory(history);
};
