import { ArchivedItem } from '../types.ts';

const ARCHIVE_KEY = 'digitalArchive';

const initializeArchive = (): void => {
    if (!localStorage.getItem(ARCHIVE_KEY)) {
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify([]));
    }
};

initializeArchive();

export const getAllItems = (): ArchivedItem[] => {
    try {
        const json = localStorage.getItem(ARCHIVE_KEY);
        const items: ArchivedItem[] = json ? JSON.parse(json) : [];
        return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
        console.error("Failed to parse archive from localStorage", error);
        return [];
    }
};

const saveAllItems = (items: ArchivedItem[]): void => {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(items));
};

export const addItem = (itemData: Omit<ArchivedItem, 'id' | 'timestamp'>): ArchivedItem => {
    const items = getAllItems();
    const newItem: ArchivedItem = {
        ...itemData,
        id: `archive-${Date.now()}`,
        timestamp: new Date().toISOString(),
    };
    items.unshift(newItem); // Add to the top
    saveAllItems(items);
    return newItem;
};
