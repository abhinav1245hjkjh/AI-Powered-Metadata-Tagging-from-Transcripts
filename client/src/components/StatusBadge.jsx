import React from 'react';

const StatusBadge = ({ status = 'queued', size = 'sm' }) => {
  const normalized = (status || 'queued').toLowerCase();

  const configs = {
    completed: {
      label: 'Completed',
      dotColor: 'bg-[#067647]',
      className: 'bg-[#ECFDF3] text-[#067647] border-[#D1FADF]'
    },
    processing: {
      label: 'Processing',
      dotColor: 'bg-[#B54708] animate-pulse',
      className: 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]'
    },
    queued: {
      label: 'Queued',
      dotColor: 'bg-[#475467]',
      className: 'bg-[#F2F4F7] text-[#344054] border-[#EAECF0]'
    },
    failed: {
      label: 'Failed',
      dotColor: 'bg-[#B42318]',
      className: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]'
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
      className={`inline-flex items-center rounded-md font-semibold border font-mono ${config.className} ${sizeClasses[size] || sizeClasses.sm}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} flex-shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
