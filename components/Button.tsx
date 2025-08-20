import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-apple-blue focus:ring-offset-2 dark:focus:ring-offset-system-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
        primary: 'bg-apple-blue text-white hover:brightness-110 active:brightness-90',
        secondary: 'bg-system-fill-primary text-system-label-primary hover:bg-system-fill-secondary active:brightness-95 dark:active:brightness-105',
        ghost: 'text-apple-blue hover:bg-apple-blue/10 active:bg-apple-blue/20',
    };

    return (
        <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};