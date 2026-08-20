import React from 'react';

export const TextSkeleton = ({ className = 'h-4 w-full', count = 1 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton-shimmer rounded-md ${className}`}
        />
      ))}
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="saas-card p-5 space-y-3 bg-white border border-[#E4E7EC] rounded-xl shadow-saas">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 skeleton-shimmer rounded" />
        <div className="h-4 w-4 skeleton-shimmer rounded" />
      </div>
      <div className="h-7 w-16 skeleton-shimmer rounded mt-2" />
      <div className="h-2.5 w-32 skeleton-shimmer rounded" />
    </div>
  );
};

export const TableRowSkeleton = ({ rows = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-[#EAECF0]">
          <td className="px-4 py-3.5">
            <div className="space-y-1.5">
              <div className="h-4 w-48 skeleton-shimmer rounded" />
              <div className="h-3 w-28 skeleton-shimmer rounded" />
            </div>
          </td>
          <td className="px-4 py-3.5">
            <div className="h-5 w-20 skeleton-shimmer rounded-full" />
          </td>
          <td className="px-4 py-3.5">
            <div className="h-5 w-24 skeleton-shimmer rounded-full" />
          </td>
          <td className="px-4 py-3.5">
            <div className="h-4 w-16 skeleton-shimmer rounded" />
          </td>
          <td className="px-4 py-3.5">
            <div className="h-3.5 w-24 skeleton-shimmer rounded" />
          </td>
          <td className="px-4 py-3.5 text-right">
            <div className="h-6 w-16 skeleton-shimmer rounded ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
};

export const ChartSkeleton = ({ height = 'h-56' }) => {
  return (
    <div className={`w-full ${height} skeleton-shimmer rounded-xl bg-white border border-[#E4E7EC] shadow-saas`} />
  );
};

export const DetailHeaderSkeleton = () => {
  return (
    <div className="saas-card p-6 space-y-4 bg-white border border-[#E4E7EC] rounded-xl shadow-saas">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-20 skeleton-shimmer rounded-full" />
            <div className="h-4 w-24 skeleton-shimmer rounded-full" />
          </div>
          <div className="h-7 w-64 skeleton-shimmer rounded" />
          <div className="h-3.5 w-40 skeleton-shimmer rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-12 w-16 skeleton-shimmer rounded-lg" />
          <div className="h-12 w-16 skeleton-shimmer rounded-lg" />
          <div className="h-12 w-16 skeleton-shimmer rounded-lg" />
          <div className="h-12 w-16 skeleton-shimmer rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default {
  TextSkeleton,
  CardSkeleton,
  TableRowSkeleton,
  ChartSkeleton,
  DetailHeaderSkeleton
};
