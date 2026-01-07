import React from 'react';
import { LegalRoadmap as LegalRoadmapType, RoadmapStep } from '../types';
import { CheckIcon, MapPinIcon } from './Icons';

interface LegalRoadmapProps {
    roadmap: LegalRoadmapType;
}

const LegalRoadmap: React.FC<LegalRoadmapProps> = ({ roadmap }) => {
    return (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MapPinIcon className="w-6 h-6 text-blue-400" />
                {roadmap.title || 'Twoja Mapa Drogowa'}
            </h3>

            <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10" />

                <div className="space-y-8">
                    {roadmap.steps.map((step, index) => (
                        <div key={index} className="relative pl-12">
                            {/* Step indicator */}
                            <div className={`
                absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${step.isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                    step.isCurrent ? 'bg-blue-500 border-blue-500 text-white animate-pulse' :
                                        'bg-gray-800 border-white/20 text-white/40'}
              `}>
                                {step.isCompleted ? (
                                    <CheckIcon className="w-5 h-5" />
                                ) : (
                                    <span className="text-sm font-bold">{index + 1}</span>
                                )}
                            </div>

                            {/* Step Content */}
                            <div className={`
                p-4 rounded-xl border transition-all duration-300
                ${step.isCurrent ? 'bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/20' : 'bg-white/5 border-white/5'}
              `}>
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className={`font-semibold ${step.isCurrent ? 'text-blue-400' : 'text-white'}`}>
                                        {step.label}
                                    </h4>
                                    {step.isCurrent && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500 text-white px-2 py-0.5 rounded">
                                            TU JESTEŚ
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-white/60 leading-relaxed">
                                    {step.description}
                                </p>
                                {step.expectedDate && (
                                    <div className="mt-2 text-xs text-white/40 flex items-center gap-1">
                                        <span>Przewidywany termin:</span>
                                        <span className="font-medium text-white/60">{step.expectedDate}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LegalRoadmap;
