/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./**/*.{html,js}",  // scan semua file di frontend
  ],
  darkMode: 'class',  // enable dark mode via class 'dark' di html/body
  theme: {
    extend: {
      colors: {
        wa: {
          green: '#25D366',       // WhatsApp primary green
          greenDark: '#22C35E',   // hover/active
          greenLight: '#DCF8C6',  // chat bubble received
          teal: '#00A884',        // status bar green
          blue: '#53BDEB',        // link/call blue
          gray: {
            100: '#F0F2F5',
            200: '#E9ECEF',
            300: '#D1D7DB',
            700: '#3B4A54',
            800: '#202C33',
            900: '#111B21',
          },
        },
        primary: '#25D366',
        secondary: '#00A884',
        accent: '#53BDEB',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'wa': '0 4px 20px rgba(37, 211, 102, 0.15)',
        'card': '0 10px 30px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'wa-pattern': 'linear-gradient(135deg, #111B21 0%, #0F172A 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),      // optional: better form styling
    require('@tailwindcss/typography'), // optional: prose class untuk artikel
  ],
}
