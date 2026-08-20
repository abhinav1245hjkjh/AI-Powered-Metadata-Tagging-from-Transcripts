import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  LayoutDashboard,
  Upload,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Plus
} from 'lucide-react';

const TopNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Upload', path: '/upload', icon: Upload },
    { label: 'Transcripts', path: '/transcripts', icon: FileText },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E4E7EC] h-16 shadow-[0_1px_2px_0_rgba(16,24,40,0.03)]">
      <div className="max-w-[1400px] h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-8">
          {/* Logo & Product Name */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#3157D5] flex items-center justify-center text-white shadow-saas flex-shrink-0 transition-transform group-hover:scale-105">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-[#101828] tracking-tight leading-none">
                MetaMind AI
              </span>
              <span className="text-[10px] text-[#475467] font-semibold tracking-wide mt-1">
                Metadata Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#EEF3FF] text-[#3157D5]'
                        : 'text-[#475467] hover:text-[#101828] hover:bg-[#F9FAFB]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Primary Upload CTA (Desktop) */}
          <Link
            to="/upload"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#3157D5] hover:bg-[#2446B8] text-white text-xs font-semibold shadow-saas transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Transcript</span>
          </Link>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-lg hover:bg-[#F9FAFB] border border-[#E4E7EC] transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-md bg-[#EEF3FF] text-[#3157D5] border border-[#C7D7FE] flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-[#101828] leading-none">
                  {user?.name || 'Evaluator'}
                </span>
                <span className="text-[10px] text-[#475467] truncate max-w-[120px] mt-0.5 font-medium">
                  {user?.email || 'evaluator@cognizant.com'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#475467]" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-[#E4E7EC] shadow-dropdown py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2.5 border-b border-[#EAECF0]">
                  <p className="font-bold text-[#101828]">{user?.name || 'Evaluator'}</p>
                  <p className="text-[11px] text-[#475467] truncate mt-0.5">{user?.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-[#344054] hover:bg-[#F9FAFB] hover:text-[#101828] font-medium transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#475467]" />
                    <span>Settings & Specifications</span>
                  </Link>
                </div>

                <div className="border-t border-[#EAECF0] pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-[#B42318] hover:bg-[#FEF3F2] font-semibold transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4 text-[#B42318]" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#475467] hover:text-[#101828] hover:bg-[#F9FAFB] transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E4E7EC] px-4 pt-2 pb-4 space-y-1 shadow-dropdown animate-in slide-in-from-top-2 duration-150">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#EEF3FF] text-[#3157D5]'
                      : 'text-[#475467] hover:bg-[#F9FAFB] hover:text-[#101828]'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <div className="pt-2">
            <Link
              to="/upload"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#3157D5] text-white text-xs font-semibold shadow-saas"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Transcript</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default TopNavbar;
