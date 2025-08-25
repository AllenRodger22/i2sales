import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'default' | 'sm';
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'default', className, ...props }) => {
    const baseClasses = 'w-full sm:w-auto inline-flex items-center justify-center rounded-xl font-semibold transition-all backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-apple-blue focus:ring-offset-2 dark:focus:ring-offset-system-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
        primary: 'bg-apple-blue/80 text-white border border-white/20 hover:bg-apple-blue/90 active:bg-apple-blue/70',
        secondary: 'bg-white/20 dark:bg-system-fill-primary/20 text-system-label-primary border border-white/20 hover:bg-white/30 dark:hover:bg-system-fill-secondary/20',
        ghost: 'bg-white/10 text-apple-blue border border-white/20 hover:bg-white/20',
    };

    const sizeClasses = {
        default: 'px-4 py-2 text-sm',
        sm: 'px-2 py-1 text-xs',
    };

    const classes = [
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
    ].filter(Boolean).join(' ');

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    );
};
