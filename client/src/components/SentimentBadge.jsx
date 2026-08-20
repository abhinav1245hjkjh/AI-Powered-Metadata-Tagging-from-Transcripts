import React from 'react';

const SentimentBadge = ({ sentiment, size = 'sm', showScore = false }) => {
  if (!sentiment) return null;

  const polarity = (typeof sentiment === 'string' ? sentiment : sentiment.polarity || 'Neutral').toLowerCase();
  const score = typeof sentiment === 'object' ? sentiment.score : null;

  const configs = {
    positive: {
      label: 'Positive',
      className: 'bg-[#ECFDF3] text-[#067647] border-[#D1FADF]',
      dot: 'bg-[#067647]'
    },
    negative: {
      label: 'Negative',
      className: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
      dot: 'bg-[#B42318]'
    },
    neutral: {
      label: 'Neutral',
      className: 'bg-[#F2F4F7] text-[#344054] border-[#EAECF0]',
      dot: 'bg-[#475467]'
    }
  };

  const config = configs[polarity] || configs.neutral;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[11px] gap-1.5',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-xs sm:text-sm gap-2'
  };

  return (
    <span
      className={`inline-flex items-center rounded-md font-semibold border ${config.className} ${sizeClasses[size] || sizeClasses.sm}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`} />
      <span>{config.label}</span>
      {showScore && score !== null && score !== undefined && (
        <span className="opacity-75 text-[10px] font-mono">
          ({score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2)})
        </span>
      )}
    </span>
  );
};

export default SentimentBadge;
