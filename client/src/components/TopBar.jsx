import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  LogOut,
  Upload,
  User,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

const TopBar = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getBreadcrumbs = () => {
    const p = location.pathname;
    if (p === '/') {
      return [{ label: 'Workspace', path: '/' }, { label: 'Dashboard' }];
    }
    if (p === '/upload') {
      return [{ label: 'Workspace', path: '/' }, { label: 'Upload Transcript' }];
    }
    if (p === '/transcripts') {
      return [{ label: 'Workspace', path: '/' }, { label: 'Transcript Library' }];
    }
    if (p === '/analytics') {
      return [{ label: 'Workspace', path: '/' }, { label: 'Metadata Analytics' }];
    }
    if (p === '/settings') {
      return [{ label: 'Workspace', path: '/' }, { label: 'Settings' }];
    }
    if (p.startsWith('/transcripts/')) {
      return [
        { label: 'Workspace', path: '/' },
        { label: 'Transcripts', path: '/transcripts' },
        { label: 'Intelligence Workspace' }
      ];
    }
    return [{ label: 'Workspace', path: '/' }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E4E7EC] px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Mobile hamburger + Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB] transition-colors"
            aria-label="Toggle navigation"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2 group md:hidden">
            <div className="w-7 h-7 rounded-lg bg-[#3157D5] flex items-center justify-center text-white text-xs shadow-saas">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-[#172033]">MetaMind AI</span>
          </Link>

          {/* Breadcrumbs */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#667085]">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-[#98A2B3]" />}
                  {crumb.path && !isLast ? (
                    <Link
                      to={crumb.path}
                      className="text-[#667085] hover:text-[#172033] font-medium transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-[#172033]">
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Right: Active Service Indicator, Quick Action, Profile Popover */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#ECFDF3] border border-[#D1FADF] text-[#15803D] text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] animate-pulse" />
            <span>NLP Pipeline Online</span>
          </div>

          <a
            href={import.meta.env.VITE_AI_SERVICE_DOCS_URL || "http://localhost:8000/docs"}
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1 text-xs text-[#667085] hover:text-[#172033] transition-colors font-medium px-2.5 py-1.5 rounded-lg border border-[#D0D5DD] hover:bg-[#F9FAFB]"
            title="Open Interactive FastAPI Swagger Documentation"
          >
            <span>API Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <Link
            to="/upload"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3157D5] hover:bg-[#2446B8] text-white text-xs font-semibold shadow-saas transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload</span>
          </Link>

          {/* User Profile Popover */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#E4E7EC] focus:outline-none group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#EEF3FF] border border-[#C7D7FE] text-[#3157D5] flex items-center justify-center font-bold text-xs group-hover:border-[#3157D5] transition-colors">
                  {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-[#172033] truncate max-w-[120px]">
                    {user.name}
                  </div>
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-[#E4E7EC] shadow-dropdown py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2.5 border-b border-[#EAECF0]">
                    <div className="font-bold text-[#172033] truncate">{user.name}</div>
                    <div className="text-xs text-[#667085] truncate mt-0.5">{user.email}</div>
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[#15803D] font-mono">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Authenticated Session</span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full px-3.5 py-2.5 text-left text-xs text-[#B42318] hover:bg-[#FEF3F2] flex items-center gap-2 transition-colors font-semibold cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
