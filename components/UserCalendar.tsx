import React, { useState } from 'react';
import { Reminder } from '../types';
import {
    CalendarIcon,
    PlusIcon,
    TrashIcon,
    CheckIcon,
    XIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    BriefcaseIcon,
    FlagIcon
} from './Icons';

interface UserCalendarProps {
    events: Reminder[];
    onAddReminder: (date: string, title: string, description?: string) => void;
    onDeleteReminder: (id: string) => void;
    onToggleReminder: (id: string, currentStatus: boolean) => void;
}

const UserCalendar: React.FC<UserCalendarProps> = ({
    events,
    onAddReminder,
    onDeleteReminder,
    onToggleReminder
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const days = [];
    const firstDay = firstDayOfMonth(year, month);
    // Adjust for Monday start (0=Sun, 1=Mon... -> 0=Mon, 6=Sun)
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    // Prev month padding
    for (let i = 0; i < startOffset; i++) {
        days.push(null);
    }

    // Actual days
    for (let i = 1; i <= daysInMonth(year, month); i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        days.push(dateStr);
    }

    const monthNames = [
        "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
        "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
    ];

    const changeMonth = (offset: number) => {
        const newDate = new Date(year, month + offset, 1);
        setCurrentDate(newDate);
    };

    const selectedDayEvents = events.filter(e => e.date === selectedDate);
    const hasEvent = (date: string) => events.some(e => e.date === date);

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        onAddReminder(selectedDate, newTitle, newDescription);
        setNewTitle('');
        setNewDescription('');
        setShowAddForm(false);
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Header / Month Select */}
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <CalendarIcon className="text-cyan-400" />
                    {monthNames[month]} {year}
                </h4>
                <div className="flex gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
                        <ChevronDownIcon className="rotate-90" />
                    </button>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
                        <ChevronUpIcon className="rotate-90" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Calendar Grid */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-slate-500 uppercase py-1">{d}</div>
                        ))}
                        {days.map((day, idx) => (
                            <div key={idx} className="aspect-square flex items-center justify-center relative">
                                {day ? (
                                    <button
                                        onClick={() => setSelectedDate(day)}
                                        className={`w-full h-full flex items-center justify-center rounded-lg text-sm transition-all duration-200 border
                                            ${selectedDate === day
                                                ? 'bg-cyan-600/30 border-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/20'
                                                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}
                                        `}
                                    >
                                        {day.split('-')[2].replace(/^0/, '')}
                                        {hasEvent(day) && (
                                            <span className="absolute bottom-1 w-1 h-1 bg-cyan-400 rounded-full"></span>
                                        )}
                                    </button>
                                ) : (
                                    <div className="w-full h-full"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Event Details */}
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h5 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                            {selectedDate}
                        </h5>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 p-1.5 rounded-lg transition-colors border border-cyan-600/30 flex items-center gap-1 text-xs"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Dodaj przypomnienie</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-[200px]">
                        {selectedDayEvents.length > 0 ? (
                            selectedDayEvents.map(event => (
                                <div
                                    key={event.id}
                                    className={`p-3 rounded-xl border flex gap-3 group transition-all
                                        ${event.type === 'deadline'
                                            ? 'bg-purple-900/10 border-purple-500/30 shadow-sm'
                                            : 'bg-slate-800/80 border-slate-700 shadow-sm hover:border-slate-600'}
                                        ${event.completed ? 'opacity-50 grayscale-[0.5]' : ''}
                                    `}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {event.type === 'deadline' ? (
                                                <FlagIcon className="w-3.5 h-3.5 text-purple-400" />
                                            ) : (
                                                <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />
                                            )}
                                            <span className={`text-sm font-semibold ${event.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                                {event.title}
                                            </span>
                                        </div>
                                        {event.description && (
                                            <p className="text-xs text-slate-400 leading-relaxed ml-5">{event.description}</p>
                                        )}
                                        {event.topic && (
                                            <div className="mt-2 ml-5 flex items-center gap-1 text-[10px] text-purple-400/80 font-medium italic">
                                                <BriefcaseIcon className="w-3 h-3" />
                                                Sprawa: {event.topic}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-center justify-start gap-2">
                                        {event.type === 'personal' && (
                                            <>
                                                <button
                                                    onClick={() => onToggleReminder(event.id, event.completed)}
                                                    className={`p-1.5 rounded-lg border transition-all
                                                        ${event.completed ? 'bg-green-600/20 border-green-600/50 text-green-400' : 'bg-slate-700/50 border-slate-600 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/50'}
                                                    `}
                                                >
                                                    <CheckIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteReminder(event.id)}
                                                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-500 hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/50 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-500 animate-pulse">
                                <CalendarIcon className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-xs">Brak wydarzeń na ten dzień</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal for adding personal reminder */}
            {showAddForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl transform scale-100">
                        <div className="flex items-center justify-between mb-4">
                            <h6 className="text-base font-bold text-white uppercase tracking-wider">Nowe Przypomnienie</h6>
                            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white"><XIcon /></button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Dzień</label>
                                <input readOnly value={selectedDate} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 outline-none opacity-50" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Tytuł</label>
                                <input
                                    autoFocus
                                    placeholder="Np. Telefon do sądu"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Opis (opcjonalnie)</label>
                                <textarea
                                    placeholder="Dodaj szczegóły..."
                                    value={newDescription}
                                    onChange={e => setNewDescription(e.target.value)}
                                    className="w-full h-24 bg-slate-700/50 border border-slate-600/50 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!newTitle.trim()}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-cyan-600/20 disabled:opacity-50 transition-all font-bold"
                            >
                                Dodaj do kalendarza
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserCalendar;
