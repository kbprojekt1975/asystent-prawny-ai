
import React from 'react';

interface CostCounterProps {
  percentage: number;
}

const CostCounter: React.FC<CostCounterProps> = ({ percentage }) => {
  const isLow = percentage <= 15;

  return (
    <div className="flex items-center justify-center px-4 py-2 bg-slate-800/80 border border-slate-700/50 rounded-xl shadow-lg" title="Stan Twojego planu">
      <span className={`${isLow ? 'text-red-500' : 'text-emerald-400'} font-mono font-bold text-base tracking-wider`}>
        {percentage.toFixed(1)}%
      </span>
    </div>
  );
};

export default CostCounter;
