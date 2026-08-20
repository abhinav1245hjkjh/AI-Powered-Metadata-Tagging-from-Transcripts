import React from 'react';
import {
  Mic,
  X,
  ExternalLink
} from 'lucide-react';

const formatNumber = (num) => {
  if (typeof num !== 'number') return '0';
  return num.toLocaleString();
};

const SpeakerDetailPanel = ({
  speaker,
  onClose,
  onNavigateToTranscript
}) => {
  if (!speaker) return null;

  const {
    name,
    share = 0,
    turns = 0,
    words = 0,
    topics = [],
    entities = [],
    segmentIndices = []
  } = speaker;

  return (
    <div className="saas-card p-5 space-y-4 bg-white border border-[#E4E7EC] shadow-saas">
      {/* Header with Close */}
      <div className="flex items-start justify-between border-b border-[#EAECF0] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED] flex-shrink-0">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#475467] tracking-wider">
              Speaker Details
            </span>
            <h3 className="text-base font-bold text-[#111827] mt-0.5">
              {name}
            </h3>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#667085] hover:text-[#111827] hover:bg-[#F9FAFB] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
          <div className="text-[10px] uppercase font-bold text-[#475467]">Share</div>
          <div className="text-sm font-bold text-[#111827] font-mono tabular-nums">{share}%</div>
        </div>
        <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
          <div className="text-[10px] uppercase font-bold text-[#475467]">Turns</div>
          <div className="text-sm font-bold text-[#7C3AED] font-mono tabular-nums">{turns}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
          <div className="text-[10px] uppercase font-bold text-[#475467]">Words</div>
          <div className="text-sm font-bold text-[#111827] font-mono tabular-nums">{formatNumber(words)}</div>
        </div>
      </div>

      {/* Participation Bar */}
      <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-1.5">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-[#475467]">Conversation Share:</span>
          <span className="font-mono font-bold text-[#111827]">{share}% of total words</span>
        </div>
        <div className="h-2 w-full bg-[#E4E7EC] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#7C3AED] rounded-full"
            style={{ width: `${Math.max(4, Math.min(100, share))}%` }}
          />
        </div>
      </div>

      {/* Jump to Raw Transcript Action */}
      <button
        type="button"
        onClick={() => onNavigateToTranscript && onNavigateToTranscript(name)}
        className="w-full py-2.5 px-3 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-saas transition-all flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span>View Dialogue in Raw Transcript</span>
      </button>

      {/* Topics Discussed by Speaker */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-bold text-[#111827]">Topics Discussed ({topics.length})</h4>
        {topics.length === 0 ? (
          <p className="text-xs text-[#667085] italic">No topic keywords directly attributed.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1E3A8A] border border-[#93C5FD] text-xs font-semibold"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Entities Mentioned */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-bold text-[#111827]">Entities Mentioned ({entities.length})</h4>
        {entities.length === 0 ? (
          <p className="text-xs text-[#667085] italic">No named entities directly mentioned.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {entities.slice(0, 8).map((e) => (
              <span
                key={e}
                className="px-2 py-0.5 rounded-md bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-xs font-semibold"
              >
                {e}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Segment Activity Timeline */}
      {segmentIndices.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-[#EAECF0]">
          <h4 className="text-xs font-bold text-[#111827]">Dialogue Segments Active</h4>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {segmentIndices.map((idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-[#F2F4F7] border border-[#EAECF0] text-[10px] font-mono font-bold text-[#344054]"
              >
                Seg #{idx}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeakerDetailPanel;
