/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--color-background)",
                surface: "var(--color-surface)",
                primary: "var(--color-primary)",
                secondary: "var(--color-secondary)",
                text: {
                    main: "var(--color-text-main)",
                    muted: "var(--color-text-muted)"
                },
                border: "var(--color-border)"
            }
        },
    },
    plugins: [],
}
