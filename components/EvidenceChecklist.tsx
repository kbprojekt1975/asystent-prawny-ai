import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { EvidenceSuggestion } from '../types';
import { CheckIcon, PlusIcon, UploadIcon, FileTextIcon } from './Icons';

interface EvidenceChecklistProps {
    evidence: EvidenceSuggestion[];
    onUpload: (itemLabel: string, file: File) => void;
    onStatusChange: (itemLabel: string, status: 'missing' | 'collected') => void;
}

const EvidenceChecklist: React.FC<EvidenceChecklistProps> = ({ evidence, onUpload, onStatusChange }) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeLabelRef = useRef<string | null>(null);

    const handleMamToClick = (label: string) => {
        activeLabelRef.current = label;
        fileInputRef.current?.click();
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && activeLabelRef.current) {
            onUpload(activeLabelRef.current, file);
            e.target.value = ''; // Reset
        }
    };

    return (
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <FileTextIcon className="w-6 h-6 text-amber-400" />
                {t('evidence.title')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evidence.map((item, index) => (
                    <div
                        key={index}
                        className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between
              ${item.status === 'collected' ? 'bg-green-500/10 border-green-500/50' : 'bg-slate-800/40 border-slate-700/50'}
            `}
                    >
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className={`font-semibold ${item.status === 'collected' ? 'text-green-400' : 'text-slate-200'}`}>
                                    {item.label}
                                </h4>
                                {item.status === 'collected' && (
                                    <CheckIcon className="w-5 h-5 text-green-500" />
                                )}
                            </div>
                            <p className="text-sm text-slate-400 mb-4 h-10 overflow-hidden line-clamp-2">
                                {item.description}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            {item.status === 'missing' ? (
                                <>
                                    <button
                                        onClick={() => handleMamToClick(item.label)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                                    >
                                        <UploadIcon className="w-4 h-4" />
                                        {t('evidence.upload')}
                                    </button>
                                    <button
                                        onClick={() => onStatusChange(item.label, 'missing')}
                                        className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold py-2 rounded-lg transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        {t('evidence.missing')}
                                    </button>
                                </>
                            ) : (
                                <div className="w-full flex items-center gap-2 text-green-400 text-xs font-bold py-2 italic">
                                    <CheckIcon className="w-4 h-4" />
                                    {t('evidence.collected')}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={onFileChange}
            />
        </div>
    );
};

export default EvidenceChecklist;
