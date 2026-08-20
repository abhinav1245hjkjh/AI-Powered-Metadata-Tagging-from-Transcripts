import React, { useState } from 'react';
import { Tag, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const TopicList = ({ keywords = [] }) => {
  const [copiedKw, setCopiedKw] = useState(null);

  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-[#475467] italic bg-[#F9FAFB] rounded-xl border border-[#E4E7EC]">
        No key topics or keyphrases extracted from this transcript.
      </div>
    );
  }

  const handleCopy = (kw) => {
    navigator.clipboard.writeText(kw);
    setCopiedKw(kw);
    toast.success(`Copied: "${kw}"`);
    setTimeout(() => setCopiedKw(null), 2000);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((kw, idx) => {
        const isCopied = copiedKw === kw;
        const cleanKw = typeof kw === 'string' ? kw : String(kw);

        return (
          <button
            key={idx}
            type="button"
            onClick={() => handleCopy(cleanKw)}
            title={`Click to copy: "${cleanKw}"`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#93C5FD] text-[#1E3A8A] text-xs font-semibold transition-all group shadow-saas cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5 text-[#2563EB] group-hover:scale-110 transition-transform flex-shrink-0" />
            <span className="truncate max-w-[240px] capitalize">
              {cleanKw}
            </span>
            {isCopied ? (
              <Check className="w-3 h-3 text-[#15803D] ml-0.5 flex-shrink-0" />
            ) : (
              <Copy className="w-3 h-3 text-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TopicList;
