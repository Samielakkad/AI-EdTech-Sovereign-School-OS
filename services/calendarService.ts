import { CalendarEvent, StudentProfile } from '../types.ts';
import * as studentDataService from './studentDataService.ts';

const MOCK_HOLIDAYS: Omit<CalendarEvent, 'id'>[] = [
    // 2024 Chinese Holidays
    { title: 'Mid-Autumn Festival', start: '2024-09-15', end: '2024-09-17', type: 'holiday', allDay: true },
    { title: 'National Day Holiday', start: '2024-10-01', end: '2024-10-07', type: 'holiday', allDay: true },

    // 2025 Chinese Holidays
    { title: "New Year's Day", start: '2025-01-01', type: 'holiday', allDay: true },
    { title: 'Chinese New Year', start: '2025-01-29', end: '2025-02-04', type: 'holiday', allDay: true },
    { title: 'Qingming Festival', start: '2025-04-05', type: 'holiday', allDay: true },
    { title: 'Labor Day Holiday', start: '2025-05-01', end: '2025-05-03', type: 'holiday', allDay: true },
    { title: 'Dragon Boat Festival', start: '2025-05-31', type: 'holiday', allDay: true },
    { title: 'Mid-Autumn Festival', start: '2025-10-06', type: 'holiday', allDay: true },
    { title: 'National Day Holiday', start: '2025-10-01', end: '2025-10-07', type: 'holiday', allDay: true },
];

const MOCK_SCHEDULE: Omit<CalendarEvent, 'id' | 'start' | 'end' | 'allDay'>[] = [
    { title: 'Math', type: 'class_period', description: 'Room 201' },
    { title: 'English', type: 'class_period', description: 'Room 201' },
    { title: 'Science', type: 'class_period', description: 'Room 201' },
    { title: 'Lunch', type: 'event' },
    { title: 'History', type: 'class_period', description: 'Room 201' },
    { title: 'Art', type: 'class_period', description: 'Art Room' },
];

const getEventsForRole = (role: 'teacher' | 'student' | 'administration', studentId?: string): CalendarEvent[] => {
    let events: CalendarEvent[] = MOCK_HOLIDAYS.map((e, i) => ({ ...e, id: `holiday-${i}` }));

    let assignments: any[] = [];
    if (role === 'teacher' || role === 'administration') {
        const profiles = studentDataService.getStudentProfiles();
        assignments = profiles.flatMap(p => p.assignments.map(a => ({...a, studentName: p.name})));
    } else if (role === 'student' && studentId) {
        const profile = studentDataService.getStudentProfile(studentId);
        assignments = profile ? profile.assignments : [];
    }

    const assignmentEvents: CalendarEvent[] = assignments.map(a => ({
        id: a.id,
        title: `Due: ${a.title}` + (a.studentName ? ` (${a.studentName})` : ''),
        start: a.dueDate,
        type: 'assignment',
        allDay: true
    }));

    events = [...events, ...assignmentEvents];
    
    // For this demo, we won't generate class period events, but this is where it would happen.

    return events;
}

export { getEventsForRole };