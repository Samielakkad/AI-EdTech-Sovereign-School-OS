
import { Announcement, Parent, Conversation, Message } from '../types.ts';

const ANNOUNCEMENT_KEY = 'schoolAnnouncements';

const initializeAnnouncements = (): void => {
    const existing = localStorage.getItem(ANNOUNCEMENT_KEY);
    if (!existing) {
        const initial: Announcement[] = [
            {
                id: `anno-${Date.now() - 100000}`,
                timestamp: new Date(Date.now() - 100000).toISOString(),
                author: 'Principal Stevens',
                title: 'Welcome Back!',
                content: 'Welcome back to the new school year! Let\'s make it a great one. Please review the updated staff handbook by Friday.',
                audience: 'staff'
            },
        ];
        localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(initial));
    }
};

initializeAnnouncements();

export const getAnnouncements = (): Announcement[] => {
    try {
        const json = localStorage.getItem(ANNOUNCEMENT_KEY);
        const announcements: Announcement[] = json ? JSON.parse(json) : [];
        return announcements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
        console.error("Failed to parse announcements from localStorage", error);
        return [];
    }
};

const saveAnnouncements = (announcements: Announcement[]): void => {
    localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(announcements));
};

export const addAnnouncement = (data: Omit<Announcement, 'id' | 'timestamp' | 'author'>): void => {
    const announcements = getAnnouncements();
    const newAnnouncement: Announcement = {
        ...data,
        id: `anno-${Date.now()}`,
        timestamp: new Date().toISOString(),
        author: 'Admin', // In a real app, this would be the logged-in admin's name
    };
    announcements.unshift(newAnnouncement);
    saveAnnouncements(announcements);
};

// --- PARENT COMMUNICATION CENTER DATA ---

const PARENTS_KEY = 'schoolParents';
const CONVERSATIONS_KEY = 'parentConversations';

const initializeParentData = (): void => {
    if (!localStorage.getItem(PARENTS_KEY)) {
        const mockParents: Parent[] = [
            { id: 'p1', name: 'Maria Garcia', studentId: 's1', studentName: 'Alia Garcia', preferredLanguage: 'en', avatarUrl: 'https://i.pravatar.cc/40?u=p1' },
            { id: 'p2', name: 'John Carter', studentId: 's2', studentName: 'Ben Carter', preferredLanguage: 'en', avatarUrl: 'https://i.pravatar.cc/40?u=p2' },
            { id: 'p3', name: 'Sofia Davis', studentId: 's3', studentName: 'Chloe Davis', preferredLanguage: 'es', avatarUrl: 'https://i.pravatar.cc/40?u=p3' },
            { id: 'p4', name: 'Mark Evans', studentId: 's4', studentName: 'David Evans', preferredLanguage: 'en', avatarUrl: 'https://i.pravatar.cc/40?u=p4' },
            { id: 'p5', name: 'James White', studentId: 's5', studentName: 'Emily White', preferredLanguage: 'en', avatarUrl: 'https://i.pravatar.cc/40?u=p5' },
            { id: 'p6', name: 'Laura Green', studentId: 's6', studentName: 'Frank Green', preferredLanguage: 'en', avatarUrl: 'https://i.pravatar.cc/40?u=p6' },
            { id: 'p7', name: 'Isabella Hall', studentId: 's7', studentName: 'Grace Hall', preferredLanguage: 'en', avatarUrl: 'https://i.pravatar.cc/40?u=p7' },
        ];
        localStorage.setItem(PARENTS_KEY, JSON.stringify(mockParents));
    }

    if (!localStorage.getItem(CONVERSATIONS_KEY)) {
        const now = Date.now();
        const mockConversations: Conversation[] = [
            {
                id: 'c1', parentId: 'p1', parentName: 'Maria Garcia', studentId: 's1', studentName: 'Alia Garcia',
                subject: 'Excellent work on the history project!',
                lastMessageTimestamp: new Date(now - 86400000).toISOString(), isRead: true,
                messages: [
                    { id: 'm1-1', sender: 'teacher', text: 'Hi Maria, I just wanted to let you know that Alia did an absolutely fantastic job on her history project about Ancient Rome. Her presentation was well-researched and confident. I was very impressed!', timestamp: new Date(now - 86400000 * 2).toISOString() },
                    { id: 'm1-2', sender: 'parent', text: 'Thank you so much for letting me know! She worked really hard on that. We appreciate you.', timestamp: new Date(now - 86400000).toISOString() },
                ]
            },
            {
                id: 'c2', parentId: 'p3', parentName: 'Sofia Davis', studentId: 's3', studentName: 'Chloe Davis',
                subject: 'Checking in about recent class behavior',
                lastMessageTimestamp: new Date(now - 3600000).toISOString(), isRead: false,
                messages: [
                    { id: 'm2-1', sender: 'teacher', text: 'Hi Sofia, I wanted to check in about Chloe. She has been a bit distracted in class lately and has had trouble completing her work. I logged a few incidents regarding this. I wanted to see if we could partner on a strategy to help her focus.', timestamp: new Date(now - 7200000).toISOString() },
                    { id: 'm2-2', sender: 'parent', text: 'Hola Sra. Peterson, gracias por contactarme. Sí, he notado que ha estado teniendo dificultades para concentrarse en casa también. ¿Podemos hablar por teléfono mañana por la tarde?', timestamp: new Date(now - 3600000).toISOString() },
                ]
            },
        ];
        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(mockConversations));
    }
};

initializeParentData();

export const getParents = (): Parent[] => {
    const json = localStorage.getItem(PARENTS_KEY);
    return json ? JSON.parse(json) : [];
};

export const getConversations = (): Conversation[] => {
    const json = localStorage.getItem(CONVERSATIONS_KEY);
    const conversations: Conversation[] = json ? JSON.parse(json) : [];
    return conversations.sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
};

export const markConversationAsRead = (conversationId: string): void => {
    const conversations = getConversations();
    const index = conversations.findIndex(c => c.id === conversationId);
    if (index !== -1) {
        conversations[index].isRead = true;
        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    }
};

export const addMessageToConversation = (conversationId: string, messageText: string, sender: 'teacher' | 'parent'): Conversation | undefined => {
    const conversations = getConversations();
    const index = conversations.findIndex(c => c.id === conversationId);
    if (index !== -1) {
        const newMessage: Message = {
            id: `m-${Date.now()}`,
            sender,
            text: messageText,
            timestamp: new Date().toISOString(),
        };
        conversations[index].messages.push(newMessage);
        conversations[index].lastMessageTimestamp = newMessage.timestamp;
        conversations[index].isRead = sender === 'teacher'; // If teacher sends, it's "read" by them
        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
        return conversations[index];
    }
    return undefined;
};

export const createConversation = (parentId: string, subject: string, initialMessageText: string): Conversation => {
    const conversations = getConversations();
    const parents = getParents();
    const parent = parents.find(p => p.id === parentId);

    if (!parent) {
        throw new Error("Parent not found");
    }

    const now = new Date().toISOString();
    const initialMessage: Message = {
        id: `m-${Date.now()}`,
        sender: 'teacher',
        text: initialMessageText,
        timestamp: now,
    };

    const newConversation: Conversation = {
        id: `c-${Date.now()}`,
        parentId: parent.id,
        parentName: parent.name,
        studentId: parent.studentId,
        studentName: parent.studentName,
        subject: subject,
        messages: [initialMessage],
        lastMessageTimestamp: now,
        isRead: true, // Teacher just created it.
    };

    conversations.unshift(newConversation);
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    return newConversation;
};
