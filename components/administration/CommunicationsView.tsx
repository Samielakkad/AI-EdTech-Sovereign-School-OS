
import React, { useState, useEffect } from 'react';
import { Announcement } from '../../types.ts';
import * as communicationService from '../../services/communicationService.ts';
import Button from '../common/Button.tsx';
import Input from '../common/Input.tsx';
import { MegaphoneIcon } from '../icons/SettingsIcon.tsx';

const CommunicationsView: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    const fetchAnnouncements = () => {
        setAnnouncements(communicationService.getAnnouncements());
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleCreate = () => {
        communicationService.addAnnouncement({
            title: newTitle,
            content: newContent,
            audience: 'staff'
        });
        fetchAnnouncements();
        setIsCreating(false);
        setNewTitle('');
        setNewContent('');
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">School Communications</h1>
                    <p className="text-gray-400">Create and view school-wide announcements.</p>
                </div>
                <Button onClick={() => setIsCreating(true)}>
                    <MegaphoneIcon className="w-5 h-5 mr-2" />
                    New Announcement
                </Button>
            </header>
            <div className="flex-1 bg-gray-800 rounded-lg shadow-lg p-6 overflow-y-auto">
                <div className="space-y-6">
                    {announcements.map(item => (
                        <div key={item.id} className="bg-gray-700/50 p-6 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="text-xl font-bold text-indigo-300">{item.title}</h2>
                                <p className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleString()}</p>
                            </div>
                            <p className="text-sm text-gray-500 font-semibold mb-4">By {item.author}</p>
                            <p className="text-gray-300 whitespace-pre-wrap">{item.content}</p>
                        </div>
                    ))}
                     {announcements.length === 0 && (
                        <div className="text-center py-16 text-gray-500">
                            <MegaphoneIcon className="w-20 h-20 mx-auto mb-4" />
                            <p>No announcements have been posted yet.</p>
                        </div>
                     )}
                </div>
            </div>

            {isCreating && (
                 <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl relative p-8">
                        <h2 className="text-2xl font-bold mb-6">Create New Announcement</h2>
                        <div className="space-y-4">
                            <Input 
                                label="Title"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="e.g., Staff Meeting Reminder"
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Content</label>
                                <textarea
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    rows={6}
                                    value={newContent}
                                    onChange={e => setNewContent(e.target.value)}
                                    placeholder="Write your announcement here..."
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-4">
                            <Button variant="secondary" onClick={() => setIsCreating(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={!newTitle || !newContent}>Publish</Button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default CommunicationsView;