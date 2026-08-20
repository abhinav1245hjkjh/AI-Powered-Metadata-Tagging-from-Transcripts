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
      <div className="saas-card overflow-hidden bg-white border border-[#E4E7EC] shadow-saas">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#EAECF0] text-xs font-bold text-[#475467]">
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
      <div className="saas-card p-8 bg-white border border-[#E4E7EC] shadow-saas">
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
    <div className="saas-card overflow-hidden bg-white border border-[#E4E7EC] shadow-saas">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F9FAFB] border-b border-[#EAECF0] text-xs font-bold text-[#475467]">
              <th className="py-3 px-4">Transcript Title</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Sentiment</th>
              <th className="py-3 px-4">Created Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAECF0]">
            {transcripts.map((t) => {
              const meta = t.metadata || {};
              const isFailed = t.status === 'failed';

              return (
                <tr
                  key={t._id}
                  className="hover:bg-[#F9FAFB] transition-colors group text-sm"
                >
                  {/* Title & Filename Column */}
                  <td className="py-3.5 px-4 max-w-[280px]">
                    <div className="space-y-0.5">
                      <Link
                        to={`/transcripts/${t._id}`}
                        className="font-bold text-[#101828] hover:text-[#3157D5] transition-colors line-clamp-1 block"
                        title={t.title}
                      >
                        {t.title}
                      </Link>
                      {t.fileName && (
                        <div className="text-xs text-[#475467] truncate max-w-[240px]" title={t.fileName}>
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
                      <span className="text-xs text-[#667085] italic">—</span>
                    )}
                  </td>

                  {/* Sentiment Column */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {meta.sentiment ? (
                      <SentimentBadge sentiment={meta.sentiment} size="xs" />
                    ) : (
                      <span className="text-xs text-[#667085] italic">—</span>
                    )}
                  </td>

                  {/* Date Column */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#344054] font-mono">
                    {new Date(t.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>

                  {/* Actions Column */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isFailed && onRetry && (
                        <button
                          type="button"
                          onClick={() => onRetry(t._id)}
                          className="p-1.5 rounded-lg text-[#B54708] hover:bg-[#FFFAEB] border border-[#FEDF89] transition-colors cursor-pointer"
                          title="Retry analysis"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <Link
                        to={`/transcripts/${t._id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#3157D5] bg-[#EEF3FF] hover:bg-[#E0EAFF] border border-[#C7D7FE] transition-colors shadow-saas"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>

                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(t._id, t.title)}
                          className="p-1.5 rounded-lg text-[#667085] hover:text-[#B42318] hover:bg-[#FEF3F2] transition-colors cursor-pointer"
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
