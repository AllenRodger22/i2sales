import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

export const useTheme = () => {
    const [theme, setTheme] = useState<Theme>('light');

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as Theme | null;
        // Default to 'light' theme to ensure consistency across devices, ignoring system preference.
        const initialTheme = storedTheme || 'light';
        setTheme(initialTheme);
    }, []);

    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    }, []);

    return { theme, toggleTheme };
};