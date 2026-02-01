/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                display: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                primary: '#4F46E5',
                accent: '#FF6B00',
                secondary: '#10B981',
                navy: {
                    DEFAULT: '#0F172A',
                    900: '#0F172A',
                    950: '#0B1120',
                },
                emerald: {
                    400: '#34D399',
                    500: '#10B981',
                },
                orange: {
                    500: '#FF6B00',
                }
            },
            borderRadius: {
                '3xl': '3rem'
            }
        },
    },
    plugins: [],
}
