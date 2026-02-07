import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from './Icons';

const ThemeSwitcher: React.FC = () => {
  const { themeName, setTheme, isLoading } = useTheme();

  const toggleTheme = () => {
    const newTheme = themeName === 'standard' ? 'dark' : 'standard';
    setTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      disabled={isLoading}
      className="group relative p-2.5 bg-slate-900/40 rounded-lg border border-white/5 backdrop-blur-md transition-all hover:bg-slate-900/60 disabled:opacity-50"
      title={themeName === 'standard' ? 'Przełącz na Dark Mode' : 'Przełącz na Standard'}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon (Standard) */}
        <div
          className={`absolute inset-0 transition-all duration-300 ${
            themeName === 'standard'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-90 scale-0'
          }`}
        >
          <SunIcon className="w-5 h-5 text-amber-400" />
        </div>
        
        {/* Moon Icon (Dark) */}
        <div
          className={`absolute inset-0 transition-all duration-300 ${
            themeName === 'dark'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-0'
          }`}
        >
          <MoonIcon className="w-5 h-5 text-cyan-400" />
        </div>
      </div>
    </button>
  );
};

export default ThemeSwitcher;
