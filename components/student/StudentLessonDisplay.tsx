import React from 'react';
import { LessonPlanActivity } from '../../types.ts';
import { PublishedLesson } from '../../services/lessonService.ts';
import Button from '../common/Button.tsx';
import { DownloadIcon } from '../icons/SettingsIcon.tsx';

declare const jspdf: any;

const StudentActivityCard: React.FC<{
    activity: LessonPlanActivity;
    video?: { url: string; name: string };
}> = ({ activity, video }) => {
    return (
        <div className="bg-gray-700/50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-indigo-300">{activity.activity}</h4>
                <span className="text-xs font-semibold bg-gray-600 px-2 py-1 rounded-full">{activity.duration} mins</span>
            </div>
            <p className="text-sm text-gray-300 mb-4 whitespace-pre-wrap">{activity.description}</p>
            {video && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                    <video controls src={video.url} className="w-full rounded-lg mb-2 max-h-60 bg-black" title={`Video for ${activity.activity}`}></video>
                    <a
                        href={video.url}
                        download={video.name}
                        className="w-full"
                    >
                        <Button variant="secondary" className="w-full flex items-center justify-center" aria-label={`Download video: ${video.name}`}>
                            <DownloadIcon className="w-5 h-5 mr-2" />
                            Download Video ({video.name})
                        </Button>
                    </a>
                </div>
            )}
        </div>
    );
};

interface StudentLessonDisplayProps {
    lessonData: PublishedLesson;
    onBack: () => void;
}

const StudentLessonDisplay: React.FC<StudentLessonDisplayProps> = ({ lessonData, onBack }) => {
    const { lessonPlan, videos, slides } = lessonData;
    
    const handleDownloadSlides = () => {
        if (!slides || slides.length === 0) return;
        
        const { jsPDF } = jspdf;
        // This assumes a 16:9 aspect ratio was used. A more robust solution might store this in lessonData.
        const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1280, 720] });

        slides.forEach((slide, index) => {
            if (index > 0) doc.addPage();
            doc.setFillColor(31, 41, 55); // bg-gray-800
            doc.rect(0, 0, 1280, 720, 'F');
            
            if (slide.imageUrl) {
                try {
                    doc.addImage(slide.imageUrl, 'PNG', 40, 150, 640, 360);
                } catch(e) { console.error("PDF Image Error:", e); }
                doc.setTextColor(229, 231, 235);
                doc.setFontSize(48);
                doc.text(slide.title, 720, 150, { maxWidth: 520 });
                if (slide.points && slide.points.length > 0) {
                    doc.setTextColor(209, 213, 219);
                    doc.setFontSize(28);
                    const splitPoints = doc.splitTextToSize(slide.points.map(p => `• ${p}`).join('\n'), 520);
                    doc.text(splitPoints, 720, 240);
                }
            } else {
                doc.setTextColor(229, 231, 235);
                doc.setFontSize(60);
                doc.text(slide.title, 60, 120, { maxWidth: 1160 });
                if (slide.points) {
                    doc.setTextColor(209, 213, 219);
                    doc.setFontSize(32);
                    const splitPoints = doc.splitTextToSize(slide.points.map(p => `• ${p}`).join('\n'), 1100);
                    doc.text(splitPoints, 80, 220);
                }
            }
        });
        
        doc.save(`${lessonPlan.title.replace(/\s+/g, '_')}_Slides.pdf`);
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <Button variant="secondary" onClick={onBack} className="mb-4">&larr; Back to Learning Hub</Button>
            
            <div className="space-y-6">
                <header className="pb-4 border-b border-gray-700">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-indigo-400">{lessonPlan.title}</h1>
                            <p className="text-md text-gray-400">Topic: {lessonPlan.topic}</p>
                        </div>
                        {slides && slides.length > 0 && (
                            <Button onClick={handleDownloadSlides} className="flex items-center gap-2">
                                <DownloadIcon className="w-5 h-5"/>
                                Download Slides
                            </Button>
                        )}
                    </div>
                </header>
                <section>
                    <h2 className="text-xl font-bold mb-3">Lesson Activities</h2>
                    <div className="space-y-4">
                        {lessonPlan.lessonActivities.map((activity, index) => {
                            const videoData = videos[index];
                            return (
                                <StudentActivityCard
                                    key={index}
                                    activity={activity}
                                    video={videoData ? { url: videoData.dataUrl, name: videoData.name } : undefined}
                                />
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default StudentLessonDisplay;
