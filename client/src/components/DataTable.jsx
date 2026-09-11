import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import CategoryBadge from './CategoryBadge';
import SentimentBadge from './SentimentBadge';
import { TableRowSkeleton } from './SkeletonLoader';
import EmptyState from './EmptyState';
import {
  ArrowRight,
  RotateCw,
  Trash2
} from 'lucide-react';

const DataTable = ({
  transcripts = [],
  loading = false,
  onRetry,
  onDelete,
  hasActiveFilters = false,
  emptyActionLink = '/upload'
}) => {
  if (loading) {
    return (
      <div className="saas-card overflow-hidden bg-white border border-[#DCE5F2] shadow-saas rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#DCE5F2] text-xs font-bold text-[#64748B]">
                <th className="py-3 px-4">Transcript Title</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Sentiment</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <TableRowSkeleton rows={5} />
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (transcripts.length === 0) {
    return (
      <div className="saas-card p-8 bg-white border border-[#DCE5F2] shadow-saas rounded-2xl">
        <EmptyState
          title={hasActiveFilters ? 'No Matching Transcripts' : 'No Transcripts in Library'}
          description={
            hasActiveFilters
              ? 'No transcripts match your selected search query and filter criteria.'
              : 'Upload your first audio transcript or screenplay to begin extracting metadata.'
          }
          actionLink={hasActiveFilters ? null : emptyActionLink}
          actionText="Upload New Transcript"
        />
      </div>
    );
  }

  return (
    <div className="saas-card overflow-hidden bg-white border border-[#DCE5F2] shadow-saas rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#DCE5F2] text-xs font-bold text-[#64748B]">
              <th className="py-3 px-4">Transcript Title</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Sentiment</th>
              <th className="py-3 px-4">Created Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {transcripts.map((t) => {
              const meta = t.metadata || {};
              const isRetryable = t.status === 'failed' || t.status === 'temporarily_rate_limited';

              return (
                <tr
                  key={t._id}
                  className="hover:bg-[#F4F8FF] transition-colors group text-sm"
                >
                  {/* Title & Filename Column */}
                  <td className="py-3.5 px-4 max-w-[280px]">
                    <div className="space-y-0.5">
                      <Link
                        to={`/transcripts/${t._id}`}
                        className="font-bold text-[#0F172A] hover:text-[#2563EB] transition-colors line-clamp-1 block"
                        title={t.title}
                      >
                        {t.title}
                      </Link>
                      {t.fileName && (
                        <div className="text-xs text-[#64748B] truncate max-w-[240px]" title={t.fileName}>
                          {t.fileName}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Processing Status Column */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={t.status} size="xs" />
                  </td>

                  {/* Classification Category Column */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {meta.category ? (
                      <CategoryBadge category={meta.category} size="xs" showConfidence={true} />
                    ) : (
                      <span className="text-xs text-[#94A3B8] italic">—</span>
                    )}
                  </td>

                  {/* Sentiment Column */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {meta.sentiment ? (
                      <SentimentBadge sentiment={meta.sentiment} size="xs" />
                    ) : (
                      <span className="text-xs text-[#94A3B8] italic">—</span>
                    )}
                  </td>

                  {/* Date Column */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#64748B] font-mono">
                    {new Date(t.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>

                  {/* Actions Column */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isRetryable && onRetry && (
                        <button
                          type="button"
                          onClick={() => onRetry(t._id)}
                          className="p-1.5 rounded-lg text-[#D97706] hover:bg-[#FEF3C7] border border-[#FDE68A] transition-colors cursor-pointer"
                          title="Retry analysis"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <Link
                        to={`/transcripts/${t._id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] transition-colors shadow-sm"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>

                      {onDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(t._id, t.title);
                          }}
                          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                          title="Delete transcript"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
