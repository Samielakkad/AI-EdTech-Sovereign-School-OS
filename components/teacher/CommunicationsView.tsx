import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, Parent, CommunicationTopic, communicationTopicLabels, Teacher } from '../../types.ts';
import * as communicationService from '../../services/communicationService.ts';
import * as geminiService from '../../services/geminiService.ts';
import * as studentDataService from '../../services/studentDataService.ts';
import Button from '../common/Button.tsx';
import Select from '../common/Select.tsx';
import { MailIcon, SendIcon, LanguagesIcon, SparklesIcon, CloseIcon } from '../icons/SettingsIcon.tsx';

interface ComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (targetParentId: string, topic: CommunicationTopic, message: string) => void;
    mode: 'new' | 'reply';
    parents: Parent[];
    teacher: Teacher;
    conversation?: Conversation | null;
    initialData?: { parentId?: string; topic?: CommunicationTopic };
}

const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onSend, mode, parents, teacher, conversation, initialData }) => {
    const [targetParentId, setTargetParentId] = useState<string>('');
    const [topic, setTopic] = useState<CommunicationTopic>('general_question');
    const [keyPoints, setKeyPoints] = useState('');
    const [generatedDraft, setGeneratedDraft] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setKeyPoints('');
            setGeneratedDraft('');
            setIsGenerating(false);
            if (mode === 'reply' && conversation) {
                setTargetParentId(conversation.parentId);
                const foundTopic = (Object.keys(communicationTopicLabels) as CommunicationTopic[]).find(t =>
                    conversation.subject.toLowerCase().includes(communicationTopicLabels[t].toLowerCase())
                );
                setTopic(foundTopic || 'general_question');
            } else if (mode === 'new') {
                setTargetParentId(initialData?.parentId || (parents[0]?.id || ''));
                setTopic(initialData?.topic || 'general_question');
            }
        }
    }, [isOpen, mode, conversation, parents, initialData]);

    if (!isOpen) return null;

    const handleGenerateDraft = async () => {
        setIsGenerating(true);
        const parent = parents.find(p => p.id === targetParentId);
        if (!parent || !teacher) return;

        const draft = await geminiService.draftFormalResponse(topic, keyPoints, parent.studentName, parent.name, teacher.name);
        setGeneratedDraft(draft);
        setIsGenerating(false);
    };

    const handleSend = () => {
        if (targetParentId && topic && generatedDraft) {
            onSend(targetParentId, topic, generatedDraft);
        }
    };

    const targetParent = parents.find(p => p.id === targetParentId);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl relative p-8 flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <CloseIcon />
                </button>
                <h2 className="text-2xl font-bold mb-6 flex-shrink-0">{mode === 'new' ? 'Compose New Message' : `Reply to ${conversation?.parentName}`}</h2>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {mode === 'new' && (
                        <Select label="To" value={targetParentId} onChange={e => setTargetParentId(e.target.value)}>
                            {parents.map(p => <option key={p.id} value={p.id}>{p.name} (Parent of {p.studentName})</option>)}
                        </Select>
                    )}
                    <Select label="Topic" value={topic} onChange={e => setTopic(e.target.value as CommunicationTopic)}>
                        {Object.entries(communicationTopicLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </Select>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Key Points</label>
                        <textarea
                            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="- Student did great on the quiz&#10;- Showed leadership in group activity&#10;- Remember to bring permission slip"
                            rows={4}
                            value={keyPoints}
                            onChange={e => setKeyPoints(e.target.value)}
                        />
                    </div>
                    <Button type="button" onClick={handleGenerateDraft} disabled={isGenerating || !keyPoints.trim() || !targetParentId} className="w-full flex items-center justify-center">
                        <SparklesIcon className="w-5 h-5 mr-2"/>
                        {isGenerating ? 'Generating...' : 'Generate Draft'}
                    </Button>
                    {isGenerating && (
                        <div className="text-center py-4 text-gray-400">Generating AI-powered draft...</div>
                    )}
                    {generatedDraft && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Generated Draft (Editable)</label>
                            <textarea
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                                rows={10}
                                value={generatedDraft}
                                onChange={e => setGeneratedDraft(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="pt-6 flex justify-end gap-4 flex-shrink-0">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSend} disabled={!generatedDraft}>Send Message</Button>
                </div>
            </div>
        </div>
    );
};


interface CommunicationsViewProps {
    targetStudentId?: string;
    suggestedTopic?: CommunicationTopic;
    onTargetHandled?: () => void;
}

const CommunicationsView: React.FC<CommunicationsViewProps> = ({ targetStudentId, suggestedTopic, onTargetHandled }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [parents, setParents] = useState<Parent[]>([]);
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
    const [composeMode, setComposeMode] = useState<'new' | 'reply'>('new');
    const [initialComposeData, setInitialComposeData] = useState<{ parentId?: string; topic?: CommunicationTopic }>({});

    useEffect(() => {
        setConversations(communicationService.getConversations());
        setParents(communicationService.getParents());
        setTeacher(studentDataService.getTeachers()[0] || null);
    }, []);

    useEffect(() => {
        if (targetStudentId && onTargetHandled && parents.length > 0) {
            const parent = parents.find(p => p.studentId === targetStudentId);
            if (parent) {
                const existingConvo = conversations.find(c => c.parentId === parent.id);
                if (existingConvo) {
                    setSelectedConversation(existingConvo);
                } else {
                    setInitialComposeData({ parentId: parent.id, topic: suggestedTopic });
                    setComposeMode('new');
                    setIsComposeModalOpen(true);
                }
            }
            onTargetHandled();
        }
    }, [targetStudentId, suggestedTopic, onTargetHandled, parents, conversations]);

    useEffect(() => {
        if (selectedConversation && !selectedConversation.isRead) {
            communicationService.markConversationAsRead(selectedConversation.id);
            const updatedConversations = conversations.map(c => 
                c.id === selectedConversation.id ? { ...c, isRead: true } : c
            );
            setConversations(updatedConversations);
        }
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [selectedConversation]);

    const handleSelectConversation = (conversation: Conversation) => {
        setSelectedConversation(conversation);
    };

    const handleNewMessageClick = () => {
        setComposeMode('new');
        setInitialComposeData({});
        setIsComposeModalOpen(true);
    };

    const handleReplyClick = () => {
        if (selectedConversation) {
            setComposeMode('reply');
            setIsComposeModalOpen(true);
        }
    };
    
    const handleSendComposedMessage = (
        targetParentId: string, 
        topic: CommunicationTopic, 
        message: string
    ) => {
        setIsLoading(true);
        if (composeMode === 'new') {
            const subject = communicationTopicLabels[topic];
            const newConvo = communicationService.createConversation(targetParentId, subject, message);
            setConversations(prev => [newConvo, ...prev.filter(c => c.id !== newConvo.id)].sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()));
            setSelectedConversation(newConvo);
        } else if (composeMode === 'reply' && selectedConversation) {
            const updatedConvo = communicationService.addMessageToConversation(selectedConversation.id, message, 'teacher');
            if (updatedConvo) {
                setSelectedConversation(updatedConvo);
                setConversations(prev => prev.map(c => c.id === updatedConvo.id ? updatedConvo : c).sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()));
            }
        }
        setIsComposeModalOpen(false);
        setIsLoading(false);
    };

    const handleTranslate = async (message: Message) => {
        if (!selectedConversation || isAiLoading) return;
        setIsAiLoading(true);

        const parent = parents.find(p => p.id === selectedConversation.parentId);
        if (!parent) return;

        const targetLanguage = message.translatedText ? (parent.preferredLanguage === 'es' ? 'es' : 'en') : (parent.preferredLanguage === 'es' ? 'en' : 'es');
        const textToTranslate = message.translatedText || message.text;
        
        const translatedText = await geminiService.translateMessage(textToTranslate, targetLanguage);

        const updatedMessages = selectedConversation.messages.map(m => 
            m.id === message.id ? { ...m, translatedText: message.translatedText ? undefined : translatedText } : m
        );
        setSelectedConversation({ ...selectedConversation, messages: updatedMessages });
        setIsAiLoading(false);
    };

    const handleSummarize = async () => {
        if (!selectedConversation || selectedConversation.messages.length < 2 || isAiLoading) return;
        setIsAiLoading(true);
        const summary = await geminiService.summarizeConversation(selectedConversation.messages);
        alert(`Conversation Summary:\n\n${summary}`);
        setIsAiLoading(false);
    };

    if (!teacher) {
        return <div>Loading...</div>; // Or some other loading state
    }

    return (
        <div className="p-6 h-full flex flex-col">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Parent Communication Center</h1>
                <p className="text-gray-400">Manage all parent messages, digests, and alerts in one place.</p>
            </header>
            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                <div className="col-span-12 lg:col-span-4 xl:col-span-3 bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col overflow-y-auto">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h2 className="text-xl font-bold">Inbox</h2>
                        <Button variant="secondary" onClick={handleNewMessageClick}>New Message</Button>
                    </div>
                    <div className="space-y-2">
                        {conversations.map(convo => (
                            <button
                                key={convo.id}
                                onClick={() => handleSelectConversation(convo)}
                                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedConversation?.id === convo.id ? 'bg-indigo-600/50' : 'hover:bg-gray-700/50'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <p className="font-bold text-white truncate">{convo.parentName}</p>
                                    {!convo.isRead && <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full flex-shrink-0 ml-2"></span>}
                                </div>
                                <p className="text-sm text-gray-300 truncate">{convo.subject}</p>
                                <p className="text-xs text-gray-500">{new Date(convo.lastMessageTimestamp).toLocaleDateString()}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-8 xl:col-span-9 bg-gray-800 rounded-lg shadow-lg flex flex-col">
                    {selectedConversation ? (
                        <>
                            <div className="p-4 border-b border-gray-700 flex-shrink-0">
                                <h3 className="text-xl font-bold text-white">{selectedConversation.parentName}</h3>
                                <p className="text-sm text-gray-400">RE: {selectedConversation.subject} (Student: {selectedConversation.studentName})</p>
                                <div className="mt-2 flex gap-2">
                                    <Button variant="secondary" onClick={handleSummarize} className="!text-xs !py-1" disabled={selectedConversation.messages.length < 2 || isAiLoading}><SparklesIcon className="w-4 h-4 mr-1"/> Summarize Thread</Button>
                                </div>
                            </div>
                            <div className="flex-1 p-6 overflow-y-auto space-y-6">
                                {selectedConversation.messages.map(msg => (
                                    <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'teacher' ? 'justify-end' : ''}`}>
                                        <div className={`max-w-xl p-4 rounded-2xl ${msg.sender === 'teacher' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                            {msg.translatedText && <p className="mt-2 pt-2 border-t border-indigo-400/50 text-xs italic opacity-80">{msg.translatedText}</p>}
                                            {msg.sender === 'parent' && parents.find(p => p.id === selectedConversation?.parentId)?.preferredLanguage !== 'en' && (
                                                <button onClick={() => handleTranslate(msg)} className="text-indigo-200 text-xs mt-2 hover:underline flex items-center gap-1 disabled:opacity-50" disabled={isAiLoading}>
                                                    <LanguagesIcon className="w-3 h-3"/> {msg.translatedText ? 'Show Original' : 'Translate'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-4 border-t border-gray-700 flex-shrink-0">
                                <Button onClick={handleReplyClick} className="w-full">
                                    Compose Reply...
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-gray-500">
                            <div>
                                <MailIcon className="w-24 h-24 mx-auto mb-4" />
                                <h2 className="text-xl font-bold">Select a conversation</h2>
                                <p>Choose a message thread from the left to view it here.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
             <ComposeModal
                isOpen={isComposeModalOpen}
                onClose={() => setIsComposeModalOpen(false)}
                onSend={handleSendComposedMessage}
                mode={composeMode}
                parents={parents}
                teacher={teacher}
                conversation={selectedConversation}
                initialData={initialComposeData}
            />
        </div>
    );
};

export default CommunicationsView;