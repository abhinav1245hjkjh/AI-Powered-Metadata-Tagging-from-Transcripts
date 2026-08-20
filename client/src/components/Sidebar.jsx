import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  BarChart3,
  Settings,
  Sparkles,
  Cpu,
  ShieldCheck
} from 'lucide-react';

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    badge: null
  },
  {
    to: '/transcripts',
    label: 'Transcripts',
    icon: FileText,
    badge: null
  },
  {
    to: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    badge: null
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings,
    badge: null
  }
];


const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Fixed Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-60 bg-white border-r border-[#E4E7EC] p-4 flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="px-2 pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#3157D5] flex items-center justify-center text-white shadow-saas flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-[#172033] tracking-tight leading-none">
                  MetaMind AI
                </div>
                <div className="text-[10px] text-[#667085] font-medium tracking-tight mt-1">
                  Metadata Intelligence
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1">
            <div className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-[#98A2B3] mb-1.5">
              Workspace
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#EEF3FF] text-[#3157D5]'
                        : 'text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB]'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#F2F4F7] text-[#667085] border border-[#EAECF0]">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] text-xs text-[#667085] space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold text-[#172033]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3157D5]" />
            <span>MetaMind AI</span>
          </div>
          <div className="text-[11px] text-[#667085]">Enterprise Intelligence</div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
