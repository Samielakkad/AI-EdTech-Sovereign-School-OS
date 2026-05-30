import { Priority } from '../types.ts';

const PRIORITIES_KEY = 'teacherPriorities';

const getPriorities = (): Priority[] => {
    try {
        const prioritiesJson = localStorage.getItem(PRIORITIES_KEY);
        return prioritiesJson ? JSON.parse(prioritiesJson) : [];
    } catch (error) {
        console.error("Failed to parse priorities from localStorage", error);
        return [];
    }
};

const savePriorities = (priorities: Priority[]): void => {
    localStorage.setItem(PRIORITIES_KEY, JSON.stringify(priorities));
};

const addPriority = (text: string): Priority[] => {
    const priorities = getPriorities();
    const newPriority: Priority = {
        id: `priority-${Date.now()}`,
        text,
        isCompleted: false,
    };
    const newPriorities = [newPriority, ...priorities];
    savePriorities(newPriorities);
    return newPriorities;
};

const togglePriority = (id: string): Priority[] => {
    const priorities = getPriorities();
    const newPriorities = priorities.map(p =>
        p.id === id ? { ...p, isCompleted: !p.isCompleted } : p
    );
    savePriorities(newPriorities);
    return newPriorities;
};

const deletePriority = (id: string): Priority[] => {
    const priorities = getPriorities();
    const newPriorities = priorities.filter(p => p.id !== id);
    savePriorities(newPriorities);
    return newPriorities;
};

export { getPriorities, addPriority, togglePriority, deletePriority };