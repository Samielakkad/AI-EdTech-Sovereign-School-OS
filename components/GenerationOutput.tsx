
import React from 'react';

interface AttentionGaugeProps {
  score: number; // 0-100
}

const AttentionGauge: React.FC<AttentionGaugeProps> = ({ score }) => {
  const getGaugeColor = () => {
    if (score > 80) return 'bg-green-500';
    if (score > 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-300">Classroom Orderliness</span>
      <div className="w-40 h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getGaugeColor()}`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
      <span className="text-lg font-bold w-12 text-right">{score}</span>
    </div>
  );
};

export default AttentionGauge;
