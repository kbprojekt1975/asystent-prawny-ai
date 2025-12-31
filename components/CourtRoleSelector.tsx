
import React from 'react';
import { CourtRole } from '../types';
import { BriefcaseIcon, ScaleIcon, UserGroupIcon, ExclamationIcon } from './Icons'; // Assuming suitable icons exist or reuse

interface CourtRoleSelectorProps {
    onSelect: (role: CourtRole) => void;
}

const CourtRoleSelector: React.FC<CourtRoleSelectorProps> = ({ onSelect }) => {
    const roles = [
        {
            role: CourtRole.MyAttorney,
            icon: <BriefcaseIcon className="w-8 h-8 text-green-400" />,
            title: "Mój Mecenas",
            description: "Ćwicz pytania i odpowiedzi ze swoim adwokatem. Przygotuj się do zeznań."
        },
        {
            role: CourtRole.OpposingAttorney,
            icon: <UserGroupIcon className="w-8 h-8 text-red-400" />,
            title: "Mecenas Strony Przeciwnej",
            description: "Symulacja 'ognia krzyżowego'. Sprawdź, jak radzisz sobie z trudnymi pytaniami."
        },
        {
            role: CourtRole.Judge,
            icon: <ScaleIcon className="w-8 h-8 text-yellow-400" />,
            title: "Wysoki Sąd",
            description: "Symulacja przesłuchania przez sędziego. Formalny ton i precyzyjne pytania."
        },
        {
            role: CourtRole.Prosecutor,
            icon: <ExclamationIcon className="w-8 h-8 text-orange-600" />,
            title: "Prokurator",
            description: "Symulacja dla spraw karnych. Pytania oskarżycielskie."
        }
    ];

    return (
        <div className="flex flex-col items-center justify-center p-6 h-full anim-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Wybierz stronę symulacji</h2>
                <p className="text-slate-400">W kogo mam się wcielić podczas tego przesłuchania?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                {roles.map((item) => (
                    <button
                        key={item.role}
                        onClick={() => onSelect(item.role)}
                        className="flex items-start gap-4 p-6 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:bg-slate-700 hover:border-cyan-500/50 transition-all group text-left"
                    >
                        <div className="p-3 bg-slate-900 rounded-lg group-hover:scale-110 transition-transform">
                            {item.icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-sm text-slate-400">
                                {item.description}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CourtRoleSelector;
