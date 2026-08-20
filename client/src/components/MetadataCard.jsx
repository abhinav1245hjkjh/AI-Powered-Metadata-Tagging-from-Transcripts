import React from 'react';

const MetadataCard = ({ title, subtitle, icon: Icon, badge, action, children, className = '' }) => {
  return (
    <div className={`saas-card p-5 flex flex-col justify-between bg-white border border-[#E4E7EC] rounded-xl shadow-saas ${className}`}>
      <div>
        <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-[#EAECF0]">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="p-1.5 rounded-lg bg-[#EEF3FF] border border-[#E0EAFF] text-[#3157D5]">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-sm text-[#172033]">{title}</h3>
              {subtitle && <p className="text-xs text-[#667085] mt-0.5">{subtitle}</p>}
            </div>
            {badge && <span className="ml-1.5">{badge}</span>}
          </div>
          {action && <div>{action}</div>}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default MetadataCard;
