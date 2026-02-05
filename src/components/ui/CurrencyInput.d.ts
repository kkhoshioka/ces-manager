import React from 'react';
interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value: number | string;
    onChange: (value: string) => void;
}
export declare const CurrencyInput: React.FC<CurrencyInputProps>;
export {};
