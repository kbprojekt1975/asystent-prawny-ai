import PrivacyPolicyModal from './PrivacyPolicyModal';

// ... (previous imports)

// Inside UserProfileModal component:
const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);

// ... (rest of the component logic)

return (
    <div
        className={`fixed inset-0 bg-black bg-opacity-60 z-50 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    // ...
    >
        <div
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-2xl h-[90vh] bg-slate-800 shadow-2xl rounded-2xl border border-slate-700 transform transition-all duration-300 ease-in-out flex flex-col ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}
            onClick={e => e.stopPropagation()}
        >
            {/* ... Header and Content ... */}

            <footer className="p-6 border-t border-slate-700 flex-shrink-0 flex justify-between items-center">
                <button
                    onClick={() => setIsPrivacyPolicyOpen(true)}
                    className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                >
                    Polityka Prywatności
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex justify-center rounded-md border border-slate-600 shadow-sm px-4 py-2 bg-slate-700 text-base font-medium text-slate-300 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 sm:text-sm transition-colors"
                >
                    Zamknij
                </button>
            </footer>
        </div>

        <HelpModal
        // ...
        />

        {/* Privacy Policy Modal */}
        <PrivacyPolicyModal
            isOpen={isPrivacyPolicyOpen}
            onClose={() => setIsPrivacyPolicyOpen(false)}
        />

        {/* Confirmation Modal */}
        {confirmAction && (
                // ...
            )}
    </div>
);
};

export default UserProfileModal;
