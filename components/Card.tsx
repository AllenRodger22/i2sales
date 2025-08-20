import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
    return (
        <div className={`bg-system-bg-primary rounded-2xl shadow-soft dark:shadow-soft-dark p-5 sm:p-6 ${className}`} {...props}>
            {children}
        </div>
    );
};