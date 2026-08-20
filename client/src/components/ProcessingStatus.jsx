import React from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

const analysisStages = [
  { key: 'upload', label: 'Transcript Ingestion' },
  { key: 'spacy', label: 'Named Entities' },
  { key: 'vader', label: 'Sentiment Valence' },
  { key: 'roberta', label: 'Emotional Tone' },
  { key: 'keybert', label: 'Key Topics & Phrases' },
  { key: 'bart', label: 'Domain Classification' }
];

export const ProcessingStatus = ({ status = 'processing' }) => {
  return <StatusBadge status={status} size="sm" />;
};

export const ProcessingStepper = ({ status = 'processing' }) => {
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isQueued = status === 'queued';

  return (
    <div className="saas-card p-5 space-y-3.5 bg-white border border-[#E4E7EC] rounded-xl shadow-saas">
      <div className="flex items-center justify-between text-xs border-b border-[#EAECF0] pb-3">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
          ) : isFailed ? (
            <AlertCircle className="w-4 h-4 text-[#B42318]" />
          ) : (
            <Loader2 className="w-4 h-4 text-[#3157D5] animate-spin" />
          )}
          <span className="font-bold text-[#172033]">
            {isCompleted
              ? 'Metadata Extraction Complete'
              : isFailed
              ? 'Analysis Failed'
              : isQueued
              ? 'Queued for Analysis'
              : 'Extracting Metadata & Insights...'}
          </span>
        </div>
        <StatusBadge status={status} size="xs" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {analysisStages.map((stage, idx) => {
          let stepState = 'pending';
          if (isCompleted) {
            stepState = 'done';
          } else if (isFailed) {
            stepState = idx === 0 ? 'done' : 'error';
          } else if (isQueued) {
            stepState = idx === 0 ? 'active' : 'pending';
          } else {
            stepState = idx <= 3 ? 'done' : idx === 4 ? 'active' : 'pending';
          }

          return (
            <div
              key={stage.key}
              className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 transition-all ${
                stepState === 'done'
                  ? 'bg-[#ECFDF3] border-[#D1FADF] text-[#15803D]'
                  : stepState === 'active'
                  ? 'bg-[#EEF3FF] border-[#C7D7FE] text-[#3157D5] shadow-saas font-semibold'
                  : stepState === 'error'
                  ? 'bg-[#FEF3F2] border-[#FECDCA] text-[#B42318]'
                  : 'bg-[#F9FAFB] border-[#E4E7EC] text-[#667085]'
              }`}
            >
              {stepState === 'done' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] flex-shrink-0" />
              ) : stepState === 'active' ? (
                <Loader2 className="w-3.5 h-3.5 text-[#3157D5] animate-spin flex-shrink-0" />
              ) : stepState === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5 text-[#B42318] flex-shrink-0" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-[#D0D5DD] flex-shrink-0" />
              )}
              <span className="truncate text-[11px] font-medium">{stage.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessingStatus;
