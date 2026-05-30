import React, { useState } from 'react';
import { StudentProfile, Quest } from '../../types.ts';
import Button from '../common/Button.tsx';
import * as studentDataService from '../../services/studentDataService.ts';
import { CoinIcon, CheckCircleIcon, UploadCloudIcon } from '../icons/StudentIcons.tsx';
import { CloseIcon } from '../icons/SettingsIcon.tsx';

interface QuestsViewProps {
    student: StudentProfile;
    onUpdate: () => void;
}

const QuestItem: React.FC<{ quest: Quest; onToggle: () => void; onOpenProofModal: (quest: Quest) => void }> = ({ quest, onToggle, onOpenProofModal }) => {
    const isCompleted = quest.status === 'completed';
    const isPending = quest.status === 'pending_review';

    let bgColor = 'bg-gray-700/60';
    let borderColor = '';
    if (isCompleted) {
        bgColor = 'bg-green-900/50';
        borderColor = 'border-l-4 border-green-500';
    } else if (isPending) {
        bgColor = 'bg-yellow-900/50';
        borderColor = 'border-l-4 border-yellow-500';
    }

    return (
        <div className={`p-4 rounded-lg flex items-center justify-between transition-all ${bgColor} ${borderColor}`}>
            <div className="flex items-start">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-4 ${isCompleted ? 'bg-green-500' : isPending ? 'bg-yellow-500' : 'bg-indigo-500'}`}>
                   {isCompleted ? <CheckCircleIcon className="w-5 h-5 text-white" /> : <CoinIcon className="w-5 h-5 text-white" />}
                </div>
                <div>
                    <h3 className={`font-bold ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>{quest.title}</h3>
                    <p className="text-sm text-gray-400">{quest.description}</p>
                </div>
            </div>
            <div className="text-right ml-4 flex-shrink-0">
                <p className={`font-bold text-lg ${isCompleted ? 'text-green-400' : isPending ? 'text-yellow-400' : 'text-yellow-400'}`}>+{quest.points} pts</p>
                {!isCompleted && !isPending && (
                    <Button 
                        onClick={quest.requiresProof ? () => onOpenProofModal(quest) : onToggle} 
                        className="!py-1 !px-3 !text-xs mt-1"
                    >
                        {quest.requiresProof ? 'Submit for Review' : 'Complete'}
                    </Button>
                )}
                 {isPending && <span className="text-xs font-semibold text-yellow-300 mt-1 block">Pending Review</span>}
            </div>
        </div>
    );
};

const ProofModal: React.FC<{ quest: Quest; onClose: () => void; onSubmit: (questId: string, proof: string) => void }> = ({ quest, onClose, onSubmit }) => {
    const [proofText, setProofText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(quest.id, proofText);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg relative p-8">
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <CloseIcon />
                </button>
                <form onSubmit={handleSubmit}>
                    <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                        <UploadCloudIcon/> Submit Proof for Quest
                    </h2>
                    <p className="text-indigo-300 font-semibold mb-4">{quest.title}</p>
                    <p className="text-sm text-gray-400 mb-4">{quest.description}</p>
                    <textarea
                        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Type your summary or answer here..."
                        rows={6}
                        value={proofText}
                        onChange={(e) => setProofText(e.target.value)}
                        required
                    />
                    <div className="pt-4 flex justify-end gap-2">
                         <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                         <Button type="submit" disabled={!proofText.trim()}>Submit for +{quest.points} Points</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const QuestsView: React.FC<QuestsViewProps> = ({ student, onUpdate }) => {
    const [proofQuest, setProofQuest] = useState<Quest | null>(null);
    
    const handleToggleQuest = (quest: Quest) => {
        studentDataService.updateQuestForStudent(student.id, quest.id, 'completed', quest.points);
        onUpdate();
    };
    
    const handleSubmitProof = (questId: string, proof: string) => {
        studentDataService.submitQuestProof(student.id, questId, { type: 'text', content: proof });
        setProofQuest(null);
        onUpdate();
    };

    const activeQuests = student.quests.filter(q => q.status === 'active');
    const pendingQuests = student.quests.filter(q => q.status === 'pending_review');
    const completedQuests = student.quests.filter(q => q.status === 'completed');

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 h-full">
            <h2 className="text-2xl font-bold mb-4">Your Daily Quests</h2>
            <div className="space-y-3">
                {activeQuests.length > 0 && activeQuests.map(quest => (
                    <QuestItem key={quest.id} quest={quest} onToggle={() => handleToggleQuest(quest)} onOpenProofModal={setProofQuest} />
                ))}
                {pendingQuests.length > 0 && pendingQuests.map(quest => (
                    <QuestItem key={quest.id} quest={quest} onToggle={() => {}} onOpenProofModal={() => {}} />
                ))}

                {activeQuests.length === 0 && pendingQuests.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <CheckCircleIcon className="w-12 h-12 mx-auto mb-2" />
                        <p>You've completed all your quests for today! Great job!</p>
                    </div>
                )}

                 {completedQuests.length > 0 && (
                    <div className="pt-4 mt-4 border-t border-gray-700">
                         <h3 className="text-lg font-bold text-gray-400 mb-3">Completed Today</h3>
                         <div className="space-y-3">
                         {completedQuests.map(quest => (
                            <QuestItem key={quest.id} quest={quest} onToggle={() => {}} onOpenProofModal={() => {}} />
                         ))}
                         </div>
                    </div>
                 )}
            </div>
            {proofQuest && <ProofModal quest={proofQuest} onClose={() => setProofQuest(null)} onSubmit={handleSubmitProof} />}
        </div>
    );
};

export default QuestsView;