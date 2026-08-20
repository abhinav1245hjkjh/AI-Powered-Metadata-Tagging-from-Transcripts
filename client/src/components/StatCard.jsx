import React from 'react';

const StatCard = ({
  icon: Icon,
  label,
  value,
  description
}) => {
  return (
    <div className="saas-card p-5 flex flex-col justify-between space-y-3 transition-all hover:border-[#D0D5DD] hover:shadow-card bg-white border border-[#E4E7EC] shadow-saas">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#475467]">
          {label}
        </span>
        <div className="w-8 h-8 rounded-lg bg-[#EEF3FF] text-[#3157D5] border border-[#E0EAFF] flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <div className="text-2xl font-bold font-mono text-[#101828] tracking-tight tabular-nums">
          {value !== undefined && value !== null ? value.toLocaleString() : '0'}
        </div>
        {description && (
          <p className="text-xs text-[#344054] mt-1 leading-snug">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
