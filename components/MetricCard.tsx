import React, { useState, useEffect, useRef } from 'react';
import type { Metric } from '../types';
import { Card } from './Card';

interface MetricCardProps {
    metric: Metric;
    onUpdate: (value: number) => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(metric.value.toString());
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setValue(metric.value.toString());
    }, [metric.value]);
    
    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0) {
            onUpdate(numValue);
        } else {
            setValue(metric.value.toString()); // Revert if invalid
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setValue(metric.value.toString());
            setIsEditing(false);
        }
    };

    return (
        <Card className="text-center">
            <h3 className="text-sm font-semibold text-apple-gray-600 dark:text-apple-gray-400">{metric.label}</h3>
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="mt-1 text-3xl font-bold text-apple-gray-900 dark:text-apple-gray-100 w-full text-center bg-apple-gray-200 dark:bg-apple-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue"
                />
            ) : (
                <p 
                    onClick={() => setIsEditing(true)} 
                    className="mt-1 text-3xl font-bold text-apple-gray-900 dark:text-apple-gray-100 cursor-pointer rounded-lg hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700/50"
                    title="Clique para editar"
                >
                    {metric.value}
                </p>
            )}
        </Card>
    );
};