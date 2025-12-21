
import React from 'react';

interface CostCounterProps {
  cost: number;
}

const CostCounter: React.FC<CostCounterProps> = ({ cost }) => {
  return (
    <div className="flex items-center justify-center mr-2 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg shadow-inner" title="Całkowity koszt">
      <span className="text-emerald-400 font-mono font-bold text-sm">
        ${cost.toFixed(4)}
      </span>
    </div>
  );
};

export default CostCounter;
