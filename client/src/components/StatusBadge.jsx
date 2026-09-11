import React from 'react';

const StatusBadge = ({ status = 'queued', size = 'sm' }) => {
  const normalized = (status || 'queued').toLowerCase();

  const configs = {
    completed: {
      label: 'Completed',
      dotColor: 'bg-[#16A34A]',
      className: 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'
    },
    processing: {
      label: 'Processing',
      dotColor: 'bg-[#2563EB] animate-pulse',
      className: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
    },
    queued: {
      label: 'Queued',
      dotColor: 'bg-[#64748B]',
      className: 'bg-[#F1F5F9] text-[#475467] border-[#E2E8F0]'
    },
    failed: {
      label: 'Failed',
      dotColor: 'bg-[#DC2626]',
      className: 'bg-[#FEF2F2] text-[#B42318] border-[#FCA5A5]'
    },
    temporarily_rate_limited: {
      label: 'Rate Limited',
      dotColor: 'bg-[#D97706] animate-pulse',
      className: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
    }
  };

  const config = configs[normalized] || configs.queued;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[11px] gap-1.5',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-xs sm:text-sm gap-2'
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg font-semibold border font-mono ${config.className} ${sizeClasses[size] || sizeClasses.sm}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} flex-shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
