import React from 'react';

const ChartCard = ({ title, subtitle, icon: Icon, action, badge, children, className = '' }) => {
  return (
    <div className={`saas-card p-5 space-y-3 bg-white border border-[#E4E7EC] rounded-xl shadow-saas ${className}`}>
      <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-[#3157D5]" />}
          <div>
            <h3 className="font-bold text-sm text-[#172033]">{title}</h3>
            {subtitle && <p className="text-xs text-[#667085] mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge && <span>{badge}</span>}
          {action && <div>{action}</div>}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default ChartCard;
