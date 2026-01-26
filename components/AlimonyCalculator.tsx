import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon, CalculatorIcon, BotIcon } from './Icons';
import { LawArea } from '../types';
import { useAlimonyCalculator } from '../hooks/useAlimonyCalculator';

// Sub-components
import AlimonyCostsSection from './alimony/AlimonyCostsSection';
import AlimonyFinanceSection from './alimony/AlimonyFinanceSection';
import AlimonyCareSection from './alimony/AlimonyCareSection';
import AlimonyResult from './alimony/AlimonyResult';
import AlimonyChat from './alimony/AlimonyChat';

interface AlimonyCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
    lawArea: LawArea | null;
}

const AlimonyCalculator: React.FC<AlimonyCalculatorProps> = ({ isOpen, onClose, lawArea }) => {
    const { t } = useTranslation();
    const logic = useAlimonyCalculator();

    const {
        activeTab, setActiveTab,
        costs,
        parentMe,
        parentOther,
        daysWithOther, setDaysWithOther,
        isSharedCustody, setIsSharedCustody,
        otherDependents, setOtherDependents,
        result, calculate,
        showChat, setShowChat,
        chatInput, setChatInput,
        chatHistory, isTyping,
        resetChat, handleSendChat,
        handleCostChange, handleParentChange
    } = logic;

    // Safety check
    useEffect(() => {
        if (lawArea !== LawArea.Family && isOpen) {
            onClose();
        }
    }, [lawArea, isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className={`bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full flex flex-col h-[90vh] overflow-hidden animate-slide-up transition-all duration-500 ${showChat ? 'max-w-6xl' : 'max-w-2xl'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700 bg-slate-800/50">
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex-shrink-0 flex items-center justify-center text-pink-400">
                            <CalculatorIcon className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg md:text-xl font-bold text-white truncate">{t('alimonyCalculator.title')}</h2>
                            <p className="text-[10px] md:text-xs text-pink-400 font-medium tracking-wide uppercase truncate">{t('alimonyCalculator.subtitle')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 ml-2">
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className={`flex items-center gap-2 px-3 py-2 md:px-4 rounded-lg transition-all ${showChat ? 'bg-violet-600 text-white' : 'bg-slate-800 text-violet-400 hover:bg-slate-700'}`}
                            title={showChat ? t('alimonyCalculator.hideAssistant') : t('alimonyCalculator.askAssistant')}
                        >
                            <BotIcon className="w-5 h-5 flex-shrink-0" />
                            <span className="hidden sm:inline">{showChat ? t('alimonyCalculator.hideAssistant').split(' ')[0] : t('alimonyCalculator.askAssistant').split(' ')[0]}<span className="hidden md:inline"> {t('alimonyCalculator.assistant')}</span></span>
                        </button>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
                    {/* Main Calculator Content */}
                    <div className={`flex flex-col overflow-hidden transition-all duration-300 ${showChat ? 'flex-[0.4] md:flex-1 border-b md:border-b-0 md:border-r border-slate-700' : 'flex-1'}`}>
                        {/* Tabs */}
                        <div className="flex border-b border-slate-700 bg-slate-800/30">
                            <button
                                onClick={() => setActiveTab('costs')}
                                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'costs' ? 'border-pink-500 text-pink-400 bg-pink-500/5' : 'border-transparent text-slate-400 hover:text-white'}`}
                            >
                                {t('alimonyCalculator.tabs.costs')}
                            </button>
                            <button
                                onClick={() => setActiveTab('finance')}
                                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'finance' ? 'border-pink-500 text-pink-400 bg-pink-500/5' : 'border-transparent text-slate-400 hover:text-white'}`}
                            >
                                {t('alimonyCalculator.tabs.finance')}
                            </button>
                            <button
                                onClick={() => setActiveTab('care')}
                                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'care' ? 'border-pink-500 text-pink-400 bg-pink-500/5' : 'border-transparent text-slate-400 hover:text-white'}`}
                            >
                                {t('alimonyCalculator.tabs.care')}
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            {activeTab === 'costs' && (
                                <AlimonyCostsSection
                                    costs={costs}
                                    handleCostChange={handleCostChange}
                                    onNext={() => setActiveTab('finance')}
                                />
                            )}

                            {activeTab === 'finance' && (
                                <AlimonyFinanceSection
                                    parentMe={parentMe}
                                    parentOther={parentOther}
                                    handleParentChange={handleParentChange}
                                    onBack={() => setActiveTab('costs')}
                                    onNext={() => setActiveTab('care')}
                                />
                            )}

                            {activeTab === 'care' && (
                                <AlimonyCareSection
                                    isSharedCustody={isSharedCustody}
                                    setIsSharedCustody={setIsSharedCustody}
                                    daysWithOther={daysWithOther}
                                    setDaysWithOther={setDaysWithOther}
                                    otherDependents={otherDependents}
                                    setOtherDependents={setOtherDependents}
                                    calculate={calculate}
                                />
                            )}

                            <AlimonyResult result={result} />
                        </div>
                    </div>

                    {/* Chat Panel */}
                    {showChat && (
                        <AlimonyChat
                            chatHistory={chatHistory}
                            isTyping={isTyping}
                            chatInput={chatInput}
                            setChatInput={setChatInput}
                            handleSendChat={handleSendChat}
                            resetChat={resetChat}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlimonyCalculator;
