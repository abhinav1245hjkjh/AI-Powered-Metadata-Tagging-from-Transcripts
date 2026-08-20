import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Plus } from 'lucide-react';

const EmptyState = ({
  title = 'No Data Found',
  description = 'There are currently no items to display.',
  icon: Icon = Inbox,
  actionLink,
  actionText = 'Get Started',
  onActionClick
}) => {
  return (
    <div className="py-12 px-4 text-center max-w-md mx-auto space-y-3">
      <div className="w-10 h-10 mx-auto rounded-lg bg-[#EEF3FF] border border-[#E0EAFF] text-[#3157D5] flex items-center justify-center shadow-saas">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-[#172033]">{title}</h3>
        <p className="text-xs text-[#667085] mt-1 leading-relaxed">{description}</p>
      </div>

      {(actionLink || onActionClick) && (
        <div className="pt-2">
          {actionLink ? (
            <Link
              to={actionLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#3157D5] hover:bg-[#2446B8] text-white text-xs font-semibold shadow-saas transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{actionText}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onActionClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#3157D5] hover:bg-[#2446B8] text-white text-xs font-semibold shadow-saas transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{actionText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
