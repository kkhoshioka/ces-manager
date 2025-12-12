import React, { useState, useEffect } from 'react';
import type { FocusEvent, ChangeEvent } from 'react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value: number | string;
    onChange: (value: string) => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, onFocus, onBlur, ...props }) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Sync internal state with external value prop
    useEffect(() => {
        if (isFocused) return; // Don't interrupt typing

        let newVal = '';
        if (value === '' || value === undefined || value === null) {
            newVal = '';
        } else {
            const numVal = Number(value);
            if (!isNaN(numVal)) {
                newVal = numVal.toLocaleString();
            } else {
                newVal = String(value);
            }
        }

        // Only update if different to avoid cycles
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDisplayValue(prev => prev !== newVal ? newVal : prev);
    }, [value, isFocused]);

    const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        // On focus, show raw value (remove commas)
        const rawValue = String(value).replace(/,/g, '');
        setDisplayValue(rawValue);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        // On blur, format value
        const numVal = Number(displayValue.replace(/,/g, ''));
        if (!isNaN(numVal) && displayValue !== '') {
            setDisplayValue(numVal.toLocaleString());
        }
        if (onBlur) onBlur(e);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        // Allow only numbers and typical input characters (optional validation could go here)
        setDisplayValue(newVal);
        onChange(newVal);
    };

    return (
        <input
            {...props}
            type="text" // Always text to allow commas
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
        />
    );
};
