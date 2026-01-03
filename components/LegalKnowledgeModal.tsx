import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { LegalAct } from '../types';
import { XIcon, BookOpenIcon, TrashIcon, ExternalLinkIcon, SearchIcon } from './Icons';

interface LegalKnowledgeModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    chatId?: string | null;
}

const LegalKnowledgeModal: React.FC<LegalKnowledgeModalProps> = ({ isOpen, onClose, userId, chatId }) => {
    const [acts, setActs] = useState<LegalAct[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAct, setSelectedAct] = useState<LegalAct | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'topic' | 'global'>('topic');

    useEffect(() => {
        if (!isOpen || !userId) return;

        setIsLoading(true); // Reset loading state when parameters change

        // If no chatId is provided, we can only show global
        const activeMode = (!chatId) ? 'global' : viewMode;

        let q;
        if (activeMode === 'topic' && chatId) {
            q = query(
                collection(db, 'users', userId, 'chats', chatId, 'legal_knowledge'),
                orderBy('savedAt', 'desc')
            );
        } else {
            q = query(
                collection(db, 'users', userId, 'legal_knowledge'),
                orderBy('savedAt', 'desc')
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedActs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as LegalAct));
            setActs(fetchedActs);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching legal knowledge:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen, userId, chatId, viewMode]);

    const handleDelete = async (e: React.MouseEvent, actId: string) => {
        e.stopPropagation();
        if (!confirm('Czy na pewno chcesz usunąć ten akt prawny?')) return;
        try {
            const activeMode = (!chatId) ? 'global' : viewMode;
            if (activeMode === 'topic' && chatId) {
                await deleteDoc(doc(db, 'users', userId, 'chats', chatId, 'legal_knowledge', actId));
            } else {
                await deleteDoc(doc(db, 'users', userId, 'legal_knowledge', actId));
            }
            if (selectedAct?.id === actId) setSelectedAct(null);
        } catch (error) {
            console.error("Error deleting act:", error);
        }
    };

    const filteredActs = acts.filter(act =>
        act.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${act.publisher} ${act.year} ${act.pos}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <BookOpenIcon className="h-6 w-6 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Baza Wiedzy Prawnej</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                {chatId ? (
                                    <div className="flex bg-slate-900/50 p-0.5 rounded-lg border border-slate-700">
                                        <button
                                            onClick={() => setViewMode('topic')}
                                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${viewMode === 'topic' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            TEN TEMAT
                                        </button>
                                        <button
                                            onClick={() => setViewMode('global')}
                                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${viewMode === 'global' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            WSZYSTKIE
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400">Twoje zapisane akty prawne i przepisy</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* List Sidebar */}
                    <div className="w-1/3 border-r border-slate-700 flex flex-col bg-slate-900/50">
                        <div className="p-4 border-b border-slate-700">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Szukaj w bazie..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {isLoading ? (
                                <div className="p-8 text-center text-slate-500">Ładowanie...</div>
                            ) : filteredActs.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 italic">Brak zapisanych aktów</div>
                            ) : (
                                filteredActs.map(act => (
                                    <div
                                        key={act.id}
                                        onClick={() => setSelectedAct(act)}
                                        className={`p-4 border-b border-slate-800 cursor-pointer transition-colors ${selectedAct?.id === act.id ? 'bg-cyan-500/10 border-l-2 border-l-cyan-500' : 'hover:bg-white/5'}`}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider">{act.publisher} {act.year} poz. {act.pos}</span>
                                                <p className="text-sm font-medium text-slate-200 line-clamp-2 mt-1">{act.title || 'Akt Prawny'}</p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(e, act.id)}
                                                className="p-1 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-colors"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-slate-900 flex flex-col overflow-hidden">
                        {selectedAct ? (
                            <>
                                <div className="p-6 border-b border-slate-800 bg-slate-800/20">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-bold text-white max-w-2xl">{selectedAct.title || 'Akt Prawny'}</h3>
                                        <a
                                            href={`https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=W${selectedAct.publisher}${selectedAct.year}${selectedAct.pos.toString().padStart(4, '0')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-xs bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded-lg transition-all font-semibold"
                                        >
                                            <ExternalLinkIcon className="h-4 w-4" />
                                            Otwórz w ISAP
                                        </a>
                                    </div>
                                    <div className="flex gap-4 text-xs text-slate-400">
                                        <span className="bg-slate-700/50 px-2 py-1 rounded">Publikator: {selectedAct.publisher}</span>
                                        <span className="bg-slate-700/50 px-2 py-1 rounded">Rok: {selectedAct.year}</span>
                                        <span className="bg-slate-700/50 px-2 py-1 rounded">Pozycja: {selectedAct.pos}</span>
                                    </div>
                                </div>
                                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-950/50">
                                    {selectedAct.content ? (
                                        <div className="space-y-6">
                                            {/* Text parsing to highlight articles */}
                                            {selectedAct.content.split(/(?=Art\.\s*\d+[a-z]*\.)/g).map((chunk, i) => {
                                                const trimmed = chunk.trim();
                                                if (!trimmed) return null;

                                                const isArticle = trimmed.startsWith('Art.');
                                                // Extract article number if it is an article chunk
                                                // Regex: Art. 123. or Art. 123a.
                                                let articleNo = '';
                                                let isCited = false;

                                                if (isArticle) {
                                                    const match = trimmed.match(/Art\.\s*(\d+[a-z]*)\./);
                                                    if (match && match[1]) {
                                                        articleNo = match[1];
                                                        // Check if this article is in the cited list
                                                        if (selectedAct.cited_articles?.includes(articleNo)) {
                                                            isCited = true;
                                                        }
                                                    }
                                                }

                                                return (
                                                    <div
                                                        key={i}
                                                        className={`text-slate-300 font-serif leading-relaxed transition-all duration-300 
                                                                ${isArticle
                                                                ? isCited
                                                                    ? 'bg-cyan-900/30 p-6 rounded-xl border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] relative'
                                                                    : 'bg-slate-800/40 p-4 rounded-xl border border-white/5 shadow-sm'
                                                                : ''}`
                                                        }
                                                    >
                                                        {isCited && (
                                                            <div className="absolute -top-3 -right-2 bg-cyan-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow-lg">
                                                                Wspomniane w poradzie
                                                            </div>
                                                        )}

                                                        {isArticle ? (
                                                            <>
                                                                <span className={`font-bold block mb-2 ${isCited ? 'text-cyan-300 text-lg' : 'text-cyan-400'}`}>
                                                                    {trimmed.split('.')[0] + '.' + trimmed.split('.')[1] + '.'}
                                                                </span>
                                                                <span>{trimmed.substring(trimmed.indexOf('.', trimmed.indexOf('.') + 1) + 1).trim()}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-slate-400 italic">{trimmed}</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20">
                                            <p className="text-slate-500 mb-4">Treść aktu nie została pobrana lub jest niedostępna.</p>
                                            <a
                                                href={`https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=W${selectedAct.publisher}${selectedAct.year}${selectedAct.pos.toString().padStart(4, '0')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-cyan-500 hover:text-cyan-400 underline"
                                            >
                                                Zobacz w ISAP
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
                                <BookOpenIcon className="h-16 w-16 text-slate-700" />
                                <p>Wybierz akt prawny z listy, aby wyświetlić jego treść</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LegalKnowledgeModal;
