/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#F6F7F9',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F9FAFB',
        },
        border: {
          primary: '#E4E7EC',
          secondary: '#D0D5DD',
          subtle: '#EAECF0',
        },
        text: {
          primary: '#101828', // Dark charcoal for strong contrast
          secondary: '#344054', // Readable medium gray for body & secondary info
          muted: '#667085', // Muted gray only for timestamps & low-priority labels
          dark: '#101828',
          body: '#344054',
          label: '#475467',
        },
        brand: {
          50: '#EEF3FF',
          100: '#E0EAFF',
          200: '#C7D7FE',
          300: '#94B3FD',
          400: '#618CFB',
          500: '#3157D5', // Primary brand color
          600: '#2446B8', // Hover / darker brand
          700: '#1E3A8A',
          800: '#192F70',
          900: '#12204E',
        },
        semantic: {
          success: {
            DEFAULT: '#067647',
            bg: '#ECFDF3',
            border: '#D1FADF',
          },
          warning: {
            DEFAULT: '#B54708',
            bg: '#FFFAEB',
            border: '#FEDF89',
          },
          error: {
            DEFAULT: '#B42318',
            bg: '#FEF3F2',
            border: '#FECDCA',
          },
          info: {
            DEFAULT: '#175CD3',
            bg: '#EFF8FF',
            border: '#B2DDFF',
          },
          neutral: {
            DEFAULT: '#344054',
            bg: '#F2F4F7',
            border: '#EAECF0',
          },
          purple: {
            DEFAULT: '#6941C6',
            bg: '#F9F5FF',
            border: '#E9D7FE',
          },
          pink: {
            DEFAULT: '#C11574',
            bg: '#FDF2FA',
            border: '#FCCEEE',
          },
          orange: {
            DEFAULT: '#B54708',
            bg: '#FFF6ED',
            border: '#FEE4E2',
          }
        }
      },
      boxShadow: {
        'saas': '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
        'card': '0 1px 3px 0 rgba(16, 24, 40, 0.06), 0 1px 2px -1px rgba(16, 24, 40, 0.06)',
        'card-hover': '0 4px 12px 0 rgba(16, 24, 40, 0.08), 0 2px 4px -2px rgba(16, 24, 40, 0.06)',
        'dropdown': '0 4px 16px -2px rgba(16, 24, 40, 0.1), 0 2px 6px -2px rgba(16, 24, 40, 0.06)',
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
