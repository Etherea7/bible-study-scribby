import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, History, BookOpen, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ApiKeySettings } from '../settings/ApiKeySettings';

export function Header() {
  const [isDark, setIsDark] = useDarkMode();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-surface)]/90 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 rounded-lg bg-[var(--color-observation)]/10 group-hover:bg-[var(--color-observation)]/20 transition-colors">
              <BookOpen className="h-5 w-5 text-[var(--color-observation)]" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[var(--text-primary)] font-serif tracking-tight">
                Scribby
              </span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest -mt-1">
                Bible Study
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <Link to="/history">
              <Button variant="ghost" size="sm">
                <History className="h-4 w-4 mr-1.5" />
                History
              </Button>
            </Link>

            <div className="w-px h-6 bg-[var(--border-color)] mx-2" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="API Key Settings"
              className="!p-2"
            >
              <Settings className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDark(!isDark)}
              aria-label="Toggle dark mode"
              className="!p-2"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-[var(--color-accent)]" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </nav>
        </div>
      </div>

      {/* API Key Settings Modal */}
      <ApiKeySettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </header>
  );
}
