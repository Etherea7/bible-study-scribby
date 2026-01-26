import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, History, Settings, BookMarked } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ApiKeySettings } from '../settings/ApiKeySettings';

/**
 * Navbar designed for wooden handle background
 * Uses light/amber colors for contrast against dark wood
 */
export function ScrollNavbar() {
  const [isDark, setIsDark] = useDarkMode();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <div className="flex justify-between items-center h-full px-4 sm:px-8">
        {/* Logo - light colored for dark wood */}
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src="/scribby-logo.png"
            alt="Scribby"
            className="h-8 w-8 sm:h-9 sm:w-9 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-200"
          />
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold text-amber-100 font-serif tracking-tight drop-shadow-sm">
              Scribby
            </span>
            <span className="text-[8px] sm:text-[9px] text-amber-200/70 uppercase tracking-widest -mt-0.5">
              Bible Study
            </span>
          </div>
        </Link>

        {/* Nav items - ghost buttons with light text */}
        <nav className="flex items-center gap-0.5 sm:gap-1">
          <Link
            to="/saved"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-amber-100/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
          >
            <BookMarked className="h-4 w-4" />
            <span className="hidden sm:inline">Saved</span>
          </Link>

          <Link
            to="/history"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-amber-100/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </Link>

          {/* Divider */}
          <div className="w-px h-5 bg-amber-100/20 mx-1 sm:mx-2" />

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Settings"
            className="p-2 text-amber-100/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle dark mode"
            className="p-2 text-amber-100/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-300" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </nav>
      </div>

      {/* Settings Modal */}
      <ApiKeySettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
