import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExclamationIcon, TrashIcon, CaseIcon } from '../Icons';

interface DangerZoneProps {
    isDeleting: boolean;
    isMasterAdmin: boolean;
    handleDeletePersonalData: () => void;
    handleDeleteAccount: () => void;
    handleResetDatabase: () => void;
}

const DangerZone: React.FC<DangerZoneProps> = ({
    isDeleting,
    isMasterAdmin,
    handleDeletePersonalData,
    handleDeleteAccount,
    handleResetDatabase
}) => {
    const { t } = useTranslation();

    return (
        <div className="mt-10 pt-6 border-t border-slate-700/50">
            <div className="flex items-center gap-2 mb-4">
                <ExclamationIcon className="w-5 h-5 text-red-500" />
                <h5 className="text-sm font-bold text-red-500 uppercase tracking-wider">{t('userProfile.personal.dangerZone')}</h5>
            </div>

            <div className="space-y-3">
                <div className="flex flex-col gap-1">
                    <button
                        onClick={handleDeletePersonalData}
                        disabled={isDeleting}
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg p-3 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <TrashIcon className="w-4 h-4" />
                        {t('userProfile.personal.wipeData')}
                    </button>
                    <p className="text-[10px] text-slate-500 px-1 text-center">{t('userProfile.personal.wipeDataNote')}</p>
                </div>

                <div className="flex flex-col gap-1">
                    <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg p-3 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 disabled:opacity-50"
                    >
                        <TrashIcon className="w-4 h-4" />
                        {t('userProfile.personal.deleteAccount')}
                    </button>
                    <p className="text-[10px] text-slate-500 px-1">{t('userProfile.personal.deleteAccountNote')}</p>
                </div>

                {isMasterAdmin && (
                    <div className="mt-6 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                            <ExclamationIcon className="w-4 h-4 text-orange-500" />
                            <span className="text-xs font-bold text-orange-500">{t('userProfile.personal.adminOptions')}</span>
                        </div>
                        <button
                            onClick={handleResetDatabase}
                            disabled={isDeleting}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg p-3 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 disabled:opacity-50"
                        >
                            <CaseIcon className="w-4 h-4" />
                            {t('userProfile.personal.resetDatabase')}
                        </button>
                        <p className="text-[10px] text-orange-500/70 mt-2 text-center">{t('userProfile.personal.resetDatabaseNote')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DangerZone;
