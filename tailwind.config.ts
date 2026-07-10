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
        sans: ['Inter', 'sans-serif'],
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
