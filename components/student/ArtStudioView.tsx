import React from 'react';
import Button from '../common/Button.tsx';
import { ArtIcon } from '../icons/StudentIcons.tsx';
import ImageGenerator from '../teacher/ImageGenerator.tsx';
import ImageEditor from '../teacher/ImageEditor.tsx';

interface ArtStudioViewProps {
    onBack: () => void;
}

const ArtStudioView: React.FC<ArtStudioViewProps> = ({ onBack }) => {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                    <ArtIcon className="w-8 h-8 text-rose-400" />
                    Art Studio
                </h2>
                <Button onClick={onBack} variant="secondary">&larr; Back to Learning Hub</Button>
            </div>
            <p className="text-gray-400">Unleash your creativity! Generate unique images from your imagination, or upload your own to edit with AI.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ImageGenerator />
                <ImageEditor />
            </div>
        </div>
    );
};

export default ArtStudioView;
