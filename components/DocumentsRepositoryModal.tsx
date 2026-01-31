
import React, { useState, useEffect } from 'react';
import { collectionGroup, query, where, orderBy, onSnapshot, getFirestore, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import { CaseDocument } from '../types';
import { XIcon, PaperClipIcon, ExternalLinkIcon, SearchIcon, DocumentTextIcon } from './Icons';

interface DocumentsRepositoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    chatId?: string | null;
    isLocalOnly?: boolean;
}

const DocumentsRepositoryModal: React.FC<DocumentsRepositoryModalProps> = ({ isOpen, onClose, userId, chatId, isLocalOnly = false }) => {
    const [documents, setDocuments] = useState<CaseDocument[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !userId || isLocalOnly) {
            setDocuments([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        let q;

        if (chatId) {
            // Query documents for a specific chat
            q = query(
                collection(db, 'users', userId, 'chats', chatId, 'documents'),
                orderBy('uploadedAt', 'desc')
            );
        } else {
            // Query all documents for this user across all chats (Global)
            q = query(
                collectionGroup(db, 'documents'),
                where('userId', '==', userId),
                orderBy('uploadedAt', 'desc')
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as CaseDocument));
            setDocuments(docs);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching documents:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen, userId, chatId, isLocalOnly]);

    const filteredDocs = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-[70vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <DocumentTextIcon className="h-6 w-6 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Moje Dokumenty</h2>
                            <p className="text-xs text-slate-400">Wszystkie wygenerowane i przesłane pliki</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
                    {/* Search Bar */}
                    <div className="p-4 border-b border-slate-700 bg-slate-800/20">
                        <div className="relative max-w-md">
                            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Szukaj dokumentu..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Content List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        {isLoading ? (
                            <div className="text-center py-10 text-slate-500">Ładowanie dokumentów...</div>
                        ) : filteredDocs.length === 0 ? (
                            <div className="text-center py-20 flex flex-col items-center">
                                <PaperClipIcon className="h-12 w-12 text-slate-700 mb-3" />
                                <p className="text-slate-500">Brak dokumentów.</p>
                                <p className="text-xs text-slate-600 mt-1">Tutaj pojawią się wszystkie pliki, które prześlesz lub wygenerujesz w rozmowach.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredDocs.map(doc => (
                                    <div key={doc.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800 transition-colors group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-slate-900 rounded-lg border border-slate-700 text-cyan-500/80">
                                                <DocumentTextIcon className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-sm font-medium text-slate-200 truncate">{doc.name}</span>
                                                <span className="text-xs text-slate-500">{(doc.size / 1024).toFixed(0)} KB • {doc.uploadedAt?.toDate().toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-slate-700/50 hover:bg-cyan-600 text-slate-300 hover:text-white rounded-lg transition-all shadow-sm"
                                            title="Pobierz / Otwórz"
                                        >
                                            <ExternalLinkIcon className="h-4 w-4" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentsRepositoryModal;
