import React from 'react';
import { Smile, Frown, Meh } from 'lucide-react';

const SentimentChart = ({ sentiment }) => {
  if (!sentiment) {
    return (
      <div className="text-xs text-[#475467] italic py-4 text-center bg-[#F9FAFB] rounded-xl border border-[#E4E7EC]">
        No sentiment data available.
      </div>
    );
  }

  const { polarity = 'neutral', score = 0 } = sentiment;
  const numScore = typeof score === 'number' ? score : parseFloat(score) || 0.0;
  
  // Map compound score (-1.0 to 1.0) to percentage (0% to 100%)
  const percentage = Math.max(0, Math.min(100, ((numScore + 1) / 2) * 100));

  const polarityConfig = {
    positive: {
      color: 'text-[#067647]',
      bg: 'bg-[#ECFDF3] border-[#D1FADF]',
      icon: Smile,
      label: 'Positive Tone'
    },
    negative: {
      color: 'text-[#B42318]',
      bg: 'bg-[#FEF3F2] border-[#FECDCA]',
      icon: Frown,
      label: 'Negative Tone'
    },
    neutral: {
      color: 'text-[#344054]',
      bg: 'bg-[#F2F4F7] border-[#EAECF0]',
      icon: Meh,
      label: 'Neutral Tone'
    }
  };

  const current = polarityConfig[polarity.toLowerCase()] || polarityConfig.neutral;
  const IconComponent = current.icon;

  return (
    <div className="space-y-3.5">
      {/* Metric Header */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC]">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${current.bg}`}>
            <IconComponent className={`w-4 h-4 ${current.color}`} />
          </div>
          <div>
            <div className="text-xs text-[#475467] font-semibold">Polarity Classification</div>
            <div className={`text-sm font-bold capitalize ${current.color}`}>
              {current.label}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-[#475467] font-semibold">Valence Compound</div>
          <div className="text-base font-mono font-bold text-[#101828] tabular-nums">
            {numScore > 0 ? `+${numScore.toFixed(3)}` : numScore.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Progress Scale Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs text-[#475467] font-mono font-semibold">
          <span className="text-[#B42318]">-1.00 (Negative)</span>
          <span className="text-[#475467]">0.00 (Neutral)</span>
          <span className="text-[#067647]">+1.00 (Positive)</span>
        </div>
        
        <div className="relative h-2.5 w-full bg-[#F2F4F7] rounded-full overflow-hidden border border-[#E4E7EC]">
          <div
            className="absolute top-0 bottom-0 left-0 transition-all duration-500 rounded-full"
            style={{
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, #B42318 0%, #475467 50%, #067647 100%)'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SentimentChart;
