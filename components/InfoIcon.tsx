import React from 'react';

interface InfoIconProps {
    onClick: () => void;
    className?: string;
}

export const InfoIcon: React.FC<InfoIconProps> = ({ onClick, className = "" }) => {
    return (
        <button
            onClick={onClick}
            className={`p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors ${className}`}
            title="Informacje"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
        </button>
    );
};
