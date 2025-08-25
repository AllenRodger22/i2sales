import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
    return (
        <div
            className={`w-full bg-white/30 dark:bg-system-bg-primary/30 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl shadow-soft dark:shadow-soft-dark p-4 sm:p-6 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};