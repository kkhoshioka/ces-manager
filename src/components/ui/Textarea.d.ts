import React from 'react';
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}
declare const Textarea: React.FC<TextareaProps>;
export default Textarea;
