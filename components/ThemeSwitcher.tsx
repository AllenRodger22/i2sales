import React from 'react';
import type { Theme } from '../hooks/useTheme';
import { Icon } from './Icon';

interface ThemeSwitcherProps {
    theme: Theme;
    toggleTheme: () => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, toggleTheme }) => {
    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-system-label-secondary bg-system-fill-primary hover:bg-system-fill-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-apple-blue"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? (
                <Icon name="moon" className="w-5 h-5" />
            ) : (
                <Icon name="sun" className="w-5 h-5" />
            )}
        </button>
    );
};