import React from 'react';

interface LogoImageProps {
    className?: string;
}

export const LogoImage: React.FC<LogoImageProps> = ({ className }) => {
    return (
        <img 
            src="/assets/logo.png" 
            alt="i2Sales logo" 
            className={className} 
        />
    );
};
