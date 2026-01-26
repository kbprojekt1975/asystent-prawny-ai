import React, { useRef } from 'react';
import { DocumentTextIcon, PinSlashIcon, CheckIcon, TrashIcon } from '../Icons';

interface ChatBubbleNoteProps {
    note: any;
    activeNoteId: string | null;
    setActiveNoteId: (id: string | null) => void;
    isAddingNote: boolean;
    setIsAddingNote: (val: boolean) => void;
    noteContent: string;
    setNoteContent: (val: string) => void;
    handleSaveNote: () => void;
    onDeleteNote?: (id: string) => void;
    handleDragStart: (e: React.MouseEvent | React.TouchEvent, id: string) => void;
    onUpdateNotePosition?: (id: string, pos: { x: number, y: number } | null) => void;
    chatBubbleRef: React.RefObject<HTMLDivElement>;
    isPinned?: boolean;
}

const ChatBubbleNote: React.FC<ChatBubbleNoteProps> = ({
    note,
    activeNoteId,
    setActiveNoteId,
    isAddingNote,
    setIsAddingNote,
    noteContent,
    setNoteContent,
    handleSaveNote,
    onDeleteNote,
    handleDragStart,
    onUpdateNotePosition,
    chatBubbleRef,
    isPinned = false
}) => {
    const isActive = activeNoteId === note.id;

    const getPositionStyle = () => {
        if (!isPinned || !note.position) return {};
        return { left: note.position.x, top: note.position.y };
    };

    const getTransformStyle = () => {
        if (!isPinned || !isActive || !chatBubbleRef.current || !note.position) return 'none';
        const noteRect = chatBubbleRef.current.getBoundingClientRect();
        const panelWidth = 256;
        const noteLeft = noteRect.left + note.position.x;
        const viewportWidth = window.innerWidth;

        if (noteLeft + panelWidth > viewportWidth - 16) {
            return `translateX(calc(-100% + 32px))`;
        }
        return 'none';
    };

    return (
        <div
            style={getPositionStyle()}
            className={`${isPinned ? 'absolute z-20' : ''}`}
        >
            <div
                onMouseDown={isPinned ? (e) => handleDragStart(e, note.id) : undefined}
                onTouchStart={isPinned ? (e) => handleDragStart(e, note.id) : undefined}
                className="relative"
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isActive) {
                            setActiveNoteId(null);
                            setIsAddingNote(false);
                        } else {
                            setActiveNoteId(note.id);
                            setIsAddingNote(false);
                        }
                    }}
                    className={`p-2 rounded-lg transition-all shadow-sm backdrop-blur-sm ${isPinned ? 'cursor-move' : ''} ${isActive
                            ? 'bg-amber-500/90 text-white border-amber-400'
                            : isPinned
                                ? 'bg-slate-800/80 text-amber-500 border border-amber-500/30 hover:bg-slate-800'
                                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500/70 hover:text-amber-500 border-amber-500/20'
                        }`}
                    title={isPinned ? "Przesuń lub edytuj notatkę" : "Pokaż notatkę"}
                >
                    <DocumentTextIcon className="w-4 h-4" />
                </button>

                {isPinned && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdateNotePosition?.(note.id, null);
                        }}
                        className="absolute -top-2 -right-2 bg-slate-700 hover:bg-red-500 text-slate-400 hover:text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-slate-600"
                        title="Odepnij notatkę"
                    >
                        <PinSlashIcon className="w-3 h-3" />
                    </button>
                )}

                {isActive && (
                    <div
                        className={`${isPinned ? 'absolute top-full mt-2' : 'mt-2'} w-64 bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-2xl z-50 animate-in zoom-in-95 duration-200 backdrop-blur-md`}
                        style={{ transform: getTransformStyle() }}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Edycja notatki</span>
                            <button onClick={() => setActiveNoteId(null)} className="text-slate-500 hover:text-white">
                                <CheckIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <textarea
                            className="w-full bg-transparent text-slate-200 text-xs focus:outline-none min-h-[80px] resize-none"
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end mt-2 gap-2">
                            <button
                                onClick={() => {
                                    if (confirm('Usunąć tę notatkę?')) {
                                        onDeleteNote?.(note.id);
                                        setActiveNoteId(null);
                                    }
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"
                            >
                                <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={handleSaveNote}
                                className="px-3 py-1 bg-violet-600 text-white text-[10px] font-bold rounded-lg hover:bg-violet-500"
                            >
                                {isPinned ? 'Zapisz' : 'Zaktualizuj'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatBubbleNote;
