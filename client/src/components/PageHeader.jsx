import React from 'react';

const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-[#101828] tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#344054] leading-relaxed max-w-3xl font-normal">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
