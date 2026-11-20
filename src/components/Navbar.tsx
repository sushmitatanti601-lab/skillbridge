import React, { useState } from 'react';
import { Menu, Scale, X } from 'lucide-react';

export type ActiveTab = 'home' | 'explore' | 'compare' | 'ai' | 'profile';

interface NavbarProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  compareCount: number;
}

const NAV_ITEMS: { id: ActiveTab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'explore', label: 'Explore' },
  { id: 'compare', label: 'Compare' },
  { id: 'ai', label: 'AI Assistant' },
  { id: 'profile', label: 'Profile' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigate,
  compareCount,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelect = (tab: ActiveTab) => {
    onNavigate(tab);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 rounded-md"
        >
          <span className="w-8 h-8 rounded-lg bg-[#4C1D95] text-white flex items-center justify-center shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 17h16" />
              <path d="M5 17a7 7 0 0 1 14 0" />
              <path d="M12 6v4" />
            </svg>
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-slate-950 whitespace-nowrap shrink-0">
            SkillBridge
          </span>
        </button>

        {/* Zone 2: Clean single-line text nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 rounded-sm ${
                  isActive
                    ? 'text-[#4C1D95]'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-[#4C1D95]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleSelect('compare')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#4C1D95] hover:bg-[#3B0764] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-700"
          >
            <Scale className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Compare</span>
            <span className="font-mono tabular-nums text-violet-200">
              ({compareCount})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center justify-between ${
                  isActive
                    ? 'bg-[#F5F3FF] text-[#4C1D95]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{item.label}</span>
                {item.id === 'compare' && (
                  <span className="font-mono text-xs tabular-nums text-slate-500">
                    {compareCount} selected
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
};
