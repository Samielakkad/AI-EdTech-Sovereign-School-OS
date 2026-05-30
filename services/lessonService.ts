import { LessonPlan } from '../types.ts';

const PUBLISHED_LESSON_KEY = 'publishedLessonPlan';

// This type is defined here to avoid touching types.ts
export interface Slide {
    title: string;
    points: string[];
    imageUrl: string | null;
}

export interface PublishedLesson {
    lessonPlan: LessonPlan;
    videos: Record<number, { dataUrl: string; name: string }>;
    slides: Slide[];
    timestamp: string;
}

export const publishLesson = (
    lessonPlan: LessonPlan, 
    videos: Record<number, { dataUrl: string; name: string }>,
    slides: Slide[]
): void => {
    const data: PublishedLesson = {
        lessonPlan, // sourceText is now included here
        videos,
        slides,
        timestamp: new Date().toISOString(),
    };
    localStorage.setItem(PUBLISHED_LESSON_KEY, JSON.stringify(data));
};

export const getPublishedLesson = (): PublishedLesson | null => {
    try {
        const lessonJson = localStorage.getItem(PUBLISHED_LESSON_KEY);
        // For demo purposes, let's say the lesson is only valid for the current day.
        if (lessonJson) {
            const lesson: PublishedLesson = JSON.parse(lessonJson);
            const today = new Date().toISOString().split('T')[0];
            if (lesson.timestamp.startsWith(today)) {
                return lesson;
            }
        }
        return null;
    } catch (error) {
        console.error("Failed to parse published lesson from localStorage", error);
        return null;
    }
};

export const clearPublishedLesson = (): void => {
    localStorage.removeItem(PUBLISHED_LESSON_KEY);
};