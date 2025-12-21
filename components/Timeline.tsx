import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { TimelineEvent } from '../types';
import { CalendarIcon, FlagIcon, TrashIcon, ClockIcon } from './Icons';

interface TimelineProps {
    userId: string;
    caseId: string;
}

const Timeline: React.FC<TimelineProps> = ({ userId, caseId }) => {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!userId || !caseId) return;

        const timelineRef = collection(db, 'users', userId, 'chats', caseId, 'timeline');
        const q = query(timelineRef, orderBy('date', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const timelineData = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            } as TimelineEvent));
            setEvents(timelineData);

            // Select first event by default if nothing selected
            if (timelineData.length > 0 && !selectedEventId) {
                setSelectedEventId(timelineData[0].id);
            }

            setLoading(false);
        }, (error) => {
            console.error("Timeline error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId, caseId]);

    const handleDelete = async (e: React.MouseEvent, eventId: string) => {
        e.stopPropagation();
        if (!confirm("Czy na pewno chcesz usunąć to wydarzenie z osi czasu?")) return;
        try {
            await deleteDoc(doc(db, 'users', userId, 'chats', caseId, 'timeline', eventId));
            if (selectedEventId === eventId) {
                setSelectedEventId(events.find(ev => ev.id !== eventId)?.id || null);
            }
        } catch (error) {
            console.error("Delete event error:", error);
        }
    };

    const selectedEvent = events.find(ev => ev.id === selectedEventId);

    if (loading) return <div className="animate-pulse h-20 bg-slate-800/50 rounded-xl mb-4"></div>;
    if (events.length === 0) return null;

    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 mb-6 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Oś Czasu Sprawy</h3>
                </div>
                <span className="text-[10px] text-slate-500 hidden sm:inline uppercase font-medium tracking-tight">Kliknij w punkt, aby zobaczyć szczegóły</span>
            </div>

            {/* Horizontal Timeline Container */}
            <div className="relative mb-6">
                <div
                    ref={scrollContainerRef}
                    className="overflow-x-auto pb-6 pt-6 px-8 flex items-center min-h-[100px] custom-scrollbar scroll-smooth"
                >
                    {/* Connector Line */}
                    <div className="absolute top-[62px] left-8 right-8 h-0.5 bg-slate-700/50 z-0"></div>

                    <div className="flex items-center gap-16 min-w-full">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className="relative flex flex-col items-center flex-shrink-0 cursor-pointer group"
                                onClick={() => setSelectedEventId(event.id)}
                            >
                                {/* Date Label (Top) */}
                                <div className={`absolute -top-6 text-[10px] font-mono whitespace-nowrap transition-all
                  ${selectedEventId === event.id ? 'text-cyan-400 font-bold scale-110' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                    {event.date}
                                </div>

                                {/* Node (Center) */}
                                <div className={`w-4 h-4 rounded-full border-2 border-slate-800 z-10 transition-all transform
                  ${selectedEventId === event.id ? 'scale-150 ring-4 ring-cyan-500/20' : 'group-hover:scale-125'}
                  ${event.type === 'deadline' ? 'bg-red-400' : event.type === 'status' ? 'bg-amber-400' : 'bg-cyan-400'}`}>
                                </div>

                                {/* Title Preview (Bottom) */}
                                <div className={`absolute top-6 text-[10px] font-medium whitespace-nowrap max-w-[120px] truncate transition-all
                  ${selectedEventId === event.id ? 'text-slate-200 font-semibold' : 'text-slate-500'}`}>
                                    {event.title}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Event Details View */}
            {selectedEvent && (
                <div className="bg-slate-900/60 rounded-lg border border-slate-700/50 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${selectedEvent.type === 'deadline' ? 'bg-red-400' : selectedEvent.type === 'status' ? 'bg-amber-400' : 'bg-cyan-400'}`}></span>
                                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-tighter">{selectedEvent.date}</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">
                                    {selectedEvent.type === 'fact' ? 'Fakt' : selectedEvent.type === 'deadline' ? 'Termin' : 'Status'}
                                </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-100 mt-1">{selectedEvent.title}</h4>
                        </div>
                        <button
                            onClick={(e) => handleDelete(e, selectedEvent.id)}
                            className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-md transition-all"
                            title="Usuń z osi czasu"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                    {selectedEvent.description && (
                        <p className="text-xs text-slate-400 leading-relaxed bg-slate-800/30 p-2 rounded border border-slate-700/30">
                            {selectedEvent.description}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Timeline;
