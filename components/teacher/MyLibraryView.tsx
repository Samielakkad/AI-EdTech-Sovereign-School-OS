import React, { useState, useEffect } from 'react';
import * as archiveService from '../../services/archiveService.ts';
import { ArchivedItem } from '../../types.ts';
import Button from '../common/Button.tsx';
import { LayersIcon, CloseIcon } from '../icons/SettingsIcon.tsx';

const PreviewModal: React.FC<{ item: ArchivedItem; onClose: () => void; }> = ({ item, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl p-6 border border-gray-700 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-indigo-300">Preview: {item.title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon /></button>
                </div>
                <div className="flex-1 overflow-y-auto bg-gray-900/50 p-4 rounded-md">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                        {JSON.stringify(item.content, null, 2)}
                    </pre>
                </div>
                <div className="mt-6 text-right">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

const MyLibraryView: React.FC = () => {
    const [allItems, setAllItems] = useState<ArchivedItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<ArchivedItem[]>([]);
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<ArchivedItem | null>(null);

    useEffect(() => {
        const items = archiveService.getAllItems();
        setAllItems(items);
        setFilteredItems(items);
    }, []);

    useEffect(() => {
        let items = allItems;
        if (filterType !== 'all') {
            items = items.filter(item => item.type === filterType);
        }
        if (searchTerm) {
            items = items.filter(item => 
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                item.topic?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredItems(items);
    }, [filterType, searchTerm, allItems]);

    const filterOptions = ['all', 'LessonPlan', 'AdventureModule', 'Quiz', 'CourseSummary'];

    return (
        <>
            <div className="p-6 h-full flex flex-col">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold">My Library</h1>
                    <p className="text-gray-400">A persistent archive of all your generated content.</p>
                </header>

                <div className="flex gap-4 mb-6">
                    <div className="flex-grow">
                        <input
                            type="text"
                            placeholder="Search by title or topic..."
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-400"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div>
                        <select
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white"
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                        >
                            {filterOptions.map(opt => (
                                <option key={opt} value={opt} className="capitalize">{opt === 'all' ? 'All Types' : opt}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex-1 bg-gray-800 rounded-lg shadow-lg p-4 overflow-y-auto">
                    {filteredItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredItems.map(item => (
                                <div key={item.id} className="bg-gray-700/50 p-4 rounded-lg flex flex-col justify-between">
                                    <div>
                                        <p className="text-xs font-semibold bg-indigo-800 text-indigo-200 px-2 py-1 rounded-full inline-block mb-2">{item.type}</p>
                                        <h3 className="font-bold text-white truncate" title={item.title}>{item.title}</h3>
                                        {item.topic && <p className="text-sm text-gray-400 truncate">Topic: {item.topic}</p>}
                                        <p className="text-xs text-gray-500 mt-1">Saved: {new Date(item.timestamp).toLocaleDateString()}</p>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <Button variant="secondary" className="!text-xs !py-1 w-full" onClick={() => setSelectedItem(item)}>Preview</Button>
                                        <Button className="!text-xs !py-1 w-full" disabled>Load</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <LayersIcon className="w-16 h-16 mb-4"/>
                            <p className="font-semibold">No items match your search.</p>
                            <p>Your generated content will automatically appear here.</p>
                        </div>
                    )}
                </div>
            </div>
            {selectedItem && <PreviewModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
        </>
    );
};

export default MyLibraryView;
