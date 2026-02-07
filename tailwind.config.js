/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./index.tsx",
        "./App.tsx",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                theme: {
                    primary: 'var(--theme-primary)',
                    secondary: 'var(--theme-secondary)',
                    accent: 'var(--theme-accent)',
                    bg: {
                        dark: 'var(--theme-bg-dark)',
                        darker: 'var(--theme-bg-darker)',
                        light: 'var(--theme-bg-light)',
                    },
                    text: {
                        primary: 'var(--theme-text-primary)',
                        secondary: 'var(--theme-text-secondary)',
                    },
                    border: {
                        default: 'var(--theme-border-default)',
                    },
                    andromeda: {
                        bg: 'var(--theme-andromeda-bg)',
                        sidebar: 'var(--theme-andromeda-sidebar)',
                        header: 'var(--theme-andromeda-header)',
                    }
                }
            }
        },
    },
    plugins: [
        require("tailwindcss-animate"),
    ],
}
