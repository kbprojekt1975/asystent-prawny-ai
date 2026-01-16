import React from 'react';
import { XIcon } from './Icons';
import { useTranslation } from 'react-i18next';

interface PrivacyPolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
    showAcceptance?: boolean;
    onAccept?: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose, showAcceptance, onAccept }) => {
    const { t } = useTranslation();
    const [hasRead, setHasRead] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setHasRead(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/50 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-white">{t('privacyPolicy.title')}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 text-slate-300 space-y-6 custom-scrollbar">
                    <section>
                        <h3 className="text-lg font-bold text-white mb-3">{t('privacyPolicy.intro.title')}</h3>
                        <p>{t('privacyPolicy.intro.text')}</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-3">{t('privacyPolicy.admin.title')}</h3>
                        <p>{t('privacyPolicy.admin.text')}</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-3">{t('privacyPolicy.scope.title')}</h3>

                        <div className="space-y-4 pl-4 border-l-2 border-slate-700">
                            <div>
                                <h4 className="font-semibold text-cyan-400 mb-2">{t('privacyPolicy.scope.login.title')}</h4>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li><strong>{t('privacyPolicy.scope.login.scope')}:</strong> {t('privacyPolicy.scope.login.scopeVal')}</li>
                                    <li><strong>{t('privacyPolicy.scope.login.goal')}:</strong> {t('privacyPolicy.scope.login.goalVal')}</li>
                                    <li><strong>{t('privacyPolicy.scope.login.legal')}:</strong> {t('privacyPolicy.scope.login.legalVal')}</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-cyan-400 mb-2">{t('privacyPolicy.scope.docs.title')}</h4>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li><strong>{t('privacyPolicy.scope.docs.scope')}:</strong> {t('privacyPolicy.scope.docs.scopeVal')}</li>
                                    <li><strong>{t('privacyPolicy.scope.docs.goal')}:</strong> {t('privacyPolicy.scope.docs.goalVal')}</li>
                                    <li><strong>{t('privacyPolicy.scope.docs.legal')}:</strong> {t('privacyPolicy.scope.docs.legalVal')}</li>
                                    <li><strong>{t('privacyPolicy.scope.docs.info')}:</strong> {t('privacyPolicy.scope.docs.infoVal')}</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-cyan-400 mb-2">{t('privacyPolicy.scope.history.title')}</h4>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li><strong>{t('privacyPolicy.scope.history.scope')}:</strong> {t('privacyPolicy.scope.history.scopeVal')}</li>
                                    <li><strong>{t('privacyPolicy.scope.history.goal')}:</strong> {t('privacyPolicy.scope.history.goalVal')}</li>
                                    <li><strong>{t('privacyPolicy.scope.history.legal')}:</strong> {t('privacyPolicy.scope.history.legalVal')}</li>
                                    <li><strong>{t('privacyPolicy.scope.history.info')}:</strong> {t('privacyPolicy.scope.history.infoVal')}</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-cyan-400 mb-2">{t('privacyPolicy.scope.tech.title')}</h4>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li><strong>{t('privacyPolicy.scope.tech.scope')}:</strong> {t('privacyPolicy.scope.tech.scopeVal')}</li>
                                    <li><strong>{t('privacyPolicy.scope.tech.goal')}:</strong> {t('privacyPolicy.scope.tech.goalVal')}</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-3">{t('privacyPolicy.recipients.title')}</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            {(t('privacyPolicy.recipients.list', { returnObjects: true }) as string[]).map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-3">{t('privacyPolicy.rights.title')}</h3>
                        <p className="mb-2">{t('privacyPolicy.rights.intro')}</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                            {(t('privacyPolicy.rights.list', { returnObjects: true }) as string[]).map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-3">{t('privacyPolicy.security.title')}</h3>
                        <p>{t('privacyPolicy.security.text')}</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-3">{t('privacyPolicy.cookies.title')}</h3>
                        <p>{t('privacyPolicy.cookies.text')}</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-3">{t('privacyPolicy.changes.title')}</h3>
                        <p>{t('privacyPolicy.changes.text')}</p>
                    </section>
                </div>

                <footer className="p-6 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                    {showAcceptance && (
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="accept-policy"
                                checked={hasRead}
                                onChange={e => setHasRead(e.target.checked)}
                                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-slate-900"
                            />
                            <label htmlFor="accept-policy" className="text-sm text-slate-300 font-medium cursor-pointer">
                                {t('privacyPolicy.accept.label')}
                            </label>
                        </div>
                    )}
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={onClose}
                            className="flex-1 md:flex-none px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors border border-slate-600"
                        >
                            {showAcceptance ? t('privacyPolicy.accept.cancel') : t('privacyPolicy.accept.close')}
                        </button>
                        {showAcceptance && (
                            <button
                                onClick={() => {
                                    if (hasRead && onAccept) {
                                        onAccept();
                                        onClose();
                                    }
                                }}
                                disabled={!hasRead}
                                className="flex-1 md:flex-none px-8 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-lg shadow-cyan-600/20"
                            >
                                {t('privacyPolicy.accept.continue')}
                            </button>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default PrivacyPolicyModal;
