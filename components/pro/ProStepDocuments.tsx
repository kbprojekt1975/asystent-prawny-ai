import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeftIcon,
    ChevronRightIcon,
    UserIcon,
    UserGroupIcon,
    ExternalLinkIcon,
    TrashIcon,
    DocumentTextIcon,
    MagicWandIcon
} from '../Icons';
import { InfoIcon } from '../InfoIcon';
import HelpModal from '../HelpModal';
import { CaseDocument, ChatMessage } from '../../types';

interface ProStepDocumentsProps {
    onBack: () => void;
    messages: ChatMessage[];
    isLoading: boolean;
    documents: CaseDocument[];
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>, party: 'mine' | 'opposing') => Promise<void>;
    handleDeleteDoc: (docObj: CaseDocument) => Promise<void>;
    handleNoDocs: () => Promise<void>;
    handleAnalyzeDocs: () => Promise<void>;
    isHelpOpen: boolean;
    setIsHelpOpen: (val: boolean) => void;
}

const ProStepDocuments: React.FC<ProStepDocumentsProps> = ({
    onBack,
    messages,
    isLoading,
    documents,
    handleFileUpload,
    handleDeleteDoc,
    handleNoDocs,
    handleAnalyzeDocs,
    isHelpOpen,
    setIsHelpOpen
}) => {
    const { t } = useTranslation();
    const mineInputRef = useRef<HTMLInputElement>(null);
    const opposingInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white p-6 overflow-y-auto">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors self-start"
            >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>{t('pro.dashboard.back_to_dashboard')}</span>
            </button>
            <div className="max-w-4xl mx-auto w-full pb-10">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold">{t('pro.dashboard.load_docs_title')}</h1>
                    <InfoIcon onClick={() => setIsHelpOpen(true)} />
                </div>
                <p className="text-slate-400 mb-8">{t('pro.dashboard.load_docs_desc')}</p>

                {messages.filter(m => m.role !== 'system').length > 0 && (
                    <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-px flex-1 bg-slate-800"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{t('pro.dashboard.preliminary_interview_label')}</span>
                            <div className="h-px flex-1 bg-slate-800"></div>
                        </div>
                        <div className="flex justify-center">
                            <button
                                onClick={handleNoDocs}
                                disabled={isLoading}
                                className="bg-violet-600/20 text-violet-400 border border-violet-500/30 px-8 py-4 rounded-2xl font-bold hover:bg-violet-600/30 transition-all flex items-center gap-3 group shadow-xl shadow-violet-900/10 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-violet-400/20 border-t-violet-400 rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>{t('pro.dashboard.continue_interview')}</span>
                                        <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div
                        className="bg-slate-800/40 border-2 border-dashed border-violet-500/30 rounded-3xl p-8 text-center hover:border-violet-500/60 transition-all group"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files[0];
                            if (file) handleFileUpload({ target: { files: [file] } } as any, 'mine');
                        }}
                    >
                        <UserIcon className="w-12 h-12 text-violet-400/50 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="font-bold mb-1">{t('pro.dashboard.my_docs')}</h3>
                        <p className="text-slate-500 text-xs mb-4">{t('pro.dashboard.my_docs_desc')}</p>
                        <input
                            type="file"
                            ref={mineInputRef}
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'mine')}
                        />
                        <button
                            onClick={() => mineInputRef.current?.click()}
                            className="bg-violet-600/20 text-violet-400 border border-violet-500/30 px-4 py-2 rounded-xl text-xs font-bold hover:bg-violet-600/30 transition-all"
                        >
                            {t('pro.dashboard.select_files')}
                        </button>
                    </div>

                    <div
                        className="bg-slate-800/40 border-2 border-dashed border-slate-700 rounded-3xl p-8 text-center hover:border-slate-500/60 transition-all group"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files[0];
                            if (file) handleFileUpload({ target: { files: [file] } } as any, 'opposing');
                        }}
                    >
                        <UserGroupIcon className="w-12 h-12 text-slate-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="font-bold mb-1">{t('pro.dashboard.opposing_docs')}</h3>
                        <p className="text-slate-500 text-xs mb-4">{t('pro.dashboard.opposing_docs_desc')}</p>
                        <input
                            type="file"
                            ref={opposingInputRef}
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'opposing')}
                        />
                        <button
                            onClick={() => opposingInputRef.current?.click()}
                            className="bg-slate-700/50 text-slate-400 border border-slate-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-300 hover:text-slate-900 transition-all"
                        >
                            {t('pro.dashboard.select_files')}
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-300">{t('pro.dashboard.loaded_files')} ({documents.length})</h3>
                    </div>
                    <div className="flex flex-col gap-2">
                        {documents.length > 0 ? (
                            documents.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700/30 rounded-xl group hover:border-violet-500/30 transition-all">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`p-1.5 rounded-lg ${doc.party === 'opposing' ? 'bg-slate-700 text-slate-400' : 'bg-violet-600/20 text-violet-400'}`}>
                                            {doc.party === 'opposing' ? <UserGroupIcon className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium truncate">{doc.name}</span>
                                            <span className={`text-[10px] font-bold uppercase ${doc.party === 'opposing' ? 'text-slate-500' : 'text-violet-400'}`}>
                                                {doc.party === 'opposing' ? t('pro.dashboard.opposing_party') : t('pro.dashboard.my_party')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <a href={doc.url} target="_blank" className="p-2 text-slate-500 hover:text-white transition-colors" title={t('pro.dashboard.preview')}>
                                            <ExternalLinkIcon className="w-4 h-4" />
                                        </a>
                                        <button
                                            onClick={() => handleDeleteDoc(doc)}
                                            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                            title={t('pro.dashboard.delete')}
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <DocumentTextIcon className="w-12 h-12 text-slate-700 mx-auto mb-2" />
                                <p className="text-slate-500 text-sm italic">{t('pro.dashboard.no_docs')}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center gap-4">
                    <button
                        disabled={documents.length === 0 || isLoading}
                        className={`flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 px-10 py-5 rounded-2xl font-bold shadow-lg transition-all ${(documents.length === 0 || isLoading) ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-105 hover:shadow-violet-900/40'
                            }`}
                        onClick={handleAnalyzeDocs}
                    >
                        {isLoading ? <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> : <MagicWandIcon className="w-6 h-6" />}
                        <span>{t('pro.dashboard.analyze_button')}</span>
                    </button>

                    <button
                        onClick={handleNoDocs}
                        disabled={isLoading}
                        className="text-slate-500 text-sm hover:text-white hover:underline transition-colors mt-2"
                    >
                        {isLoading ? t('pro.dashboard.initiating') : t('pro.dashboard.no_docs_link')}
                    </button>
                </div>
            </div>

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title={t('pro.dashboard.help_title')}
            >
                <div className="space-y-4 text-sm">
                    <p>{t('pro.dashboard.help_desc')}</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>{t('pro.dashboard.help_my_docs')}</li>
                        <li>{t('pro.dashboard.help_opposing_docs')}</li>
                    </ul>
                    <p className="italic text-slate-500 mt-2">{t('pro.dashboard.help_footer')}</p>
                </div>
            </HelpModal>
        </div>
    );
};

export default ProStepDocuments;
