import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';

const statusConfig = {
  completed: {
    label: 'Completed',
    dot: 'bg-[#15803D]',
    bg: 'bg-[#ECFDF3]',
    border: 'border-[#D1FADF]',
    text: 'text-[#15803D]',
    icon: CheckCircle2
  },
  processing: {
    label: 'Processing',
    dot: 'bg-[#B54708] animate-pulse',
    bg: 'bg-[#FFFAEB]',
    border: 'border-[#FEDF89]',
    text: 'text-[#B54708]',
    icon: Loader2
  },
  queued: {
    label: 'Queued',
    dot: 'bg-[#475467]',
    bg: 'bg-[#F2F4F7]',
    border: 'border-[#EAECF0]',
    text: 'text-[#475467]',
    icon: Clock
  },
  failed: {
    label: 'Failed',
    dot: 'bg-[#B42318]',
    bg: 'bg-[#FEF3F2]',
    border: 'border-[#FECDCA]',
    text: 'text-[#B42318]',
    icon: AlertCircle
  },
  temporarily_rate_limited: {
    label: 'Rate Limited',
    dot: 'bg-[#D97706] animate-pulse',
    bg: 'bg-[#FEF3C7]',
    border: 'border-[#FDE68A]',
    text: 'text-[#D97706]',
    icon: Clock
  }
};

const Badge = ({ status = 'queued', size = 'sm', showIcon = false }) => {
  const config = statusConfig[status.toLowerCase()] || statusConfig.queued;
  const IconComponent = config.icon;

  const sizeClasses = size === 'xs'
    ? 'px-2 py-0.5 text-[11px]'
    : size === 'md'
    ? 'px-3 py-1 text-xs font-semibold'
    : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${config.bg} ${config.border} ${config.text} ${sizeClasses}`}
    >
      {showIcon ? (
        <IconComponent className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      )}
      <span>{config.label}</span>
    </span>
  );
};

export default Badge;
