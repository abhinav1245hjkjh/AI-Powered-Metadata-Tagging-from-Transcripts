import React from 'react';

const CategoryBadge = ({ category, size = 'sm', showConfidence = true }) => {
  if (!category) return null;

  const label = typeof category === 'string' ? category : category?.label || 'General';
  const confidence = typeof category === 'object' ? category?.confidence : null;
  const normalized = label.toLowerCase().trim();

  const paletteMap = {
    news: 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]',
    meeting: 'bg-[#ECFDF3] text-[#067647] border-[#A6F4C5]',
    interview: 'bg-[#F9F5FF] text-[#6941C6] border-[#E9D7FE]',
    education: 'bg-[#FFF6ED] text-[#B54708] border-[#FEE4E2]',
    entertainment: 'bg-[#FDF2FA] text-[#C11574] border-[#FCCEEE]',
    technology: 'bg-[#EFF8FF] text-[#175CD3] border-[#D1E9FF]',
    finance: 'bg-[#ECFDF3] text-[#067647] border-[#A6F4C5]',
    healthcare: 'bg-[#ECFDF3] text-[#067647] border-[#A6F4C5]',
    legal: 'bg-[#F9F5FF] text-[#5925DC] border-[#E9D7FE]',
    podcast: 'bg-[#FDF2FA] text-[#C11574] border-[#FCCEEE]',
    default: 'bg-[#F2F4F7] text-[#344054] border-[#EAECF0]'
  };

  const badgeStyle = paletteMap[normalized] || paletteMap.default;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[11px] gap-1.5',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-xs sm:text-sm gap-2'
  };

  return (
    <span
      className={`inline-flex items-center rounded-md font-semibold border capitalize ${badgeStyle} ${sizeClasses[size] || sizeClasses.sm}`}
    >
      <span>{label}</span>
      {showConfidence && confidence !== null && confidence !== undefined && (
        <span className="opacity-75 text-[10px] font-mono lowercase tracking-normal pl-0.5">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </span>
  );
};

export default CategoryBadge;
