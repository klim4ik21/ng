/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#FBF2E8',
          secondary: '#C62828',
        },
        card: {
          red: '#8B2C2C',
          green: '#1F4D36',
          beige: '#E8D3B2',
          darkGreen: '#163A2B',
        },
        text: {
          primary: '#2B1A14',
          secondary: '#6B4A3A',
          inverse: '#FFFFFF',
          muted: '#9E8B7B',
        },
        accent: {
          gold: '#E2B65A',
          cream: '#FFF6EB',
        },
        border: {
          soft: '#E6D6C3',
        },
      },
      fontFamily: {
        primary: ['Inter', 'system-ui', 'sans-serif'],
        decorative: ['Poppins', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        h1: '48px',
        h2: '32px',
        body: '16px',
        small: '14px',
        caption: '12px',
      },
      fontWeight: {
        regular: 400,
        medium: 500,
        bold: 700,
      },
      borderRadius: {
        card: '16px',
        button: '24px',
      },
      boxShadow: {
        card: '0 6px 20px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}

