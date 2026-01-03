/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'pl-dark': '#37003c',
                'pl-purple': '#37003c',
                'pl-pink': '#ff2882',
                'pl-teal': '#00ff85',
                'pl-blue': '#4700e0', // Placeholder for secondary if needed
                'pl-hover': 'rgba(255, 255, 255, 0.1)',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
