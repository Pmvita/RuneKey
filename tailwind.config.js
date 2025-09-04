/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Icy frosty color palette
        ice: {
          50: '#f1f5f9',   // Lightest frost (was 100)
          100: '#e2e8f0',  // Light frost (was 200)
          200: '#cbd5e1',  // Medium frost (was 300)
          300: '#94a3b8',  // Darker frost (was 400)
          400: '#64748b',  // Steel ice (was 500)
          500: '#475569',  // Deep ice (was 600)
          600: '#334155',  // Dark ice (was 700)
          700: '#1e293b',  // Midnight ice (was 800)
          800: '#0f172a',  // Deep freeze (was 900)
          900: '#020617',  // Deepest freeze (new darker shade)
        },
        frost: {
          50: '#f0f9ff',   // Lightest frost blue (was 100)
          100: '#e0f2fe',  // Light frost blue (was 200)
          200: '#bae6fd',  // Medium frost blue (was 300)
          300: '#7dd3fc',  // Bright frost blue (was 400)
          400: '#38bdf8',  // Primary frost (was 500)
          500: '#0ea5e9',  // Deep frost (was 600)
          600: '#0284c7',  // Darker frost (was 700)
          700: '#0369a1',  // Dark frost (was 800)
          800: '#0c4a6e',  // Deepest frost (was 900)
          900: '#082f49',  // Deepest frost (new darker shade)
        },
        glass: {
          white: 'rgba(255, 255, 255, 0.1)',
          light: 'rgba(255, 255, 255, 0.15)',
          medium: 'rgba(255, 255, 255, 0.25)',
          strong: 'rgba(255, 255, 255, 0.35)',
          blue: 'rgba(56, 189, 248, 0.1)',
          'blue-light': 'rgba(56, 189, 248, 0.05)',
          'blue-medium': 'rgba(56, 189, 248, 0.15)',
          dark: 'rgba(0, 0, 0, 0.1)',
          'dark-light': 'rgba(0, 0, 0, 0.05)',
          'dark-medium': 'rgba(0, 0, 0, 0.15)',
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        dark: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        }
      },
      backgroundColor: {
        'glass-white': 'rgba(255, 255, 255, 0.1)',
        'glass-light': 'rgba(255, 255, 255, 0.15)',
        'glass-medium': 'rgba(255, 255, 255, 0.25)',
        'glass-strong': 'rgba(255, 255, 255, 0.35)',
        'glass-blue': 'rgba(56, 189, 248, 0.1)',
        'glass-blue-light': 'rgba(56, 189, 248, 0.05)',
        'glass-blue-medium': 'rgba(56, 189, 248, 0.15)',
        'glass-dark': 'rgba(0, 0, 0, 0.1)',
        'glass-dark-light': 'rgba(0, 0, 0, 0.05)',
        'glass-dark-medium': 'rgba(0, 0, 0, 0.15)',
      },
      borderColor: {
        'glass-white': 'rgba(255, 255, 255, 0.2)',
        'glass-light': 'rgba(255, 255, 255, 0.3)',
        'glass-blue': 'rgba(56, 189, 248, 0.3)',
        'glass-frost': 'rgba(186, 230, 253, 0.4)',
      },
      fontFamily: {
        sans: ['System'],
        mono: ['Courier', 'monospace'],
      },
    },
  },
  plugins: [],
}