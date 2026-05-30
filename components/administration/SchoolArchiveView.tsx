import React, { useState, useEffect } from 'react';
import { ComplianceLogEntry, ChatConversation } from '../../types.ts';
import * as complianceLogService from '../../services/complianceLogService.ts';
import * as chatHistoryService from '../../services/chatHistoryService.ts';
import MarkdownRenderer from '../common/MarkdownRenderer.tsx';
import { CloseIcon } from '../icons/SettingsIcon.tsx';

const ConversationModal: React.FC<{ conversation: ChatConversation, onClose: () => void }> = ({ conversation, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6 border border-gray-700 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-indigo-300">Conversation Details</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon /></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {conversation.messages.map((msg, index) => (
                         <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            <div className={`max-w-xl p-3 rounded-lg whitespace-pre-wrap ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                               <MarkdownRenderer text={msg.parts[0].text} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const SchoolArchiveView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'compliance' | 'chats'>('compliance');
    const [logs, setLogs] = useState<ComplianceLogEntry[]>([]);
    const [chats, setChats] = useState<ChatConversation[]>([]);
    const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(null);

    useEffect(() => {
        setLogs(complianceLogService.getLogs());
        setChats(chatHistoryService.getConversations('admin-copilot'));
    }, []);

    return (
        <>
            <div className="p-6 h-full flex flex-col">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold">School Archive</h1>
                    <p className="text-gray-400">An immutable log of key system actions and AI interactions.</p>
                </header>

                <div className="border-b border-gray-700 mb-6">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('compliance')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'compliance' ? 'border-indigo-400 text-indigo-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Compliance Log</button>
                        <button onClick={() => setActiveTab('chats')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'chats' ? 'border-indigo-400 text-indigo-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>AI Copilot History</button>
                    </nav>
                </div>

                <div className="bg-gray-800 rounded-lg shadow-lg flex-1 overflow-y-auto">
                    {activeTab === 'compliance' && (
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Timestamp</th>
                                    <th scope="col" className="px-6 py-3">User/System</th>
                                    <th scope="col" className="px-6 py-3">Action</th>
                                    <th scope="col" className="px-6 py-3">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="px-6 py-4 font-medium whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="px-6 py-4">{log.user}</td>
                                        <td className="px-6 py-4 font-semibold">{log.action}</td>
                                        <td className="px-6 py-4 max-w-sm truncate" title={log.details}>{log.details}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {activeTab === 'chats' && (
                        <div className="p-4">
                            {chats.length > 0 ? (
                                <ul className="space-y-3">
                                    {chats.map(chat => (
                                        <li key={chat.id} className="bg-gray-700/50 p-3 rounded-md hover:bg-gray-700 cursor-pointer" onClick={() => setSelectedChat(chat)}>
                                            <p className="font-semibold text-indigo-300 truncate">{chat.title}</p>
                                            <p className="text-xs text-gray-400">Last updated: {new Date(chat.timestamp).toLocaleString()}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-500 py-16">No AI Copilot conversations have been saved yet.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {selectedChat && <ConversationModal conversation={selectedChat} onClose={() => setSelectedChat(null)} />}
        </>
    );
};

export default SchoolArchiveView;