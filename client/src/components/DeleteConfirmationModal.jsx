import React, { useEffect } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

const DeleteConfirmationModal = ({
  isOpen,
  title = 'Delete transcript?',
  description = 'This action cannot be undone.',
  transcriptTitle = '',
  isDeleting = false,
  onConfirm,
  onCancel
}) => {
  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Modal Dialog Card */}
      <div
        className="w-full max-w-md bg-white border border-[#DCE5F2] shadow-2xl rounded-2xl p-6 space-y-5 relative text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] p-1.5 rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#DC2626] flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 pr-6">
            <h3 id="delete-dialog-title" className="text-lg font-extrabold text-[#0F172A]">
              {title}
            </h3>
            {transcriptTitle && (
              <p className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#BFDBFE] inline-block truncate max-w-[300px]">
                "{transcriptTitle}"
              </p>
            )}
            <p className="text-xs text-[#64748B] leading-relaxed pt-1">
              {description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#94A3B8] hover:bg-[#F8FAFC] text-[#334155] font-bold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white font-bold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Transcript</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
