import React, { useState, useRef, useEffect, MouseEvent, TouchEvent } from 'react';
import { ChatMessage } from '../types';

interface UseChatBubbleProps {
    message: ChatMessage;
    existingNotes?: any[];
    onAddNote?: (content: string, linkedMsg?: string, noteId?: string) => void;
    onUpdateNotePosition?: (noteId: string, position: { x: number, y: number } | null) => void;
}

export const useChatBubble = ({
    message,
    existingNotes,
    onAddNote,
    onUpdateNotePosition
}: UseChatBubbleProps) => {
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const chatBubbleRef = useRef<HTMLDivElement>(null);

    const handleCopy = async () => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(message.content);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = message.content;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                } catch (err) {
                    console.error('Fallback copy failed', err);
                }
                document.body.removeChild(textArea);
            }
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Copy failed", err);
        }
    };

    useEffect(() => {
        if (activeNoteId && existingNotes) {
            const note = existingNotes.find((n: any) => n.id === activeNoteId);
            if (note) setNoteContent(note.content);
        } else if (isAddingNote) {
            setNoteContent('');
        }
    }, [activeNoteId, isAddingNote, existingNotes]);

    const handleDragStart = (e: MouseEvent | TouchEvent, noteId: string) => {
        e.stopPropagation();
        if (activeNoteId === noteId) return;
        setDraggingNoteId(noteId);
    };

    useEffect(() => {
        if (!draggingNoteId) return;

        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!chatBubbleRef.current) return;

            const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
            const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

            const rect = chatBubbleRef.current.getBoundingClientRect();
            const x = clientX - rect.left - 16;
            const y = clientY - rect.top - 16;

            const constrainedX = Math.max(0, Math.min(x, rect.width - 32));
            const constrainedY = Math.max(0, Math.min(y, rect.height - 32));

            onUpdateNotePosition?.(draggingNoteId, { x: constrainedX, y: constrainedY });
        };

        const handleUp = () => {
            setDraggingNoteId(null);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleUp);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [draggingNoteId, onUpdateNotePosition]);

    const handleSaveNote = () => {
        if (noteContent.trim()) {
            onAddNote?.(noteContent, message.content.substring(0, 50), activeNoteId || undefined);
            setIsAddingNote(false);
            setActiveNoteId(null);
        }
    };

    const handleDownloadPDF = (topic?: string) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const title = topic || 'Porada Prawna';
            const cleanContent = message.content
                .replace(/--- PROJEKT PISMA ---[\s\S]*?--- PROJEKT PISMA ---/g, '')
                .replace(/--- PROJEKT TERMINU ---[\s\S]*?--- PROJEKT TERMINU ---/g, '')
                .replace(/--- PROJEKT ZADANIA ---[\s\S]*?--- PROJEKT ZADANIA ---/g, '')
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/__/g, '')
                .replace(/_/g, '')
                .trim();

            printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              @page { size: A4; margin: 0; }
              body { margin: 0; padding: 0; color: #000; }
              .document-wrapper { padding: 25mm 20mm 20mm 25mm; max-width: 210mm; margin: 0 auto; }
              .content { white-space: pre-wrap; font-size: 12pt; font-family: "Times New Roman", Times, serif; text-align: justify; line-height: 1.5; }
              .sig-space { margin-top: 50px; text-align: right; padding-right: 50px; font-family: "Times New Roman", Times, serif; font-size: 12pt; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="document-wrapper">
              <div class="content">${cleanContent}</div>
              <div class="sig-space"><br><br>_______________________<br>(podpis)</div>
            </div>
          </body>
        </html>
      `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    return {
        isAddingNote,
        setIsAddingNote,
        noteContent,
        setNoteContent,
        activeNoteId,
        setActiveNoteId,
        isCopied,
        chatBubbleRef,
        handleCopy,
        handleDragStart,
        handleSaveNote,
        handleDownloadPDF
    };
};
