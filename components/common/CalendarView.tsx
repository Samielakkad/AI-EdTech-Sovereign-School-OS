import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../../types.ts';
import * as calendarService from '../../services/calendarService.ts';
import Button from './Button.tsx';

interface CalendarViewProps {
    role: 'teacher' | 'student' | 'administration';
    studentId?: string;
}

const eventColors: Record<CalendarEvent['type'], string> = {
    holiday: 'bg-red-800/70 border-red-500 text-red-200',
    assignment: 'bg-yellow-800/70 border-yellow-500 text-yellow-200',
    quiz: 'bg-purple-800/70 border-purple-500 text-purple-200',
    class_period: 'bg-blue-800/70 border-blue-500 text-blue-200',
    event: 'bg-gray-600/70 border-gray-400 text-gray-200',
};

const CalendarView: React.FC<CalendarViewProps> = ({ role, studentId }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    useEffect(() => {
        const allEvents = calendarService.getEventsForRole(role, studentId);
        setEvents(allEvents);
    }, [role, studentId]);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDayOfWeek = startOfMonth.getDay();

    const daysInMonth = [];
    for (let i = 0; i < startDayOfWeek; i++) {
        daysInMonth.push(null);
    }
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
        daysInMonth.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    const changeMonth = (delta: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    const today = new Date();
    const isSameDay = (d1: Date, d2: Date) => 
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    return (
        <div className="p-6 h-full flex flex-col">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h1>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => changeMonth(-1)}>&larr; Prev</Button>
                    <Button variant="secondary" onClick={() => changeMonth(1)}>Next &rarr;</Button>
                </div>
            </header>
            <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-px bg-gray-700 rounded-lg overflow-hidden border border-gray-700">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-semibold text-sm text-gray-300 py-2 bg-gray-800">{day}</div>
                ))}
                {daysInMonth.map((day, index) => {
                    const isToday = day && isSameDay(day, today);
                    const eventsForDay = day 
                        ? events.filter(e => {
                            const eventStart = new Date(e.start + 'T00:00:00');
                            const eventEnd = e.end ? new Date(e.end + 'T00:00:00') : eventStart;
                            return day >= eventStart && day <= eventEnd;
                        })
                        : [];

                    return (
                        <div key={index} className="bg-gray-800 p-2 overflow-y-auto relative">
                            {day && (
                                <span className={`absolute top-2 right-2 text-xs font-bold ${isToday ? 'bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-400'}`}>
                                    {day.getDate()}
                                </span>
                            )}
                            <div className="mt-8 space-y-1">
                                {eventsForDay.map(event => (
                                    <div key={event.id} className={`p-1 rounded text-xs border ${eventColors[event.type]}`} title={event.title}>
                                        <p className="font-semibold truncate">{event.title}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;