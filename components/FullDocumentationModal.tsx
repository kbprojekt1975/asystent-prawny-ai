import React from 'react';
import HelpModal from './HelpModal';
import FullDocumentation from './FullDocumentation';
import { useTranslation } from 'react-i18next';

interface FullDocumentationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FullDocumentationModal: React.FC<FullDocumentationModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();

    return (
        <HelpModal
            isOpen={isOpen}
            onClose={onClose}
            title={t('documentation.title')}
            maxWidth="max-w-4xl"
        >
            <FullDocumentation />
        </HelpModal>
    );
};

export default FullDocumentationModal;
