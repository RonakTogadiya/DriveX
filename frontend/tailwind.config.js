/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // ── Minimal Clean Color Palette ──────────────────────────────
            colors: {
                'void': '#F8FAFC', // Page background – off-white
                'matte': '#FFFFFF', // Card background – white
                'surface': '#F1F5F9', // Slightly elevated / input bg
                'neon': '#10B981', // Primary accent – emerald green
                'nebula': '#7C3AED', // Secondary accent – violet
                'laser': '#EF4444', // Error / danger – red
                'starlight': '#0F172A', // Primary text – near-black
                'dim': '#64748B', // Muted / subtext – slate
            },
            // ── Font Families ────────────────────────────────────────────
            fontFamily: {
                'orbitron': ['Inter', 'sans-serif'], // remap orbitron → Inter
                'rajdhani': ['Inter', 'sans-serif'], // remap rajdhani → Inter
                'inter': ['Inter', 'sans-serif'],
                'mono': ['ui-monospace', 'SFMono-Regular', 'monospace'],
            },
            // ── Subtle Shadows (no glow) ─────────────────────────────────
            boxShadow: {
                'neon-sm': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
                'neon-md': '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
                'neon-lg': '0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.05)',
                'nebula-sm': '0 1px 3px rgba(0,0,0,0.08)',
                'nebula-md': '0 4px 6px rgba(0,0,0,0.07)',
            },
            // ── Animations (kept but subtle) ─────────────────────────────
            keyframes: {
                'float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-6px)' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% center' },
                    '100%': { backgroundPosition: '200% center' },
                },
            },
            animation: {
                'float': 'float 4s ease-in-out infinite',
                'float-slow': 'float 6s ease-in-out infinite',
                'pulse-neon': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            backgroundImage: {
                'neon-grad': 'linear-gradient(135deg, #10B981, #7C3AED)',
                'card-grad': 'linear-gradient(180deg, rgba(124,58,237,0.04) 0%, transparent 100%)',
                'hero-grad': 'radial-gradient(ellipse at top, rgba(16,185,129,0.06) 0%, transparent 70%)',
            },
        },
    },
    plugins: [],
};
