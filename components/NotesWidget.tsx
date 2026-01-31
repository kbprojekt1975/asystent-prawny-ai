import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { CaseNote } from '../types';
import { TrashIcon, PlusIcon, DocumentDuplicateIcon, CheckIcon } from './Icons';

interface NotesWidgetProps {
    userId: string;
    chatId: string;
    isLocalOnly?: boolean;
}

const NotesWidget: React.FC<NotesWidgetProps> = ({ userId, chatId, isLocalOnly = false }) => {
    const { t, i18n } = useTranslation();
    const [notes, setNotes] = useState<CaseNote[]>([]);
    const [newNote, setNewNote] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [copyId, setCopyId] = useState<string | null>(null);

    useEffect(() => {
        if (!userId || !chatId || isLocalOnly) {
            setNotes([]);
            setIsLoading(false);
            return;
        }

        const q = query(
            collection(db, 'users', userId, 'chats', chatId, 'notes'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedNotes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as CaseNote));
            setNotes(fetchedNotes);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching notes:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId, chatId, isLocalOnly]);

    const handleAddNote = async () => {
        if (!newNote.trim() || !userId || !chatId || isLocalOnly) return;

        try {
            const noteId = `note_${Date.now()}`;
            await setDoc(doc(db, 'users', userId, 'chats', chatId, 'notes', noteId), {
                content: newNote.trim(),
                createdAt: serverTimestamp()
            });
            setNewNote('');
            setIsAdding(false);
        } catch (error) {
            console.error("Error adding note:", error);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (isLocalOnly) return;
        try {
            await deleteDoc(doc(db, 'users', userId, 'chats', chatId, 'notes', noteId));
        } catch (error) {
            console.error("Error deleting note:", error);
        }
    };

    const handleCopy = (content: string, id: string) => {
        navigator.clipboard.writeText(content);
        setCopyId(id);
        setTimeout(() => setCopyId(null), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/30">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <DocumentDuplicateIcon className="w-5 h-5 text-violet-400" />
                    {t('notes.title')}
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={`p-2 rounded-xl transition-all ${isAdding ? 'bg-red-500/20 text-red-400 rotate-45' : 'bg-violet-600/20 text-violet-400 hover:bg-violet-600/30'}`}
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {isAdding && (
                    <div className="bg-slate-800/80 border border-violet-500/30 rounded-2xl p-4 animate-in slide-in-from-top-2">
                        <textarea
                            className="w-full bg-transparent text-slate-200 text-sm focus:outline-none min-h-[100px] resize-none"
                            placeholder={t('notes.placeholder')}
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                {t('notes.cancel')}
                            </button>
                            <button
                                onClick={handleAddNote}
                                disabled={!newNote.trim()}
                                className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-500 disabled:opacity-50 transition-all shadow-lg shadow-violet-900/20"
                            >
                                {t('notes.save')}
                            </button>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
                    </div>
                ) : notes.length > 0 ? (
                    notes.map((note) => (
                        <div key={note.id} className="group bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 hover:border-violet-500/30 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] text-slate-500 font-mono">
                                    {note.createdAt instanceof Timestamp ? note.createdAt.toDate().toLocaleString(i18n.language) : t('notes.saving')}
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleCopy(note.content, note.id)}
                                        className="p-1.5 text-slate-500 hover:text-cyan-400 transition-colors"
                                        title={t('notes.copy')}
                                    >
                                        {copyId === note.id ? <CheckIcon className="w-4 h-4" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteNote(note.id)}
                                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                                        title={t('notes.delete')}
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                        </div>
                    ))
                ) : !isAdding && (
                    <div className="text-center py-20 opacity-40">
                        <DocumentDuplicateIcon className="w-12 h-12 mx-auto mb-4 text-slate-700" />
                        <p className="text-sm italic">{t('notes.empty_title')}</p>
                        <p className="text-xs mt-2">{t('notes.empty_desc')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotesWidget;
