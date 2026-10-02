import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: '#143109',
          hover: '#0e2306',
        },
        sage: {
          DEFAULT: '#b5bfa1',
          tint: 'rgba(181, 191, 161, 0.15)',
        },
        ink: '#000000',
      },
      fontFamily: {
        // var(--font-inter) is set by next/font/google on the public
        // layout's <html> element; admin-dashboard/admin-login aren't
        // wrapped by it, so font-sans there falls through to the literal
        // 'Inter' name, which their own admin-fonts.css @import still
        // loads -- same visual result, different loading mechanism.
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      spacing: {
        section: '112px',
      },
    },
  },
  plugins: [],
}

export default config
