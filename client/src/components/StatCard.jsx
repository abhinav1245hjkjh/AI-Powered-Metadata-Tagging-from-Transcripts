import React from 'react';

const StatCard = ({
  icon: Icon,
  label,
  value,
  description
}) => {
  return (
    <div className="saas-card p-5 flex flex-col justify-between space-y-3 transition-all hover:border-[#BFDBFE] hover:shadow-card bg-white border border-[#DCE5F2] shadow-saas rounded-2xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
          {label}
        </span>
        <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <div className="text-2xl font-bold font-mono text-[#0F172A] tracking-tight tabular-nums">
          {value !== undefined && value !== null ? value.toLocaleString() : '0'}
        </div>
        {description && (
          <p className="text-xs text-[#64748B] mt-1 leading-snug">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
