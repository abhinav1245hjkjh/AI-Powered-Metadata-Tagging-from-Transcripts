import React from 'react';

const labelStyles = {
  PERSON: {
    bg: 'bg-[#EFF6FF]',
    border: 'border-[#93C5FD]',
    text: 'text-[#1E3A8A]',
    badge: 'bg-[#DBEAFE] text-[#1E3A8A]'
  },
  ORGANIZATION: {
    bg: 'bg-[#F5F3FF]',
    border: 'border-[#DDD6FE]',
    text: 'text-[#4C1D95]',
    badge: 'bg-[#EDE9FE] text-[#4C1D95]'
  },
  ORG: {
    bg: 'bg-[#F5F3FF]',
    border: 'border-[#DDD6FE]',
    text: 'text-[#4C1D95]',
    badge: 'bg-[#EDE9FE] text-[#4C1D95]'
  },
  LOCATION: {
    bg: 'bg-[#F0FDF4]',
    border: 'border-[#BBF7D0]',
    text: 'text-[#166534]',
    badge: 'bg-[#DCFCE7] text-[#166534]'
  },
  LOC: {
    bg: 'bg-[#F0FDF4]',
    border: 'border-[#BBF7D0]',
    text: 'text-[#166534]',
    badge: 'bg-[#DCFCE7] text-[#166534]'
  },
  GPE: {
    bg: 'bg-[#F0FDF4]',
    border: 'border-[#BBF7D0]',
    text: 'text-[#166534]',
    badge: 'bg-[#DCFCE7] text-[#166534]'
  },
  FAC: {
    bg: 'bg-[#F0FDF4]',
    border: 'border-[#BBF7D0]',
    text: 'text-[#166534]',
    badge: 'bg-[#DCFCE7] text-[#166534]'
  },
  DATE: {
    bg: 'bg-[#FFF6ED]',
    border: 'border-[#FEE4E2]',
    text: 'text-[#B54708]',
    badge: 'bg-[#FEE4E2] text-[#B54708]'
  },
  TIME: {
    bg: 'bg-[#FFF6ED]',
    border: 'border-[#FEE4E2]',
    text: 'text-[#B54708]',
    badge: 'bg-[#FEE4E2] text-[#B54708]'
  },
  PRODUCT: {
    bg: 'bg-[#FDF2FA]',
    border: 'border-[#FCCEEE]',
    text: 'text-[#C11574]',
    badge: 'bg-[#FCCEEE] text-[#C11574]'
  },
  PEOPLE: {
    bg: 'bg-[#EFF6FF]',
    border: 'border-[#93C5FD]',
    text: 'text-[#1E3A8A]',
    badge: 'bg-[#DBEAFE] text-[#1E3A8A]'
  },
  ORGANIZATIONS: {
    bg: 'bg-[#F5F3FF]',
    border: 'border-[#DDD6FE]',
    text: 'text-[#4C1D95]',
    badge: 'bg-[#EDE9FE] text-[#4C1D95]'
  },
  LOCATIONS: {
    bg: 'bg-[#F0FDF4]',
    border: 'border-[#BBF7D0]',
    text: 'text-[#166534]',
    badge: 'bg-[#DCFCE7] text-[#166534]'
  },
  DATES_TIMES: {
    bg: 'bg-[#FFF6ED]',
    border: 'border-[#FEE4E2]',
    text: 'text-[#B54708]',
    badge: 'bg-[#FEE4E2] text-[#B54708]'
  },
  PRODUCTS_EVENTS: {
    bg: 'bg-[#FDF2FA]',
    border: 'border-[#FCCEEE]',
    text: 'text-[#C11574]',
    badge: 'bg-[#FCCEEE] text-[#C11574]'
  },
  DEFAULT: {
    bg: 'bg-[#F2F4F7]',
    border: 'border-[#EAECF0]',
    text: 'text-[#344054]',
    badge: 'bg-[#E4E7EC] text-[#344054]'
  }
};

const normalizeLabel = (label) => {
  const upper = (label || 'OTHER').toUpperCase();
  if (upper === 'ORG' || upper === 'ORGANIZATIONS') return 'ORGANIZATION';
  if (upper === 'GPE' || upper === 'LOC' || upper === 'LOCATIONS') return 'LOCATION';
  if (upper === 'PEOPLE') return 'PERSON';
  return upper;
};


export const EntityChip = ({ text, label, count }) => {
  const cleanLabel = (label || 'OTHER').toUpperCase();
  const normLabel = normalizeLabel(cleanLabel);
  const style = labelStyles[cleanLabel] || labelStyles[normLabel] || labelStyles.DEFAULT;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${style.bg} ${style.border} ${style.text} text-xs font-semibold transition-colors shadow-saas`}
    >
      <span className="font-bold">{text}</span>
      <span className={`text-[10px] uppercase font-mono px-1 py-0.5 rounded font-bold ${style.badge}`}>
        {normLabel}
      </span>
      {count !== undefined && count > 1 && (
        <span className="text-[10px] font-mono text-[#344054] pl-0.5 font-bold">
          ×{count}
        </span>
      )}
    </span>
  );
};

export default EntityChip;
