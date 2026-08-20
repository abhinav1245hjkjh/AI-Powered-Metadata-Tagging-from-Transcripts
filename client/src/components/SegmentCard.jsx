import React, { useState } from 'react';
import { Film, Clock, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export const SegmentCard = ({ segment, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isCopied, setIsCopied] = useState(false);

  const isTimestamp = /^Timestamp/i.test(segment.heading) || /^\[\d{2}:\d{2}/.test(segment.heading);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(segment.text || '');
    setIsCopied(true);
    toast.success(`Copied segment #${segment.index} text`);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const formattedIndex = String(segment.index !== undefined ? segment.index : 1).padStart(2, '0');

  return (
    <div className="border border-[#E4E7EC] rounded-xl bg-white overflow-hidden transition-all hover:border-[#D0D5DD] shadow-saas">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-start justify-between text-left hover:bg-[#F9FAFB] transition-colors cursor-pointer"
      >
        <div className="flex items-start gap-3 flex-1 pr-3">
          <span className="w-6 h-6 rounded-md bg-[#F2F4F7] border border-[#EAECF0] text-[#101828] font-mono text-[11px] font-bold flex items-center justify-center tabular-nums flex-shrink-0 mt-0.5">
            {formattedIndex}
          </span>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isTimestamp ? (
                <Clock className="w-3.5 h-3.5 text-[#3157D5] flex-shrink-0" />
              ) : (
                <Film className="w-3.5 h-3.5 text-[#475467] flex-shrink-0" />
              )}
              <span className="font-bold text-xs text-[#101828]">
                {segment.heading}
              </span>
            </div>

            {!isExpanded && segment.text && (
              <p className="text-xs text-[#344054] line-clamp-2 leading-relaxed font-sans font-normal">
                {segment.text.split('\n')[0]}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[#475467] mt-0.5">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy segment text"
            className="p-1 rounded hover:bg-[#F2F4F7] hover:text-[#101828] transition-colors cursor-pointer"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-[#067647]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-[#F2F4F7] hover:text-[#101828] transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-[#475467]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#475467]" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 py-3 border-t border-[#EAECF0] bg-[#F9FAFB]">
          <pre className="text-xs text-[#101828] font-mono whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
            {segment.text || 'No dialogue content in this segment.'}
          </pre>
        </div>
      )}
    </div>
  );
};

const SceneTimeline = ({ segments = [] }) => {
  if (!segments || segments.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-[#475467] italic bg-[#F9FAFB] rounded-xl border border-[#E4E7EC]">
        No segments identified in this transcript.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {segments.map((seg, idx) => (
        <SegmentCard
          key={seg.index || idx}
          segment={seg}
          defaultExpanded={idx === 0}
        />
      ))}
    </div>
  );
};

export default SceneTimeline;
