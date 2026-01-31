import React, { useState, useEffect, useRef } from 'react';
import { CaseDocument } from '../types';
import { uploadCaseDocument, deleteCaseDocument, getCaseDocuments } from '../services/storageService';
import { PaperClipIcon, TrashIcon, ExternalLinkIcon, ClockIcon } from './Icons';

interface DocumentManagerProps {
    userId: string;
    caseId: string;
    onDocumentsChange?: (docs: CaseDocument[]) => void;
    isLocalOnly?: boolean;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ userId, caseId, onDocumentsChange, isLocalOnly = false }) => {
    const [documents, setDocuments] = useState<CaseDocument[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isLocalOnly) {
            loadDocuments();
        } else {
            setDocuments([]);
            onDocumentsChange?.([]);
        }
    }, [userId, caseId, isLocalOnly]);

    const loadDocuments = async () => {
        try {
            const docs = await getCaseDocuments(userId, caseId);
            setDocuments(docs);
            onDocumentsChange?.(docs);
        } catch (error) {
            console.error("Error loading documents:", error);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || isLocalOnly) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert("Maksymalny rozmiar pliku to 5MB.");
            return;
        }

        setIsUploading(true);
        try {
            const newDoc = await uploadCaseDocument(userId, caseId, file);
            const updatedDocs = [...documents, newDoc];
            setDocuments(updatedDocs);
            onDocumentsChange?.(updatedDocs);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Błąd podczas przesyłania pliku.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (doc: CaseDocument) => {
        if (isLocalOnly) return;
        if (!confirm(`Czy na pewno chcesz usunąć dokument "${doc.name}"?`)) return;

        try {
            await deleteCaseDocument(userId, caseId, doc.id, doc.path);
            const updatedDocs = documents.filter(d => d.id !== doc.id);
            setDocuments(updatedDocs);
            onDocumentsChange?.(updatedDocs);
        } catch (error) {
            console.error("Delete error:", error);
            alert("Błąd podczas usuwania dokumentu.");
        }
    };

    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <PaperClipIcon className="h-4 w-4 text-cyan-400" />
                    Dokumentacja Sprawy
                </h3>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-lg border border-cyan-500/30 transition-all disabled:opacity-50"
                >
                    {isUploading ? "Przesyłanie..." : "Dodaj Dokument"}
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                />
            </div>

            {documents.length === 0 ? (
                <div className="text-center py-4 bg-slate-900/30 rounded-lg border border-dashed border-slate-700">
                    <p className="text-xs text-slate-500 italic">Brak dokumentów w tej sprawie</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-700/50 group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-slate-800 rounded-lg">
                                    <PaperClipIcon className="h-4 w-4 text-slate-400" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs font-medium text-slate-300 truncate">{doc.name}</p>
                                    <p className="text-[10px] text-slate-500">{(doc.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 rounded-md transition-all"
                                    title="Otwórz"
                                >
                                    <ExternalLinkIcon className="h-4 w-4" />
                                </a>
                                <button
                                    onClick={() => handleDelete(doc)}
                                    className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-md transition-all"
                                    title="Usuń"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DocumentManager;
