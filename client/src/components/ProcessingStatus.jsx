import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, Clock, RefreshCw } from 'lucide-react';
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

export const ProcessingStepper = ({
  status = 'processing',
  error = null,
  onRetry = null,
  isRetrying = false,
  onViewTranscript = null,
  onUploadAnother = null
}) => {
  const isCompleted = status === 'completed';
  const isRateLimited = status === 'temporarily_rate_limited';
  const isFailed = status === 'failed';
  const isQueued = status === 'queued';

  return (
    <div className="saas-card p-5 space-y-3.5 bg-white border border-[#E4E7EC] rounded-xl shadow-saas">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-[#EAECF0] pb-3">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
          ) : isRateLimited ? (
            <Clock className="w-4 h-4 text-[#D97706] animate-pulse" />
          ) : isFailed ? (
            <AlertCircle className="w-4 h-4 text-[#B42318]" />
          ) : (
            <Loader2 className="w-4 h-4 text-[#3157D5] animate-spin" />
          )}
          <div className="flex flex-col">
            <span className="font-bold text-[#172033]">
              {isCompleted
                ? 'Metadata Extraction Complete'
                : isRateLimited
                ? 'AI analysis temporarily busy'
                : isFailed
                ? 'Analysis Failed'
                : isQueued
                ? 'Queued for Analysis'
                : 'Extracting Metadata & Insights...'}
            </span>
            {isRateLimited && (
              <span className="text-[11px] text-[#D97706] font-medium mt-0.5">
                {error || 'The AI provider is currently rate limiting requests. Your transcript is safe. Please retry analysis in a moment.'}
              </span>
            )}
            {isFailed && (
              <span className="text-[11px] text-[#B42318] font-medium mt-0.5">
                {error || 'Metadata processing failed. Please retry.'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {onRetry && (isRateLimited || isFailed) && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow-saas transition-all cursor-pointer ${
                isRateLimited
                  ? 'bg-[#D97706] hover:bg-[#B45309] disabled:bg-[#94A3B8]'
                  : 'bg-[#B42318] hover:bg-[#912018] disabled:bg-[#94A3B8]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Re-Queueing...' : 'Retry Analysis'}</span>
            </button>
          )}
          {onViewTranscript && (isRateLimited || isCompleted || isFailed) && (
            <button
              type="button"
              onClick={onViewTranscript}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F8FAFB] border border-[#D0D5DD] text-[#344054] hover:text-[#101828] text-xs font-semibold shadow-saas transition-all cursor-pointer"
            >
              View Transcript
            </button>
          )}
          {onUploadAnother && (isRateLimited || isCompleted || isFailed) && (
            <button
              type="button"
              onClick={onUploadAnother}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F8FAFB] border border-[#D0D5DD] text-[#344054] hover:text-[#101828] text-xs font-semibold shadow-saas transition-all cursor-pointer"
            >
              Upload Another
            </button>
          )}
          <StatusBadge status={status} size="xs" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {analysisStages.map((stage, idx) => {
          let stepState = 'pending';
          if (isCompleted) {
            stepState = 'done';
          } else if (isRateLimited) {
            stepState = idx === 0 ? 'done' : 'warning';
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
                  : stepState === 'warning'
                  ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]'
                  : stepState === 'error'
                  ? 'bg-[#FEF3F2] border-[#FECDCA] text-[#B42318]'
                  : 'bg-[#F9FAFB] border-[#E4E7EC] text-[#667085]'
              }`}
            >
              {stepState === 'done' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] flex-shrink-0" />
              ) : stepState === 'active' ? (
                <Loader2 className="w-3.5 h-3.5 text-[#3157D5] animate-spin flex-shrink-0" />
              ) : stepState === 'warning' ? (
                <Clock className="w-3.5 h-3.5 text-[#D97706] flex-shrink-0" />
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
