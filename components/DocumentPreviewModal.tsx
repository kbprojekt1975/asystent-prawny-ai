import React, { useRef } from 'react';
import { XIcon, PrinterIcon, DownloadIcon } from './Icons';

interface DocumentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    title: string;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ isOpen, onClose, content, title }) => {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContent = printRef.current?.innerHTML;
        const printWindow = window.open('', '_blank');
        if (printWindow && printContent) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${title}</title>
                        <style>
                            body { font-family: "Times New Roman", Times, serif; padding: 40px; line-height: 1.5; color: black; }
                            .document-content { white-space: pre-wrap; }
                            @media print {
                                body { padding: 0; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="document-content">${content}</div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
                <header className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-lg">
                            <PrinterIcon className="w-5 h-5 text-cyan-400" />
                        </div>
                        <h3 className="font-bold text-white text-lg">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-all"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-8 md:p-12 bg-white text-slate-900">
                    <div ref={printRef} className="max-w-[210mm] mx-auto whitespace-pre-wrap font-serif text-[12pt] leading-relaxed">
                        {content}
                    </div>
                </main>

                <footer className="p-4 border-t border-slate-700 flex justify-end gap-3 bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium"
                    >
                        Anuluj
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-500 transition-all font-bold shadow-lg shadow-cyan-600/20"
                    >
                        <PrinterIcon className="w-4 h-4" />
                        Drukuj / PDF
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default DocumentPreviewModal;
