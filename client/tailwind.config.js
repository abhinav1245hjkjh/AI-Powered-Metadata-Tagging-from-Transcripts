/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#F4F7FC',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F8FAFC',
          blue: '#EEF4FF',
          light: '#EAF2FF',
          soft: '#DCE9FF',
        },
        border: {
          DEFAULT: '#DCE5F2',
          primary: '#DCE5F2',
          secondary: '#CBD5E1',
          subtle: '#E2E8F0',
        },
        text: {
          primary: '#0F172A',
          secondary: '#64748B',
          muted: '#94A3B8',
          dark: '#0F172A',
          navy: '#0F172A',
          body: '#334155',
          label: '#475467',
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB', // Primary brand color
          600: '#1D4ED8', // Hover / darker brand
          700: '#1E40AF',
          800: '#1E3A8A',
          900: '#172554',
        },
        semantic: {
          success: {
            DEFAULT: '#16A34A',
            bg: '#DCFCE7',
            border: '#BBF7D0',
          },
          warning: {
            DEFAULT: '#D97706',
            bg: '#FEF3C7',
            border: '#FDE68A',
          },
          error: {
            DEFAULT: '#DC2626',
            bg: '#FEF2F2',
            border: '#FCA5A5',
          },
          info: {
            DEFAULT: '#2563EB',
            bg: '#EFF6FF',
            border: '#BFDBFE',
          },
          neutral: {
            DEFAULT: '#475467',
            bg: '#F1F5F9',
            border: '#E2E8F0',
          },
          accent: {
            DEFAULT: '#14B8A6',
            bg: '#CCFBF1',
            border: '#99F6E4',
          }
        }
      },
      boxShadow: {
        'saas': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 4px 12px 0 rgba(37, 99, 235, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
        'dropdown': '0 4px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -2px rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
        'badge': '6px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
