import React, { useState, useEffect, useMemo } from 'react';
import { Search, Copy, Check, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';

const isSceneHeading = (line) => {
  const trimmed = line.trim();
  return (
    /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/i.test(trimmed) ||
    /^(SCENE|ACT\s+[IVXLCDM]+)/i.test(trimmed) ||
    /^\[\d{2}:\d{2}(:\d{2})?\]/.test(trimmed)
  );
};

const isSpeakerLine = (line) => {
  const trimmed = line.trim();
  return /^[A-Z0-9\s._-]{2,25}:/.test(trimmed);
};

const TranscriptViewer = ({ rawText = '', title = 'Source Transcript', initialSearchQuery = '' }) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const lines = useMemo(() => {
    return (rawText || '').split(/\r\n|\r|\n/);
  }, [rawText]);

  const wordCount = useMemo(() => {
    const raw = typeof rawText === 'string' ? rawText.trim() : '';
    return raw ? raw.split(/\s+/).filter(Boolean).length : 0;
  }, [rawText]);

  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    const query = searchQuery.toLowerCase().trim();
    return lines.filter((l) => l.toLowerCase().includes(query)).length;
  }, [lines, searchQuery]);

  const handleCopy = () => {
    if (!rawText) return;
    navigator.clipboard.writeText(rawText);
    setIsCopied(true);
    toast.success('Raw transcript copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const highlightMatch = (text, query) => {
    if (!query.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-[#FEF08A] text-[#713F12] px-0.5 rounded font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="saas-card overflow-hidden bg-white border border-[#E4E7EC] rounded-xl shadow-saas">
      {/* Viewer Header */}
      <div className="p-3.5 sm:p-4 border-b border-[#EAECF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F9FAFB]">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-[#3157D5] flex-shrink-0" />
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-[#101828]">
              {title}
            </h3>
            <div className="text-xs text-[#475467] font-mono font-semibold">
              {lines.length} lines • {wordCount} words
            </div>
          </div>
        </div>

        {/* Toolbar: Search + Match badge + Copy Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#475467] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find in transcript..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-white border border-[#D0D5DD] text-[#101828] text-xs placeholder-[#667085] focus:outline-none focus:border-[#3157D5] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#101828] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {searchQuery.trim() && (
            <span className="text-xs font-mono font-bold text-[#101828] bg-[#F2F4F7] px-2 py-1 rounded-md border border-[#EAECF0] tabular-nums">
              {matchCount} {matchCount === 1 ? 'match' : 'matches'}
            </span>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F9FAFB] text-[#344054] hover:text-[#101828] border border-[#D0D5DD] text-xs font-bold transition-colors flex-shrink-0 cursor-pointer shadow-saas"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#067647]" />
                <span className="text-[#067647]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#475467]" />
                <span>Copy All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Formatted Monospace Viewer */}
      <div className="p-4 bg-[#FAFAFC] font-mono text-xs text-[#101828] overflow-x-auto max-h-[640px] leading-relaxed select-text space-y-0.5 border-t border-[#EAECF0]">
        {lines.map((line, idx) => {
          const isHeading = isSceneHeading(line);
          const isSpeaker = isSpeakerLine(line);
          const isMatch = searchQuery.trim() && line.toLowerCase().includes(searchQuery.toLowerCase().trim());

          let renderedLine = highlightMatch(line, searchQuery);

          if (isHeading) {
            return (
              <div
                key={idx}
                className={`flex gap-3 py-1.5 px-2 rounded-md font-bold text-[#101828] bg-[#EEF3FF] border-l-2 border-[#3157D5] my-1 ${
                  isMatch ? 'ring-1 ring-[#F59E0B]' : ''
                }`}
              >
                <span className="text-[#667085] select-none w-7 text-right tabular-nums flex-shrink-0 font-medium">
                  {idx + 1}
                </span>
                <span className="whitespace-pre-wrap">{renderedLine || '\u00A0'}</span>
              </div>
            );
          }

          if (isSpeaker) {
            const colonIdx = line.indexOf(':');
            const speakerPart = line.substring(0, colonIdx + 1);
            const dialogPart = line.substring(colonIdx + 1);

            return (
              <div
                key={idx}
                className={`flex gap-3 py-0.5 px-1.5 rounded-md ${
                  isMatch ? 'bg-[#FEF08A]/60' : ''
                }`}
              >
                <span className="text-[#667085] select-none w-7 text-right tabular-nums flex-shrink-0 font-medium">
                  {idx + 1}
                </span>
                <div className="whitespace-pre-wrap">
                  <span className="font-bold text-[#3157D5]">
                    {highlightMatch(speakerPart, searchQuery)}
                  </span>
                  <span className="text-[#101828]">
                    {highlightMatch(dialogPart, searchQuery)}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={idx}
              className={`flex gap-3 py-0.5 px-1.5 rounded-md ${
                isMatch ? 'bg-[#FEF08A]/60' : ''
              }`}
            >
              <span className="text-[#667085] select-none w-7 text-right tabular-nums flex-shrink-0 font-medium">
                {idx + 1}
              </span>
              <span className="whitespace-pre-wrap text-[#101828]">
                {renderedLine || '\u00A0'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TranscriptViewer;
