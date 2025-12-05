import React from 'react';
import styles from './Input.module.css'; // Reuse input styles for consistency

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, error, className = '', id, ...props }) => {
    const inputId = id || props.name;

    return (
        <div className={`${styles.container} ${className}`}>
            {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
            <textarea
                id={inputId}
                className={`${styles.input} ${error ? styles.hasError : ''}`}
                style={{ height: 'auto', minHeight: '100px', padding: '0.75rem' }}
                {...props}
            />
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
};

export default Textarea;
