import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeftIcon,
    GavelIcon,
    SendIcon
} from '../Icons';
import { InfoIcon } from '../InfoIcon';
import HelpModal from '../HelpModal';
import ChatBubble from '../ChatBubble';
import CourtRoleSelector from '../CourtRoleSelector';
import { ChatMessage, LawArea, CourtRole } from '../../types';

interface ProStepCourtProps {
    onBack: () => void;
    finishSimulation: () => void;
    messages: ChatMessage[];
    isLoading: boolean;
    isFullScreen: boolean;
    courtRole: CourtRole | null;
    setCourtRole: (role: CourtRole | null) => void;
    handleSelectCourtRole: (role: CourtRole) => Promise<void>;
    handleSendMessage: () => Promise<void>;
    currentInput: string;
    setCurrentInput: (val: string) => void;
    scrollRef: React.RefObject<HTMLDivElement>;
    onAddNote?: (content: string, linkedMsg?: string, noteId?: string, linkedRole?: 'user' | 'model' | 'system') => void;
    onDeleteNote?: (noteId: string) => void;
    onUpdateNotePosition?: (noteId: string, position: { x: number, y: number } | null) => void;
    onSelectInteractionMode?: (mode: any) => void;
    existingNotes?: any[];
    lawArea: LawArea;
    topic: string;
    isHelpOpen: boolean;
    setIsHelpOpen: (val: boolean) => void;
}

const ProStepCourt: React.FC<ProStepCourtProps> = ({
    onBack,
    finishSimulation,
    messages,
    isLoading,
    isFullScreen,
    courtRole,
    setCourtRole,
    handleSelectCourtRole,
    handleSendMessage,
    currentInput,
    setCurrentInput,
    scrollRef,
    onAddNote,
    onDeleteNote,
    onUpdateNotePosition,
    onSelectInteractionMode,
    existingNotes,
    lawArea,
    topic,
    isHelpOpen,
    setIsHelpOpen
}) => {
    const { t } = useTranslation();

    const trialStartIndex = messages.findLastIndex(m => m.role === 'system' && m.content.includes('[SYSTEM PRO: SYMULACJA SĄDOWA]'));
    const trialMessages = messages
        .slice(trialStartIndex !== -1 ? trialStartIndex : 0)
        .filter(m => m.role !== 'system' && !m.content.includes('[SYSTEM:'));

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden">
            {!isFullScreen && (
                <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50 backdrop-blur-md gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                            <span className="hidden md:inline">Pulpit sprawy</span>
                        </button>
                        <h2 className="font-bold text-cyan-400 flex items-center gap-1.5 text-xs md:text-base max-w-[60%] md:max-w-full overflow-hidden">
                            <GavelIcon className="w-5 h-5 flex-shrink-0" />
                            <span className="truncate">{courtRole ? `${courtRole}` : "Tryb Sądowy"}</span>
                            <InfoIcon onClick={() => setIsHelpOpen(true)} className="flex-shrink-0" />
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {courtRole && (
                            <button
                                onClick={() => setCourtRole(null)}
                                className="text-[10px] md:text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg border border-slate-700 font-medium"
                            >
                                Zmień rolę
                            </button>
                        )}
                        <button
                            onClick={finishSimulation}
                            className="text-[10px] md:text-xs bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 px-2 md:px-3 py-1 rounded-full font-bold hover:bg-cyan-600/30 transition-all flex-shrink-0"
                        >
                            Zakończ
                        </button>
                    </div>
                </div>
            )}

            {!courtRole ? (
                <div className="flex-1 overflow-y-auto">
                    <CourtRoleSelector onSelect={handleSelectCourtRole} />
                </div>
            ) : (
                <>
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 custom-scrollbar"
                    >
                        <div className="max-w-4xl mx-auto space-y-4">
                            {trialMessages.map((m, i) => (
                                <ChatBubble
                                    key={i}
                                    message={m}
                                    onAddNote={onAddNote ? (content, linkedMsg, noteId) => onAddNote(content, linkedMsg, noteId, m.role === 'model' ? 'model' : 'user') : undefined}
                                    existingNotes={existingNotes?.filter(n =>
                                        n.linkedMessage === m.content.substring(0, 50) &&
                                        (!n.linkedRole || n.linkedRole === (m.role === 'model' ? 'model' : 'user'))
                                    )}
                                    onDeleteNote={onDeleteNote}
                                    onUpdateNotePosition={onUpdateNotePosition}
                                    lawArea={lawArea}
                                    topic={topic}
                                />
                            ))}
                            {isLoading && <div className="text-slate-500 text-sm animate-pulse italic">Sąd analizuje odpowiedź...</div>}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-800/80 border-t border-slate-700">
                        <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 transition-all"
                                    placeholder="Wpisz swoją odpowiedź sędziemu lub adwokatowi..."
                                    value={currentInput}
                                    onChange={(e) => setCurrentInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isLoading || !currentInput.trim()}
                                    className="p-3 bg-cyan-600 rounded-xl hover:bg-cyan-500 transition-colors disabled:opacity-50"
                                >
                                    <SendIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title="Tryb Sądowy - Pomoc"
            >
                <div className="space-y-4 text-sm">
                    <p>Tryb Sądowy pozwala na symulację prawdziwej rozprawy. AI wciela się w wybraną rolę, aby pomóc Ci oswoić się z sytuacją na sali sądowej.</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Rola Sędziego:</strong> Formalne przesłuchanie. Skup się na faktach i odpowiadaj krótko.</li>
                        <li><strong>Rola Adwokata:</strong> Przygotowanie strategii i ćwiczenie pytań, które mogą paść.</li>
                        <li><strong>Wiedza:</strong> AI wykorzystuje Twoje dokumenty i raport strategiczny, by symulacja była jak najbardziej realistyczna.</li>
                    </ul>
                </div>
            </HelpModal>
        </div>
    );
};

export default ProStepCourt;
