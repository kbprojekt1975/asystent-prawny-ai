import React from 'react';
import { CheckIcon, ChevronRightIcon } from '../Icons';

interface ProDashboardTileProps {
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    description: string;
    buttonText: string;
    isCompleted?: boolean;
    isDisabled?: boolean;
    isCyan?: boolean;
}

const ProDashboardTile: React.FC<ProDashboardTileProps> = ({
    onClick,
    icon,
    title,
    description,
    buttonText,
    isCompleted,
    isDisabled,
    isCyan
}) => {
    return (
        <div
            onClick={() => !isDisabled && onClick()}
            className={`group relative bg-slate-800/40 border-2 rounded-[2.5rem] p-8 transition-all duration-300 overflow-hidden ${isDisabled
                    ? 'cursor-not-allowed opacity-40 border-transparent'
                    : isCompleted
                        ? 'cursor-pointer border-green-500/50 hover:bg-green-500/5'
                        : isCyan
                            ? 'cursor-pointer border-slate-700/50 hover:border-cyan-500 hover:bg-slate-800/60'
                            : 'cursor-pointer border-slate-700/50 hover:border-violet-500 hover:bg-slate-800/60'
                }`}
        >
            {isCompleted && (
                <div className="absolute top-6 right-6 p-2 bg-green-500/20 text-green-400 rounded-full">
                    <CheckIcon className="w-5 h-5" />
                </div>
            )}

            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 ${isCompleted
                    ? 'bg-green-600/20 text-green-400'
                    : isCyan
                        ? 'bg-cyan-600/20 text-cyan-400'
                        : 'bg-violet-600/20 text-violet-400'
                }`}>
                {icon}
            </div>

            <h3 className="text-2xl font-bold mb-4">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                {description}
            </p>

            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isCyan ? 'text-cyan-400' : 'text-violet-400'}`}>
                <span>{buttonText}</span>
                <ChevronRightIcon className="w-4 h-4" />
            </div>
        </div>
    );
};

export default ProDashboardTile;
