import React from 'react';
import MatrixBackground from './MatrixBackground';

interface MonitorWrapperProps {
    children: React.ReactNode;
}

const MonitorWrapper: React.FC<MonitorWrapperProps> = ({ children }) => {
    return (
        <div className="relative p-2 md:p-4 perspective-[1000px]">
            {/* Monitor Bezel/Frame */}
            <div className="relative bg-slate-800 rounded-lg p-1 shadow-[0_0_20px_rgba(0,0,0,0.8),inset_0_0_10px_rgba(255,255,255,0.05)] border border-slate-700 border-b-4 border-b-slate-950 overflow-hidden transform-gpu rotate-x-2">
                
                {/* Screen Surface with Glow */}
                <div className="relative bg-black rounded-sm overflow-hidden border border-slate-900 shadow-[inset_0_0_30px_rgba(6,182,212,0.2)]">
                    
                    {/* Matrix Effect Background Layer */}
                    <MatrixBackground />
                    
                    {/* CRT Scanline Effect */}
                    <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.15]" 
                         style={{ 
                            backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                            backgroundSize: '100% 4px, 3px 100%' 
                         }} 
                    />

                    {/* Subtle Screen Flicker */}
                    <div className="absolute inset-0 pointer-events-none z-20 animate-monitor-flicker opacity-[0.03] bg-white" />

                    {/* Inner content (Headline + Matrix) */}
                    <div className="relative z-10 p-4 md:p-6 min-h-[80px] flex items-center justify-center">
                        {children}
                    </div>
                </div>
                
                {/* Power Light */}
                <div className="absolute bottom-1 right-3 w-1 h-1 rounded-full bg-cyan-500 shadow-[0_0_5px_#06b6d4] animate-pulse" />
            </div>

            {/* Stand/Base (subtle) */}
            <div className="mx-auto w-24 h-2 bg-slate-900 rounded-b-lg shadow-lg opacity-80" />

            <style>{`
                @keyframes monitor-flicker {
                    0% { opacity: 0.03; }
                    5% { opacity: 0.05; }
                    10% { opacity: 0.03; }
                    15% { opacity: 0.04; }
                    25% { opacity: 0.03; }
                    30% { opacity: 0.06; }
                    100% { opacity: 0.03; }
                }
                .perspective-[1000px] {
                    perspective: 1000px;
                }
                .rotate-x-2 {
                    transform: rotateX(2deg);
                }
            `}</style>
        </div>
    );
};

export default MonitorWrapper;
