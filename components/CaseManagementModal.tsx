import React from 'react';
import { XIcon } from './Icons';
import CaseDashboard from './CaseDashboard';

interface CaseManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    caseId: string;
}

const CaseManagementModal: React.FC<CaseManagementModalProps> = ({ isOpen, onClose, userId, caseId }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <h2 className="text-xl font-bold text-white">Zarządzanie Sprawą</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-900">
                    <CaseDashboard userId={userId} caseId={caseId} initialExpanded={true} />
                </div>
            </div>
        </div>
    );
};

export default CaseManagementModal;
