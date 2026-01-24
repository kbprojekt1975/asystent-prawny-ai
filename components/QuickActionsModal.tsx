import React from 'react';
import { useTranslation } from 'react-i18next';
import { QuickAction } from '../types';
import { XIcon, CaseIcon, TrashIcon } from './Icons';

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (action: QuickAction) => void;
  onRemove: (index: number) => void;
  quickActions: QuickAction[];
}

const QuickActionsModal: React.FC<QuickActionsModalProps> = ({ isOpen, onClose, onSelect, onRemove, quickActions }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-6 w-full max-w-md mx-4 transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
            {t('quickActionsModal.title')}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label={t('userProfile.footer.close')}
          >
            <XIcon />
          </button>
        </div>
        <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
          {quickActions.length > 0 ? (
            quickActions.map((action, index) => (
              <div key={index} className="relative group">
                <button
                  onClick={() => onSelect(action)}
                  className="w-full flex items-center gap-4 p-3 pr-12 text-left bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CaseIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{t(`law.areas.${action.lawArea.toLowerCase()}`)}</p>
                    {action.topic && <p className="text-sm text-slate-400 truncate">{action.topic}</p>}
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(index);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title={t('common.delete')}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-center py-8">
              {t('quickActionsModal.noActions')}
            </p>
          )}
        </div>
        <div className="mt-5 sm:mt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full inline-flex justify-center rounded-md border border-slate-600 shadow-sm px-4 py-2 bg-slate-700 text-base font-medium text-slate-300 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 sm:text-sm transition-colors"
          >
            {t('userProfile.footer.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsModal;
