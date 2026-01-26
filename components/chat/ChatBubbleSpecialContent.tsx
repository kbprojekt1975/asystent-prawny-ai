import React from 'react';
import { DocumentTextIcon, CalendarIcon, ListIcon } from '../Icons';

interface ChatBubbleSpecialContentProps {
    content: string;
    onPreviewDocument?: (content: string) => void;
    onAddDeadline?: (date: string, title: string, description: string) => void;
    onAddTask?: (text: string) => void;
}

const ChatBubbleSpecialContent: React.FC<ChatBubbleSpecialContentProps> = ({
    content,
    onPreviewDocument,
    onAddDeadline,
    onAddTask
}) => {
    const hasDocument = content.includes('--- PROJEKT PISMA ---');
    const hasDeadline = content.includes('--- PROJEKT TERMINU ---');
    const hasTask = content.includes('--- PROJEKT ZADANIA ---');

    const extractDocumentContent = () => {
        const parts = content.split('--- PROJEKT PISMA ---');
        return parts[1] ? parts[1].trim() : '';
    };

    const renderDeadlineButtons = () => {
        const parts = content.split('--- PROJEKT TERMINU ---');
        return parts.filter((_, i) => i % 2 !== 0).map((partContent, idx) => {
            const [date, title, description] = partContent.split('|').map(s => s.trim());
            return (
                <button
                    key={`deadline-${idx}`}
                    onClick={() => onAddDeadline?.(date, title, description)}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold rounded-lg border border-red-500/30 transition-all active:scale-95 text-left w-full"
                >
                    <CalendarIcon className="h-4 w-4 shrink-0" />
                    <span>Dodaj do Terminarza: {title} ({date})</span>
                </button>
            );
        });
    };

    const renderTaskButtons = () => {
        const parts = content.split('--- PROJEKT ZADANIA ---');
        return parts.filter((_, i) => i % 2 !== 0).map((partContent, idx) => {
            const text = partContent.trim();
            return (
                <button
                    key={`task-${idx}`}
                    onClick={() => onAddTask?.(text)}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 text-xs font-bold rounded-lg border border-amber-500/30 transition-all active:scale-95 text-left w-full"
                >
                    <ListIcon className="h-4 w-4 shrink-0" />
                    <span>Dodaj Zadanie: {text}</span>
                </button>
            );
        });
    };

    return (
        <>
            {hasDocument && onPreviewDocument && (
                <div className="mt-4 p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/30 flex flex-col gap-2">
                    <p className="text-xs font-semibold text-cyan-400 uppercase">Wykryto projekt dokumentu</p>
                    <button
                        onClick={() => onPreviewDocument(extractDocumentContent())}
                        className="flex items-center justify-center gap-2 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-lg transition-all"
                    >
                        <DocumentTextIcon className="w-4 h-4" />
                        Podgląd i Drukuj
                    </button>
                </div>
            )}

            {hasDeadline && renderDeadlineButtons()}
            {hasTask && renderTaskButtons()}
        </>
    );
};

export default ChatBubbleSpecialContent;
