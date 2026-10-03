"use client";

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    // Check local storage or system preference on mount
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      setIsLightMode(true);
      document.documentElement.classList.add('light-mode');
    }
  }, []);

  const toggleTheme = () => {
    if (isLightMode) {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
      setIsLightMode(false);
    } else {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
      setIsLightMode(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center p-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors border border-neutral-700"
      title={isLightMode ? "Switch to Night Mode" : "Switch to Day Mode"}
    >
      {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}
