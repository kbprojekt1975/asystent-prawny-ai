import React from 'react';
import { ScaleIcon, ShieldCheckIcon } from './Icons';

interface LegalLogoProps {
    className?: string;
}

const LegalLogo: React.FC<LegalLogoProps> = ({ className = "" }) => {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Integrated Shield and Scales Logo */}
            <div className="relative group">
                {/* Background Glow */}
                <div className="absolute inset-x-[-15%] inset-y-[-15%] bg-cyan-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Main Branding Container */}
                <div className="relative flex items-center justify-center w-32 h-32 bg-slate-900/80 border border-white/10 rounded-[2.5rem] shadow-2xl backdrop-blur-sm transition-transform duration-500 group-hover:scale-105">
                    
                    {/* Shield Icon - Serving as the base */}
                    <div className="relative transform -translate-y-1">
                        <ShieldCheckIcon className="w-20 h-20 text-slate-400 group-hover:text-cyan-500/80 transition-colors duration-500" />
                        
                        {/* Scales Icon - Integrated inside the shield area or floating above */}
                        <div className="absolute inset-0 flex items-center justify-center transform translate-y-1">
                            <ScaleIcon className="w-10 h-10 text-cyan-400 group-hover:text-white transition-colors duration-500" />
                        </div>
                    </div>

                    {/* Accent Rings */}
                    <div className="absolute inset-2 border border-white/5 rounded-[2rem] pointer-events-none" />
                </div>
            </div>
        </div>
    );
};

export default LegalLogo;
