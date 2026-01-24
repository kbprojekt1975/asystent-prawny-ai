import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, updateDoc, query } from 'firebase/firestore';
import { GlobalNote } from '../types';
import { PencilIcon, TrashIcon, CheckIcon, PlusIcon, XMarkIcon, ListIcon, HomeIcon, EyeIcon, SwatchIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';

interface GlobalAdminNotesProps {
    userEmail: string | null;
    isAdmin: boolean;
    currentViewId: string;
}

const NOTE_COLORS = [
    { name: 'yellow', bg: 'bg-amber-100', border: 'border-amber-400', header: 'bg-amber-400', text: 'text-amber-900', accent: 'bg-amber-200/50' },
    { name: 'blue', bg: 'bg-blue-100', border: 'border-blue-400', header: 'bg-blue-400', text: 'text-blue-900', accent: 'bg-blue-200/50' },
    { name: 'green', bg: 'bg-green-100', border: 'border-green-400', header: 'bg-green-400', text: 'text-green-900', accent: 'bg-green-200/50' },
    { name: 'rose', bg: 'bg-rose-100', border: 'border-rose-400', header: 'bg-rose-400', text: 'text-rose-900', accent: 'bg-rose-200/50' },
    { name: 'purple', bg: 'bg-purple-100', border: 'border-purple-400', header: 'bg-purple-400', text: 'text-purple-900', accent: 'bg-purple-200/50' },
];

const GlobalAdminNotes: React.FC<GlobalAdminNotesProps> = ({ userEmail, isAdmin, currentViewId }) => {
    const [allNotes, setAllNotes] = useState<GlobalNote[]>([]);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isListOpen, setIsListOpen] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const [isToolbarMinimized, setIsToolbarMinimized] = useState(() => {
        return localStorage.getItem('admin_notes_toolbar_minimized') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('admin_notes_toolbar_minimized', isToolbarMinimized.toString());
    }, [isToolbarMinimized]);

    useEffect(() => {
        if (!isAdmin) return;

        // Fetch ALL notes for the admin to ensure nothing is "lost"
        const q = query(collection(db, 'admin_notes'));
        const unsub = onSnapshot(q, (snapshot) => {
            const fetchedNotes = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as GlobalNote));
            setAllNotes(fetchedNotes);
        }, (error) => {
            console.error("Firestore onSnapshot error:", error);
        });

        return () => unsub();
    }, [isAdmin]);

    const activeNotes = allNotes.filter(n => n.viewId === currentViewId);
    const otherNotes = allNotes.filter(n => n.viewId !== currentViewId);

    const handleUpdatePosition = async (id: string, x: number, y: number) => {
        if (!isAdmin) return;
        try {
            await updateDoc(doc(db, 'admin_notes', id), {
                position: { x, y },
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating note position:', error);
        }
    };

    const handleUpdateColor = async (id: string, color: string) => {
        if (!isAdmin) return;
        try {
            await updateDoc(doc(db, 'admin_notes', id), {
                color,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating note color:', error);
        }
    };

    const handleUpdateMinimized = async (id: string, isMinimized: boolean) => {
        if (!isAdmin) return;
        try {
            await updateDoc(doc(db, 'admin_notes', id), {
                isMinimized,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating note minimization:', error);
        }
    };

    const handleSaveNote = async (id: string) => {
        if (!isAdmin || !editContent.trim()) return;
        try {
            await updateDoc(doc(db, 'admin_notes', id), {
                content: editContent.trim(),
                updatedAt: serverTimestamp()
            });
            setEditingNoteId(null);
        } catch (error) {
            console.error('Error saving note:', error);
        }
    };

    const handleDeleteNote = async (id: string) => {
        if (!isAdmin || !window.confirm('Usunąć tę notatkę globalną?')) return;
        try {
            await deleteDoc(doc(db, 'admin_notes', id));
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    const addNewNote = async () => {
        if (!isAdmin) return;
        try {
            const id = `gnote_${Date.now()}`;
            await setDoc(doc(db, 'admin_notes', id), {
                content: 'Nowa notatka...',
                position: { x: 100, y: 150 },
                viewId: currentViewId,
                authorEmail: userEmail,
                updatedAt: serverTimestamp(),
                color: 'yellow'
            });
            setEditingNoteId(id);
            setEditContent('Nowa notatka...');
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };

    const resetNotePosition = async (id: string) => {
        if (!isAdmin) return;
        try {
            await updateDoc(doc(db, 'admin_notes', id), {
                position: { x: 50, y: 150 },
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error resetting position:', error);
        }
    };

    const assignToCurrentScreen = async (id: string) => {
        if (!isAdmin || !window.confirm('Przypisać tę notatkę do OBECNEGO ekranu?')) return;
        try {
            await updateDoc(doc(db, 'admin_notes', id), {
                viewId: currentViewId,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error assigning note to screen:', error);
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            {/* Admin Toolbar (Add & List) */}
            <div className={`fixed bottom-6 right-6 pointer-events-auto flex items-center gap-2 ${isToolbarMinimized ? 'opacity-50 hover:opacity-100 transition-opacity' : ''}`}>
                {isToolbarMinimized ? (
                    <button
                        onClick={() => setIsToolbarMinimized(false)}
                        className="w-3 h-3 bg-orange-500 rounded-full shadow-lg hover:w-6 hover:h-6 transition-all border border-orange-400/50"
                        title="Rozwiń narzędzia admina"
                    />
                ) : (
                    <>
                        {isListOpen && (
                            <div className="bg-slate-800 border-2 border-slate-700 rounded-xl shadow-2xl p-4 mb-2 mr-2 w-80 animate-in fade-in slide-in-from-bottom-5 duration-200">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                        <ListIcon className="w-4 h-4 text-orange-400" />
                                        Zarządzaj Notatkami
                                    </h3>
                                    <button onClick={() => setIsListOpen(false)} className="text-slate-400 hover:text-white p-1">
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Debug Info Toggle */}
                                <div className="flex items-center justify-between mb-4 p-2 bg-slate-900/50 rounded border border-slate-700">
                                    <span className="text-[10px] text-slate-400">Tryb diagnostyczny</span>
                                    <button
                                        onClick={() => setShowDebug(!showDebug)}
                                        className={`p-1 rounded transition-colors ${showDebug ? 'text-orange-400' : 'text-slate-500'}`}
                                    >
                                        <EyeIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                {showDebug && (
                                    <div className="mb-4 p-2 bg-orange-900/20 border border-orange-500/30 rounded text-[10px] text-orange-200 break-all font-mono">
                                        Current View ID: <br /> {currentViewId}
                                    </div>
                                )}

                                <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                                    {/* Section: This Screen */}
                                    <div>
                                        <h4 className="text-[10px] text-orange-400 font-bold mb-2 uppercase">Na tym ekranie ({activeNotes.length})</h4>
                                        {activeNotes.length === 0 ? (
                                            <p className="text-slate-500 text-[10px] italic py-2">Brak notatek.</p>
                                        ) : (
                                            activeNotes.map(note => (
                                                <div key={note.id} className="p-2 bg-slate-900/80 rounded border border-slate-600 mb-1">
                                                    <p className="text-slate-200 text-xs line-clamp-2 mb-2">{note.content}</p>
                                                    <button
                                                        onClick={() => resetNotePosition(note.id)}
                                                        className="text-[9px] bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded w-full flex items-center justify-center gap-1"
                                                    >
                                                        <HomeIcon className="w-2.5 h-2.5" /> Przywołaj
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Section: Other Screens */}
                                    <div>
                                        <h4 className="text-[10px] text-slate-500 font-bold mb-2 uppercase">Inne ekrany ({otherNotes.length})</h4>
                                        {otherNotes.map(note => (
                                            <div key={note.id} className="p-2 bg-slate-900/40 rounded border border-slate-700/50 mb-1 group">
                                                <p className="text-slate-400 text-[11px] line-clamp-1 italic mb-1">{note.content}</p>
                                                <div className="flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[8px] text-slate-500 truncate max-w-[100px]">{note.viewId}</span>
                                                    <button
                                                        onClick={() => assignToCurrentScreen(note.id)}
                                                        className="text-[9px] text-orange-400/80 hover:text-orange-400 font-bold"
                                                    >
                                                        Przenieś tutaj
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setIsListOpen(!isListOpen)}
                            className={`p-3 rounded-full shadow-2xl transition-all active:scale-95 border-2 ${isListOpen ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-orange-400 hover:bg-slate-700'}`}
                            title="Zarządzaj notatkami"
                        >
                            <ListIcon className="w-6 h-6" />
                        </button>

                        <button
                            onClick={addNewNote}
                            className="p-4 bg-orange-600 hover:bg-orange-500 text-white rounded-full shadow-2xl transition-all active:scale-95 group flex items-center gap-2 border-2 border-orange-400/50"
                            title="Dodaj nową notatkę"
                        >
                            <PlusIcon className="w-6 h-6" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap text-sm font-bold">
                                Nowa Notatka
                            </span>
                        </button>

                        <button
                            onClick={() => setIsToolbarMinimized(true)}
                            className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors ml-1"
                            title="Minimalizuj narzędzia admina"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>

            {activeNotes.map(note => (
                <DraggableNote
                    key={note.id}
                    note={note}
                    onUpdatePosition={(x, y) => handleUpdatePosition(note.id, x, y)}
                    onUpdateColor={(color) => handleUpdateColor(note.id, color)}
                    onUpdateMinimized={(min) => handleUpdateMinimized(note.id, min)}
                    onDelete={() => handleDeleteNote(note.id)}
                    isEditing={editingNoteId === note.id}
                    onStartEdit={() => {
                        setEditingNoteId(note.id);
                        setEditContent(note.content);
                    }}
                    editContent={editContent}
                    onEditContentChange={setEditContent}
                    onSave={() => handleSaveNote(note.id)}
                    onCancelEdit={() => setEditingNoteId(null)}
                />
            ))}
        </div>
    );
};

interface DraggableNoteProps {
    note: GlobalNote;
    onUpdatePosition: (x: number, y: number) => void;
    onUpdateColor: (color: string) => void;
    onUpdateMinimized: (isMinimized: boolean) => void;
    onDelete: () => void;
    isEditing: boolean;
    onStartEdit: () => void;
    editContent: string;
    onEditContentChange: (val: string) => void;
    onSave: () => void;
    onCancelEdit: () => void;
}

const DraggableNote: React.FC<DraggableNoteProps> = ({
    note,
    onUpdatePosition,
    onUpdateColor,
    onDelete,
    isEditing,
    onStartEdit,
    editContent,
    onEditContentChange,
    onSave,
    onCancelEdit,
    onUpdateMinimized
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [pos, setPos] = useState(note.position);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const startPos = React.useRef({ x: 0, y: 0 });
    const dragged = React.useRef(false);

    const colorConfig = NOTE_COLORS.find(c => c.name === note.color) || NOTE_COLORS[0];

    useEffect(() => {
        if (!isDragging) {
            setPos(note.position);
        }
    }, [note.position, isDragging]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isEditing) return;
        // Prevent drag when clicking buttons/interactive elements
        if ((e.target as HTMLElement).closest('button')) return;

        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        startPos.current = {
            x: e.clientX - pos.x,
            y: e.clientY - pos.y
        };
        setIsDragging(true);
        dragged.current = false;
        setIsColorPickerOpen(false);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const newX = e.clientX - startPos.current.x;
        const newY = e.clientY - startPos.current.y;
        setPos({ x: newX, y: newY });
        dragged.current = true;
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        if (dragged.current) {
            onUpdatePosition(pos.x, pos.y);
        }
    };

    return (
        <div
            className="absolute pointer-events-auto"
            style={{
                left: pos.x,
                top: pos.y,
                touchAction: 'none',
                cursor: isDragging ? 'grabbing' : isEditing ? 'default' : 'grab',
                zIndex: isDragging || isEditing ? 10000 : 9999
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            <div className={`w-64 ${colorConfig.bg} border-2 ${isEditing ? 'border-orange-500 shadow-orange-500/20' : `${colorConfig.border} shadow-xl shadow-black/20`} rounded-lg overflow-hidden transition-all duration-200`}>
                <div className={`p-2 ${isEditing ? 'bg-orange-500' : colorConfig.header} flex justify-between items-center select-none`}>
                    <span className="text-[10px] font-bold text-black/60 uppercase">{note.isMinimized ? '...' : 'Notatka Admina'}</span>
                    <div className="flex gap-1">
                        {!isEditing ? (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdateMinimized(!note.isMinimized);
                                    }}
                                    className="p-1 hover:bg-black/10 rounded mr-1"
                                    title={note.isMinimized ? "Rozwiń" : "Minimalizuj"}
                                >
                                    {note.isMinimized ? <ChevronDownIcon className="w-3.5 h-3.5" /> : <ChevronUpIcon className="w-3.5 h-3.5" />}
                                </button>
                                {!note.isMinimized && (
                                    <>
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsColorPickerOpen(!isColorPickerOpen);
                                                }}
                                                className="p-1 hover:bg-black/10 rounded"
                                            >
                                                <SwatchIcon className="w-3.5 h-3.5" />
                                            </button>

                                            {isColorPickerOpen && (
                                                <div className="absolute top-full mt-1 right-0 bg-white shadow-xl rounded-lg p-1.5 flex gap-1 z-[10001] animate-in zoom-in-95 duration-100 border border-black/10">
                                                    {NOTE_COLORS.map(c => (
                                                        <button
                                                            key={c.name}
                                                            onClick={() => {
                                                                onUpdateColor(c.name);
                                                                setIsColorPickerOpen(false);
                                                            }}
                                                            className={`w-5 h-5 rounded-full ${c.header} border border-black/10 hover:scale-110 transition-transform ${note.color === c.name ? 'ring-2 ring-black/40 ring-offset-1' : ''}`}
                                                            title={c.name}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={onStartEdit} className="p-1 hover:bg-black/10 rounded"><PencilIcon className="w-3.5 h-3.5" /></button>
                                        <button onClick={onDelete} className="p-1 hover:bg-red-500/20 rounded text-red-700"><TrashIcon className="w-3.5 h-3.5" /></button>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <button onClick={onSave} className="p-1 hover:bg-black/10 rounded"><CheckIcon className="w-3.5 h-3.5" /></button>
                                <button onClick={onCancelEdit} className="p-1 hover:bg-black/10 rounded"><XMarkIcon className="w-3.5 h-3.5" /></button>
                            </>
                        )}
                    </div>
                </div>
                <div className={`${note.isMinimized ? 'p-1 px-3' : 'p-3'}`}>
                    {isEditing ? (
                        <textarea
                            autoFocus
                            className={`w-full bg-transparent ${colorConfig.text} text-sm focus:outline-none min-h-[100px] resize-none font-medium leading-relaxed`}
                            value={editContent}
                            onChange={(e) => onEditContentChange(e.target.value)}
                        />
                    ) : (
                        <p className={`${note.isMinimized ? 'text-[11px] truncate max-w-[180px]' : 'text-sm whitespace-pre-wrap'} ${colorConfig.text} font-medium leading-relaxed`}>
                            {note.content}
                        </p>
                    )}
                </div>
                {!note.isMinimized && (
                    <div className={`${colorConfig.accent} p-1 px-2 text-[8px] ${colorConfig.text} opacity-50 italic flex justify-between`}>
                        <span>{note.authorEmail}</span>
                        <span>{note.updatedAt?.toDate() ? new Date(note.updatedAt.toDate()).toLocaleString() : ''}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalAdminNotes;
