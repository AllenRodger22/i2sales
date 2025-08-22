import React, { useState, useEffect } from 'react';

// Define keyframe animations in a style tag to be injected into the head
const styles = `
@keyframes spin {
    to { transform: rotate(360deg); }
}
@keyframes draw-check {
    0% {
        stroke-dashoffset: 30;
    }
    100% {
        stroke-dashoffset: 0;
    }
}
@keyframes blink-green-anim {
    0%, 100% { background-color: rgba(48, 209, 88, 0.15); } /* apple-green/15 */
    50% { background-color: rgba(48, 209, 88, 0.4); }
}
.animate-blink-green {
    animation: blink-green-anim 1s ease-in-out;
}
`;

type ButtonState = 'idle' | 'loading' | 'success';

interface AnimatedCheckButtonProps {
    onClick: () => Promise<void> | void;
    initialState?: ButtonState;
}

export const AnimatedCheckButton: React.FC<AnimatedCheckButtonProps> = ({ onClick, initialState = 'idle' }) => {
    const [state, setState] = useState<ButtonState>(initialState);
    const [isBlinking, setIsBlinking] = useState(false);

    useEffect(() => {
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);
        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);

    const handleClick = async () => {
        if (state !== 'idle') return;

        setState('loading');
        try {
            await onClick();
            setIsBlinking(true); // Trigger animation on transition
            setState('success');
        } catch (error) {
            console.error("Action failed:", error);
            setState('idle'); // Revert on failure
        }
    };
    
    const isDisabled = state !== 'idle';

    const renderContent = () => {
        switch (state) {
            case 'loading':
                return (
                    <div
                        className="w-4 h-4 border-2 border-system-label-tertiary border-t-transparent rounded-full"
                        style={{ animation: 'spin 1s linear infinite' }}
                    ></div>
                );
            case 'success':
                return (
                    <svg className="w-5 h-5 text-apple-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path
                            d="M20 6L9 17l-5-5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                                strokeDasharray: 30,
                                strokeDashoffset: 30,
                                animation: 'draw-check 0.4s ease-out forwards',
                            }}
                        />
                    </svg>
                );
            case 'idle':
            default:
                return <span className="text-xs font-semibold">Feito</span>;
        }
    };

    const getButtonClasses = () => {
        const base = "h-8 w-16 flex items-center justify-center rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-apple-blue focus:ring-offset-2 dark:focus:ring-offset-system-bg-secondary";
        if (state === 'success') {
            const animationClass = isBlinking ? 'animate-blink-green' : '';
            return `${base} bg-apple-green/15 ${animationClass}`;
        }
        if (isDisabled) {
            return `${base} bg-system-fill-primary cursor-not-allowed`;
        }
        return `${base} bg-apple-blue/10 text-apple-blue hover:bg-apple-blue/20 active:scale-95`;
    };

    return (
        <button
            onClick={handleClick}
            disabled={isDisabled}
            className={getButtonClasses()}
            aria-live="polite"
        >
            {renderContent()}
        </button>
    );
};
