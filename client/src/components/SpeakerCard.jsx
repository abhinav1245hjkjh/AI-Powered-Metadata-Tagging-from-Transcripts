import React from 'react';
import { Mic } from 'lucide-react';

const formatNumber = (num) => {
  if (typeof num !== 'number') return '0';
  return num.toLocaleString();
};

const formatTurn = (count) => {
  if (count === 1) return '1 turn';
  return `${formatNumber(count)} turns`;
};

const formatWord = (count) => {
  if (count === 1) return '1 word';
  return `${formatNumber(count)} words`;
};

const SpeakerCard = ({ speaker, isSelected, onClick }) => {
  if (!speaker) return null;

  const {
    name,
    share = 0,
    turns = 0,
    words = 0,
    sentiment = 'Neutral',
    isMostActive = false
  } = speaker;

  const sentimentColors = {
    Positive: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
    Negative: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
    Neutral: 'bg-[#F2F4F7] text-[#344054] border-[#EAECF0]'
  };

  const currentSentimentClass = sentimentColors[sentiment] || sentimentColors.Neutral;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick && onClick()}
      aria-label={`${name}, ${share} percent of conversation, ${turns} turns, ${words} words`}
      className={`saas-card p-4 sm:p-5 space-y-3.5 cursor-pointer transition-all border ${
        isSelected
          ? 'border-[#7C3AED] bg-[#F5F3FF]/40 ring-1 ring-[#7C3AED]'
          : 'border-[#E4E7EC] hover:border-[#DDD6FE] bg-white shadow-saas'
      }`}
    >
      {/* Header: Name + Most Active Pill + Share % */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED] flex-shrink-0">
            <Mic className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-base text-[#111827] truncate tracking-tight">
                {name}
              </h4>
              {isMostActive && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                  Most Active
                </span>
              )}
            </div>
            <p className="text-xs text-[#475467] font-semibold mt-0.5">
              {formatTurn(turns)} &nbsp;•&nbsp; {formatWord(words)}
            </p>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-base font-bold text-[#111827] font-mono tabular-nums">
            {share}%
          </div>
          <div className="text-[10px] text-[#667085] uppercase font-semibold tracking-wider">
            SHARE
          </div>
        </div>
      </div>

      {/* Participation Horizontal Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-[#475467]">Speaking share</span>
          <span className="text-[#111827] font-bold font-mono">{share}%</span>
        </div>
        <div className="h-2 w-full bg-[#E4E7EC] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#7C3AED] rounded-full transition-all duration-500"
            style={{ width: `${Math.max(4, Math.min(100, share))}%` }}
          />
        </div>
      </div>

      {/* Footer: Sentiment Indicator */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#EAECF0] text-xs">
        <span className="text-[#475467] font-semibold">Tone:</span>
        <span className={`px-2.5 py-0.5 rounded-md border text-xs font-semibold ${currentSentimentClass}`}>
          ● {sentiment}
        </span>
      </div>
    </div>
  );
};

export default SpeakerCard;
