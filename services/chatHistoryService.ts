import { ChatConversation, ChatMessage } from '../types.ts';

const HISTORY_KEY = 'chatHistory';

const getHistory = (): Record<string, ChatConversation> => {
    try {
        const historyJson = localStorage.getItem(HISTORY_KEY);
        return historyJson ? JSON.parse(historyJson) : {};
    } catch (error) {
        console.error("Failed to parse chat history from localStorage", error);
        return {};
    }
};

const saveHistory = (history: Record<string, ChatConversation>): void => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export const getConversations = (contextIdPrefix: string): ChatConversation[] => {
    const history = getHistory();
    return Object.values(history)
        .filter(convo => convo.contextId.startsWith(contextIdPrefix))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const saveConversation = (
    contextId: string,
    messages: ChatMessage[],
    conversationId: string | null
): ChatConversation => {
    const history = getHistory();
    const now = new Date().toISOString();
    
    const id = conversationId || `${contextId}-${Date.now()}`;
    const title = messages.find(m => m.role === 'user')?.parts[0].text.substring(0, 40) + '...' || 'New Chat';

    const conversation: ChatConversation = {
        id,
        contextId,
        title,
        messages,
        timestamp: now,
    };
    
    history[id] = conversation;
    saveHistory(history);
    return conversation;
};

export const deleteConversation = (conversationId: string): void => {
    const history = getHistory();
    delete history[conversationId];
    saveHistory(history);
};