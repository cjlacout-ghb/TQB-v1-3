import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#8B5CF6",
                    50: "#F5F3FF",
                    100: "#EDE9FE",
                    200: "#DDD6FE",
                    300: "#C4B5FD",
                    400: "#A78BFA",
                    500: "#8B5CF6",
                    600: "#7C3AED",
                    700: "#6D28D9",
                    800: "#5B21B6",
                    900: "#4C1D95",
                },
                success: {
                    DEFAULT: "#10B981",
                    400: "#34D399",
                    500: "#10B981",
                    600: "#059669",
                },
                warning: {
                    DEFAULT: "#F59E0B",
                    400: "#FBBF24",
                    500: "#F59E0B",
                    600: "#D97706",
                },
                error: {
                    DEFAULT: "#EF4444",
                    400: "#F87171",
                    500: "#EF4444",
                    600: "#DC2626",
                },
                dark: {
                    900: "#0F0F23",
                    800: "#1A1A2E",
                    700: "#25253D",
                    600: "#2D2D4A",
                    500: "#374151",
                },
            },
            fontFamily: {
                sans: ["Lato", "Inter", "system-ui", "sans-serif"],
                mono: ["Consolas", "'Courier New'", "monospace"],
            },
            backgroundImage: {
                "gradient-dark": "linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #2D1B4E 100%)",
                "gradient-radial": "radial-gradient(ellipse at center, var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
} satisfies Config;
