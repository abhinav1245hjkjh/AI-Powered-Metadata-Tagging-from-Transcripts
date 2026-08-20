import React, { useState } from 'react';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const ErrorState = ({
  title = 'Analysis Unavailable',
  message = 'An unexpected error occurred while processing transcript data.',
  errorDetails = null,
  onRetry = null,
  retryLabel = 'Retry Analysis'
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="saas-card p-6 text-center max-w-lg mx-auto space-y-4 border border-[#FECDCA] bg-[#FEF3F2] rounded-xl shadow-saas">
      <div className="w-10 h-10 mx-auto rounded-lg bg-white border border-[#FECDCA] text-[#B42318] flex items-center justify-center shadow-saas">
        <AlertCircle className="w-5 h-5" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-bold text-[#172033]">{title}</h3>
        <p className="text-xs text-[#667085] leading-relaxed max-w-sm mx-auto">{message}</p>
      </div>

      {onRetry && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#B42318] hover:bg-[#912018] text-white text-xs font-semibold shadow-saas transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{retryLabel}</span>
          </button>
        </div>
      )}

      {errorDetails && (
        <div className="pt-2 text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-[#667085] hover:text-[#172033] font-mono flex items-center gap-1 mx-auto cursor-pointer"
          >
            <span>{showDetails ? 'Hide Diagnostics' : 'Show Technical Diagnostics'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <pre className="mt-2 p-3 rounded-lg bg-[#172033] border border-[#344054] text-xs font-mono text-[#FECDCA] whitespace-pre-wrap overflow-x-auto">
              {typeof errorDetails === 'object' ? JSON.stringify(errorDetails, null, 2) : String(errorDetails)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorState;
